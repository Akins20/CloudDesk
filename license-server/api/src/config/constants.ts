// License tier configuration
export const LICENSE_TIERS = {
  community: {
    name: 'Community',
    maxUsers: 5,
    maxInstances: 10,
    maxConcurrentSessions: 3,
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: {
      sso: false,
      auditLogs: false,
      customBranding: false,
      prioritySupport: false,
      apiAccess: true,
      multiTenant: false,
    },
  },
  team: {
    name: 'Team',
    maxUsers: -1, // unlimited
    maxInstances: -1,
    maxConcurrentSessions: 20,
    price: {
      monthly: 99,
      yearly: 990,
    },
    features: {
      sso: false,
      auditLogs: true,
      customBranding: true,
      prioritySupport: false,
      apiAccess: true,
      multiTenant: false,
    },
  },
  enterprise: {
    name: 'Enterprise',
    maxUsers: -1,
    maxInstances: -1,
    maxConcurrentSessions: -1,
    price: {
      monthly: 299,
      yearly: 2990,
    },
    features: {
      sso: true,
      auditLogs: true,
      customBranding: true,
      prioritySupport: true,
      apiAccess: true,
      multiTenant: true,
    },
  },
} as const;

export type LicenseTier = keyof typeof LICENSE_TIERS;

export const LICENSE_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
} as const;

export type LicenseStatus = (typeof LICENSE_STATUS)[keyof typeof LICENSE_STATUS];

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  INCOMPLETE: 'incomplete',
  TRIALING: 'trialing',
} as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const BILLING_CYCLE = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type BillingCycle = (typeof BILLING_CYCLE)[keyof typeof BILLING_CYCLE];

// Error codes
export const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // License
  LICENSE_NOT_FOUND: 'LICENSE_NOT_FOUND',
  LICENSE_INVALID: 'LICENSE_INVALID',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  LICENSE_REVOKED: 'LICENSE_REVOKED',
  LICENSE_SUSPENDED: 'LICENSE_SUSPENDED',

  // Customer
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  CUSTOMER_EXISTS: 'CUSTOMER_EXISTS',
  CUSTOMER_INACTIVE: 'CUSTOMER_INACTIVE',

  // Subscription
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_INACTIVE: 'SUBSCRIPTION_INACTIVE',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
