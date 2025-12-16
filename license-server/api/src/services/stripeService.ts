import Stripe from 'stripe';
import { Types } from 'mongoose';
import { stripe, getPriceId } from '../config/stripe';
import { env } from '../config/environment';
import { Customer } from '../models/Customer';
import { Subscription, ISubscription } from '../models/Subscription';
import { License } from '../models/License';
import { AuditLog } from '../models/AuditLog';
import { NotFoundError, ValidationError } from '../utils/errors';
import { ERROR_CODES, LicenseTier, LICENSE_STATUS, SUBSCRIPTION_STATUS, BillingCycle } from '../config/constants';
import { createLicense, suspendLicense, reactivateLicense } from './licenseService';
import { updateStripeCustomerId } from './customerService';
import { sendLicenseKeyEmail, sendPaymentFailedEmail } from './emailService';
import { logger } from '../utils/logger';

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  tier: 'team' | 'enterprise',
  billingCycle: BillingCycle
): Promise<string> {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new NotFoundError('Customer not found', ERROR_CODES.CUSTOMER_NOT_FOUND);
  }

  // Get or create Stripe customer
  let stripeCustomerId = customer.stripeCustomerId;

  if (!stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      email: customer.email,
      name: `${customer.firstName} ${customer.lastName}`,
      metadata: {
        customerId: customer._id.toString(),
        organizationName: customer.organizationName,
      },
    });
    stripeCustomerId = stripeCustomer.id;
    await updateStripeCustomerId(customerId, stripeCustomerId);
  }

  // Get price ID
  const priceId = getPriceId(tier, billingCycle);

  if (!priceId) {
    throw new ValidationError(`Price not configured for ${tier} ${billingCycle}`);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${env.PORTAL_URL}/dashboard?checkout=success`,
    cancel_url: `${env.PORTAL_URL}/pricing?checkout=canceled`,
    metadata: {
      customerId: customer._id.toString(),
      tier,
      billingCycle,
    },
    subscription_data: {
      metadata: {
        customerId: customer._id.toString(),
        tier,
        billingCycle,
      },
    },
  });

  logger.info(`Checkout session created for customer ${customerId}, tier ${tier}`);

  return session.url!;
}

/**
 * Create a Stripe billing portal session
 */
export async function createPortalSession(customerId: string): Promise<string> {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new NotFoundError('Customer not found', ERROR_CODES.CUSTOMER_NOT_FOUND);
  }

  if (!customer.stripeCustomerId) {
    throw new ValidationError('No billing account found. Please subscribe first.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: `${env.PORTAL_URL}/dashboard`,
  });

  return session.url;
}

/**
 * Get current subscription for customer
 */
export async function getCurrentSubscription(customerId: string): Promise<ISubscription | null> {
  return Subscription.findOne({
    customerId: new Types.ObjectId(customerId),
    status: { $in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIALING, SUBSCRIPTION_STATUS.PAST_DUE] },
  }).sort({ createdAt: -1 });
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(
  rawBody: Buffer,
  signature: string
): Promise<void> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    throw new ValidationError('Invalid webhook signature');
  }

  logger.info(`Stripe webhook received: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    default:
      logger.debug(`Unhandled webhook event: ${event.type}`);
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
  const { customerId, tier, billingCycle } = session.metadata || {};

  if (!customerId || !tier || !session.subscription) {
    logger.error('Checkout session missing metadata', session.id);
    return;
  }

  // Fetch full subscription details
  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Check if subscription already exists
  const existingSubscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id,
  });

  if (existingSubscription) {
    logger.info(`Subscription already exists: ${stripeSubscription.id}`);
    return;
  }

  // Create subscription record
  const subscription = await Subscription.create({
    customerId: new Types.ObjectId(customerId),
    stripeSubscriptionId: stripeSubscription.id,
    stripeCustomerId: session.customer as string,
    tier: tier as 'team' | 'enterprise',
    status: SUBSCRIPTION_STATUS.ACTIVE,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    metadata: {
      priceId: stripeSubscription.items.data[0]?.price.id || '',
      productId: stripeSubscription.items.data[0]?.price.product as string || '',
      billingCycle: billingCycle as BillingCycle,
    },
  });

  // Generate license key
  const { license, key } = await createLicense({
    customerId,
    tier: tier as LicenseTier,
    subscriptionId: subscription._id.toString(),
  });

  // Audit log
  await AuditLog.create({
    entityType: 'subscription',
    entityId: subscription._id,
    action: 'subscription.created',
    actorType: 'stripe',
    details: { tier, stripeSubscriptionId: stripeSubscription.id },
  });

  // Send license key email
  const customer = await Customer.findById(customerId);
  if (customer) {
    await sendLicenseKeyEmail(customer.email, customer.firstName, key, tier as LicenseTier);
  }

  logger.info(`Subscription created: ${subscription._id}, license: ${license._id}`);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id,
  });

  if (!subscription) {
    logger.warn(`Subscription not found: ${stripeSubscription.id}`);
    return;
  }

  // Update subscription
  subscription.status = stripeSubscription.status as ISubscription['status'];
  subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
  subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
  subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;

  if (stripeSubscription.canceled_at) {
    subscription.canceledAt = new Date(stripeSubscription.canceled_at * 1000);
  }

  await subscription.save();

  // Update license expiry if subscription will cancel
  if (stripeSubscription.cancel_at_period_end) {
    await License.updateOne(
      { subscriptionId: subscription._id },
      { $set: { expiresAt: subscription.currentPeriodEnd } }
    );
  }

  logger.info(`Subscription updated: ${subscription._id}, status: ${subscription.status}`);
}

/**
 * Handle subscription deleted (canceled)
 */
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id,
  });

  if (!subscription) {
    logger.warn(`Subscription not found for deletion: ${stripeSubscription.id}`);
    return;
  }

  subscription.status = SUBSCRIPTION_STATUS.CANCELED;
  subscription.canceledAt = new Date();
  await subscription.save();

  // Expire the license
  await License.updateOne(
    { subscriptionId: subscription._id },
    {
      $set: {
        status: LICENSE_STATUS.EXPIRED,
        expiresAt: new Date(),
      },
    }
  );

  // Audit log
  await AuditLog.create({
    entityType: 'subscription',
    entityId: subscription._id,
    action: 'subscription.canceled',
    actorType: 'stripe',
  });

  logger.info(`Subscription canceled: ${subscription._id}`);
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.subscription) return;

  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription as string,
  });

  if (!subscription) {
    logger.warn(`Subscription not found for failed payment: ${invoice.subscription}`);
    return;
  }

  subscription.status = SUBSCRIPTION_STATUS.PAST_DUE;
  await subscription.save();

  // Suspend the license
  const license = await License.findOne({ subscriptionId: subscription._id });
  if (license) {
    await suspendLicense(license._id.toString(), 'Payment failed');
  }

  // Send notification
  const customer = await Customer.findById(subscription.customerId);
  if (customer) {
    await sendPaymentFailedEmail(customer.email, customer.firstName);
  }

  logger.info(`Payment failed for subscription: ${subscription._id}`);
}

/**
 * Handle payment succeeded (reactivate if was past due)
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.subscription) return;

  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription as string,
  });

  if (!subscription || subscription.status !== SUBSCRIPTION_STATUS.PAST_DUE) {
    return;
  }

  subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
  await subscription.save();

  // Reactivate the license
  const license = await License.findOne({ subscriptionId: subscription._id });
  if (license && license.status === LICENSE_STATUS.SUSPENDED) {
    await reactivateLicense(license._id.toString());
  }

  logger.info(`Payment succeeded, subscription reactivated: ${subscription._id}`);
}
