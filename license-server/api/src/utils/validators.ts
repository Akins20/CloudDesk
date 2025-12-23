import Joi from 'joi';
import { BILLING_CYCLE, LicenseTier } from '../config/constants';

// Customer schemas
export const registerCustomerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  organizationName: Joi.string().min(1).max(200).required(),
});

export const loginCustomerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateCustomerSchema = Joi.object({
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
  organizationName: Joi.string().min(1).max(200),
}).min(1);

// License schemas
export const validateLicenseSchema = Joi.object({
  licenseKey: Joi.string().required(),
  instanceId: Joi.string().uuid().required(),
  hostname: Joi.string().max(255).required(),
});

export const generateLicenseSchema = Joi.object({
  customerId: Joi.string().required(),
  tier: Joi.string()
    .valid('community', 'team', 'enterprise')
    .required() as Joi.StringSchema<LicenseTier>,
  expiresAt: Joi.date().iso().optional(),
  notes: Joi.string().max(500).optional(),
});

// Subscription schemas
export const checkoutSchema = Joi.object({
  tier: Joi.string().valid('team', 'enterprise').required(),
  billingCycle: Joi.string()
    .valid(BILLING_CYCLE.MONTHLY, BILLING_CYCLE.YEARLY)
    .default(BILLING_CYCLE.MONTHLY),
});

export const upgradeSchema = Joi.object({
  tier: Joi.string().valid('team', 'enterprise').required(),
});

// Admin schemas
export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const adminUpdateLicenseSchema = Joi.object({
  status: Joi.string().valid('active', 'revoked', 'suspended'),
  expiresAt: Joi.date().iso().allow(null),
  notes: Joi.string().max(500),
}).min(1);

// Pagination schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('-createdAt'),
});

// Search schema
export const searchSchema = Joi.object({
  q: Joi.string().max(100),
  status: Joi.string(),
  tier: Joi.string().valid('community', 'team', 'enterprise'),
});
