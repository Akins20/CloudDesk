import { Types } from 'mongoose';
import { Customer, ICustomer } from '../models/Customer';
import { License } from '../models/License';
import { Subscription } from '../models/Subscription';
import { AuditLog } from '../models/AuditLog';
import { ValidationError, NotFoundError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';
import { logger } from '../utils/logger';
import { generateTokens, AuthTokens } from './authService';

export interface CreateCustomerData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface UpdateCustomerData {
  firstName?: string;
  lastName?: string;
  organizationName?: string;
}

/**
 * Create a new customer
 */
export async function createCustomer(
  data: CreateCustomerData,
  ipAddress?: string
): Promise<{ customer: ICustomer; tokens: AuthTokens }> {
  // Check if email already exists
  const existing = await Customer.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new ValidationError('Email already registered', { field: 'email' });
  }

  // Create customer
  const customer = await Customer.create({
    email: data.email.toLowerCase(),
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    organizationName: data.organizationName,
  });

  // Generate tokens
  const tokens = generateTokens({
    id: customer._id.toString(),
    email: customer.email,
    type: 'customer',
    tokenVersion: customer.refreshTokenVersion,
  });

  // Audit log
  await AuditLog.create({
    entityType: 'customer',
    entityId: customer._id,
    action: 'customer.created',
    actorType: 'customer',
    actorId: customer._id,
    details: { email: customer.email, organizationName: customer.organizationName },
    ipAddress,
  });

  logger.info(`Customer created: ${customer.email}`);

  return { customer, tokens };
}

/**
 * Get customer by ID
 */
export async function getCustomerById(customerId: string): Promise<ICustomer> {
  if (!Types.ObjectId.isValid(customerId)) {
    throw new NotFoundError('Customer not found', ERROR_CODES.CUSTOMER_NOT_FOUND);
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new NotFoundError('Customer not found', ERROR_CODES.CUSTOMER_NOT_FOUND);
  }

  return customer;
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(email: string): Promise<ICustomer | null> {
  return Customer.findOne({ email: email.toLowerCase() });
}

/**
 * Update customer profile
 */
export async function updateCustomer(
  customerId: string,
  data: UpdateCustomerData,
  ipAddress?: string
): Promise<ICustomer> {
  const customer = await getCustomerById(customerId);

  // Update fields
  if (data.firstName) customer.firstName = data.firstName;
  if (data.lastName) customer.lastName = data.lastName;
  if (data.organizationName) customer.organizationName = data.organizationName;

  await customer.save();

  // Audit log
  await AuditLog.create({
    entityType: 'customer',
    entityId: customer._id,
    action: 'customer.updated',
    actorType: 'customer',
    actorId: customer._id,
    details: data,
    ipAddress,
  });

  logger.info(`Customer updated: ${customer.email}`);

  return customer;
}

/**
 * Get customer's licenses
 */
export async function getCustomerLicenses(customerId: string) {
  const customer = await getCustomerById(customerId);

  const licenses = await License.find({ customerId: customer._id })
    .select('-key') // Don't return full key
    .sort({ createdAt: -1 });

  // Mask license keys for security
  return licenses.map((license) => ({
    id: license._id,
    keyPreview: `${license.tier.toUpperCase()}-****-****-****-${license.keyHash.substring(0, 4).toUpperCase()}`,
    tier: license.tier,
    status: license.status,
    expiresAt: license.expiresAt,
    createdAt: license.createdAt,
    metadata: {
      lastValidatedAt: license.metadata.lastValidatedAt,
      validationCount: license.metadata.validationCount,
    },
  }));
}

/**
 * Get customer's active subscription
 */
export async function getCustomerSubscription(customerId: string) {
  const customer = await getCustomerById(customerId);

  return Subscription.findOne({
    customerId: customer._id,
    status: { $in: ['active', 'trialing', 'past_due'] },
  }).sort({ createdAt: -1 });
}

/**
 * Update customer's Stripe customer ID
 */
export async function updateStripeCustomerId(
  customerId: string,
  stripeCustomerId: string
): Promise<ICustomer> {
  const customer = await getCustomerById(customerId);
  customer.stripeCustomerId = stripeCustomerId;
  await customer.save();
  return customer;
}

/**
 * Deactivate customer account
 */
export async function deactivateCustomer(
  customerId: string,
  reason: string,
  adminId?: string
): Promise<ICustomer> {
  const customer = await getCustomerById(customerId);
  customer.isActive = false;
  await customer.save();

  // Audit log
  await AuditLog.create({
    entityType: 'customer',
    entityId: customer._id,
    action: 'customer.deactivated',
    actorType: adminId ? 'admin' : 'system',
    actorId: adminId ? new Types.ObjectId(adminId) : undefined,
    details: { reason },
  });

  logger.info(`Customer deactivated: ${customer.email}, reason: ${reason}`);

  return customer;
}

/**
 * Get customers with pagination (admin)
 */
export async function getCustomers(
  page: number = 1,
  limit: number = 20,
  search?: string
) {
  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { organizationName: { $regex: search, $options: 'i' } },
    ];
  }

  const [customers, total] = await Promise.all([
    Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Customer.countDocuments(query),
  ]);

  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
