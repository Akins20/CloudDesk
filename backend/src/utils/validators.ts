import Joi from 'joi';
import {
  CLOUD_PROVIDERS,
  AUTH_TYPES,
  DESKTOP_ENVIRONMENTS,
  AUTH_CONSTANTS,
} from '../config/constants';

// Custom Joi extensions
const customJoi = Joi.extend((joi) => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.objectId': '{{#label}} must be a valid MongoDB ObjectId',
  },
  rules: {
    objectId: {
      validate(value, helpers) {
        if (!/^[0-9a-fA-F]{24}$/.test(value)) {
          return helpers.error('string.objectId');
        }
        return value;
      },
    },
  },
}));

// Auth Schemas
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH)
    .max(AUTH_CONSTANTS.MAX_PASSWORD_LENGTH)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': `Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters`,
      'string.max': `Password must be at most ${AUTH_CONSTANTS.MAX_PASSWORD_LENGTH} characters`,
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
  firstName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .trim()
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name must be at most 50 characters',
      'any.required': 'First name is required',
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .trim()
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name must be at most 50 characters',
      'any.required': 'Last name is required',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required',
    }),
});

// Instance Schemas
export const createInstanceSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .required()
    .trim()
    .messages({
      'string.min': 'Instance name must be at least 3 characters',
      'string.max': 'Instance name must be at most 50 characters',
      'any.required': 'Instance name is required',
    }),
  provider: Joi.string()
    .valid(...CLOUD_PROVIDERS)
    .required()
    .messages({
      'any.only': `Provider must be one of: ${CLOUD_PROVIDERS.join(', ')}`,
      'any.required': 'Provider is required',
    }),
  host: Joi.string()
    .required()
    .trim()
    .custom((value, helpers) => {
      // Validate IP address or hostname
      const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

      if (!ipv4Pattern.test(value) && !ipv6Pattern.test(value) && !hostnamePattern.test(value)) {
        return helpers.error('any.invalid');
      }

      // Validate IPv4 octets
      if (ipv4Pattern.test(value)) {
        const octets = value.split('.').map(Number);
        if (octets.some((octet: number) => octet > 255)) {
          return helpers.error('any.invalid');
        }
      }

      return value;
    })
    .messages({
      'any.required': 'Host is required',
      'any.invalid': 'Please provide a valid IP address or hostname',
    }),
  port: Joi.number()
    .integer()
    .min(1)
    .max(65535)
    .default(22)
    .messages({
      'number.min': 'Port must be at least 1',
      'number.max': 'Port must be at most 65535',
    }),
  username: Joi.string()
    .min(1)
    .max(32)
    .required()
    .trim()
    .messages({
      'string.min': 'Username must be at least 1 character',
      'string.max': 'Username must be at most 32 characters',
      'any.required': 'Username is required',
    }),
  authType: Joi.string()
    .valid(...AUTH_TYPES)
    .required()
    .messages({
      'any.only': `Auth type must be one of: ${AUTH_TYPES.join(', ')}`,
      'any.required': 'Auth type is required',
    }),
  credential: Joi.string()
    .required()
    .messages({
      'any.required': 'Credential (SSH key or password) is required',
    }),
  tags: Joi.array()
    .items(Joi.string().min(1).max(30).trim())
    .max(10)
    .default([])
    .messages({
      'array.max': 'Maximum 10 tags allowed',
    }),
});

export const updateInstanceSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .trim(),
  provider: Joi.string()
    .valid(...CLOUD_PROVIDERS),
  host: Joi.string()
    .trim()
    .custom((value, helpers) => {
      const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

      if (!ipv4Pattern.test(value) && !ipv6Pattern.test(value) && !hostnamePattern.test(value)) {
        return helpers.error('any.invalid');
      }

      if (ipv4Pattern.test(value)) {
        const octets = value.split('.').map(Number);
        if (octets.some((octet: number) => octet > 255)) {
          return helpers.error('any.invalid');
        }
      }

      return value;
    }),
  port: Joi.number()
    .integer()
    .min(1)
    .max(65535),
  username: Joi.string()
    .min(1)
    .max(32)
    .trim(),
  authType: Joi.string()
    .valid(...AUTH_TYPES),
  credential: Joi.string(),
  tags: Joi.array()
    .items(Joi.string().min(1).max(30).trim())
    .max(10),
  status: Joi.string()
    .valid('active', 'inactive'),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// Session Schemas
export const connectSessionSchema = Joi.object({
  instanceId: customJoi.string()
    .objectId()
    .required()
    .messages({
      'any.required': 'Instance ID is required',
    }),
  desktopEnvironment: Joi.string()
    .valid(...DESKTOP_ENVIRONMENTS)
    .default('xfce')
    .messages({
      'any.only': `Desktop environment must be one of: ${DESKTOP_ENVIRONMENTS.join(', ')}`,
    }),
});

// Param Schemas
export const objectIdParamSchema = Joi.object({
  id: customJoi.string()
    .objectId()
    .required()
    .messages({
      'any.required': 'ID is required',
      'string.objectId': 'Invalid ID format',
    }),
});

export const sessionIdParamSchema = Joi.object({
  sessionId: customJoi.string()
    .objectId()
    .required()
    .messages({
      'any.required': 'Session ID is required',
      'string.objectId': 'Invalid session ID format',
    }),
});

// Query Schemas
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  sortBy: Joi.string()
    .default('createdAt'),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc'),
});

export const instanceQuerySchema = paginationSchema.keys({
  search: Joi.string()
    .max(100)
    .trim(),
  provider: Joi.string()
    .valid(...CLOUD_PROVIDERS),
  status: Joi.string()
    .valid('active', 'inactive'),
  tags: Joi.alternatives()
    .try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
});

// Password change schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required',
    }),
  newPassword: Joi.string()
    .min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH)
    .max(AUTH_CONSTANTS.MAX_PASSWORD_LENGTH)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': `New password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters`,
      'string.max': `New password must be at most ${AUTH_CONSTANTS.MAX_PASSWORD_LENGTH} characters`,
      'string.pattern.base':
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required',
    }),
});

export default {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  createInstanceSchema,
  updateInstanceSchema,
  connectSessionSchema,
  objectIdParamSchema,
  sessionIdParamSchema,
  paginationSchema,
  instanceQuerySchema,
  changePasswordSchema,
};
