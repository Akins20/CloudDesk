import { z } from 'zod';
import { VALIDATION } from './constants';

// Auth Schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`)
    .max(VALIDATION.PASSWORD.MAX_LENGTH, `Password must be at most ${VALIDATION.PASSWORD.MAX_LENGTH} characters`)
    .regex(VALIDATION.PASSWORD.PATTERN, VALIDATION.PASSWORD.REQUIREMENTS),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  firstName: z
    .string()
    .min(VALIDATION.NAME.MIN_LENGTH, `First name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`)
    .max(VALIDATION.NAME.MAX_LENGTH, `First name must be at most ${VALIDATION.NAME.MAX_LENGTH} characters`),
  lastName: z
    .string()
    .min(VALIDATION.NAME.MIN_LENGTH, `Last name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`)
    .max(VALIDATION.NAME.MAX_LENGTH, `Last name must be at most ${VALIDATION.NAME.MAX_LENGTH} characters`),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`)
    .max(VALIDATION.PASSWORD.MAX_LENGTH, `Password must be at most ${VALIDATION.PASSWORD.MAX_LENGTH} characters`)
    .regex(VALIDATION.PASSWORD.PATTERN, VALIDATION.PASSWORD.REQUIREMENTS),
  confirmNewPassword: z
    .string()
    .min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

// Instance Schemas
export const createInstanceSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.INSTANCE_NAME.MIN_LENGTH, 'Instance name is required')
    .max(VALIDATION.INSTANCE_NAME.MAX_LENGTH, `Name must be at most ${VALIDATION.INSTANCE_NAME.MAX_LENGTH} characters`),
  provider: z
    .enum(['ec2', 'oci'], { message: 'Please select a cloud provider' }),
  host: z
    .string()
    .min(VALIDATION.HOST.MIN_LENGTH, 'Host is required')
    .max(VALIDATION.HOST.MAX_LENGTH, `Host must be at most ${VALIDATION.HOST.MAX_LENGTH} characters`),
  port: z
    .number()
    .min(VALIDATION.PORT.MIN, `Port must be at least ${VALIDATION.PORT.MIN}`)
    .max(VALIDATION.PORT.MAX, `Port must be at most ${VALIDATION.PORT.MAX}`)
    .optional()
    .default(VALIDATION.PORT.DEFAULT_SSH),
  username: z
    .string()
    .min(VALIDATION.USERNAME.MIN_LENGTH, 'Username is required')
    .max(VALIDATION.USERNAME.MAX_LENGTH, `Username must be at most ${VALIDATION.USERNAME.MAX_LENGTH} characters`),
  authType: z
    .enum(['key', 'password'], { message: 'Please select an authentication type' }),
  credential: z
    .string()
    .min(1, 'Credential is required'),
  tags: z
    .array(z.string().min(VALIDATION.TAG.MIN_LENGTH).max(VALIDATION.TAG.MAX_LENGTH))
    .max(VALIDATION.TAG.MAX_TAGS, `Maximum ${VALIDATION.TAG.MAX_TAGS} tags allowed`)
    .optional()
    .default([]),
});

export const updateInstanceSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.INSTANCE_NAME.MIN_LENGTH, 'Instance name is required')
    .max(VALIDATION.INSTANCE_NAME.MAX_LENGTH, `Name must be at most ${VALIDATION.INSTANCE_NAME.MAX_LENGTH} characters`)
    .optional(),
  provider: z
    .enum(['ec2', 'oci'])
    .optional(),
  host: z
    .string()
    .min(VALIDATION.HOST.MIN_LENGTH, 'Host is required')
    .max(VALIDATION.HOST.MAX_LENGTH, `Host must be at most ${VALIDATION.HOST.MAX_LENGTH} characters`)
    .optional(),
  port: z
    .number()
    .min(VALIDATION.PORT.MIN, `Port must be at least ${VALIDATION.PORT.MIN}`)
    .max(VALIDATION.PORT.MAX, `Port must be at most ${VALIDATION.PORT.MAX}`)
    .optional(),
  username: z
    .string()
    .min(VALIDATION.USERNAME.MIN_LENGTH, 'Username is required')
    .max(VALIDATION.USERNAME.MAX_LENGTH, `Username must be at most ${VALIDATION.USERNAME.MAX_LENGTH} characters`)
    .optional(),
  authType: z
    .enum(['key', 'password'])
    .optional(),
  credential: z
    .string()
    .min(1, 'Credential is required')
    .optional(),
  tags: z
    .array(z.string().min(VALIDATION.TAG.MIN_LENGTH).max(VALIDATION.TAG.MAX_LENGTH))
    .max(VALIDATION.TAG.MAX_TAGS, `Maximum ${VALIDATION.TAG.MAX_TAGS} tags allowed`)
    .optional(),
  status: z
    .enum(['active', 'inactive'])
    .optional(),
});

// Session Schemas
export const connectSessionSchema = z.object({
  instanceId: z
    .string()
    .min(1, 'Instance ID is required'),
  desktopEnvironment: z
    .enum(['xfce', 'lxde'])
    .optional()
    .default('xfce'),
});

// Query Schemas
export const instanceQuerySchema = z.object({
  search: z.string().optional(),
  provider: z.enum(['ec2', 'oci']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const paginationQuerySchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Type Exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type CreateInstanceFormData = z.infer<typeof createInstanceSchema>;
export type UpdateInstanceFormData = z.infer<typeof updateInstanceSchema>;
export type ConnectSessionFormData = z.infer<typeof connectSessionSchema>;
export type InstanceQueryParams = z.infer<typeof instanceQuerySchema>;
export type PaginationQueryParams = z.infer<typeof paginationQuerySchema>;
