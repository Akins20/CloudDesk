import { Request, Response, NextFunction } from 'express';
import * as stripeService from '../services/stripeService';

/**
 * Create checkout session
 */
export async function createCheckout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { tier, billingCycle } = req.body;

    const checkoutUrl = await stripeService.createCheckoutSession(
      req.customer!.id,
      tier,
      billingCycle
    );

    res.json({
      success: true,
      data: { checkoutUrl },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create billing portal session
 */
export async function createPortal(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const portalUrl = await stripeService.createPortalSession(req.customer!.id);

    res.json({
      success: true,
      data: { portalUrl },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current subscription
 */
export async function getCurrent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subscription = await stripeService.getCurrentSubscription(req.customer!.id);

    res.json({
      success: true,
      data: {
        subscription: subscription
          ? {
              id: subscription._id,
              tier: subscription.tier,
              status: subscription.status,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              billingCycle: subscription.metadata.billingCycle,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
}
