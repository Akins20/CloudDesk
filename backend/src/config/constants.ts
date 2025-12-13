// Application Constants

// VNC Configuration
export const VNC_CONSTANTS = {
  DEFAULT_DISPLAY_NUMBER: 1,
  BASE_PORT: 5900, // VNC base port (display :1 = 5901, :2 = 5902, etc.)
  MAX_DISPLAYS: 10,
  DEFAULT_GEOMETRY: '1920x1080',
  DEFAULT_DEPTH: 24,
  PASSWORD_LENGTH: 8,
} as const;

// SSH Configuration
export const SSH_CONSTANTS = {
  DEFAULT_PORT: 22,
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  KEEPALIVE_INTERVAL: 10000, // 10 seconds
  KEEPALIVE_COUNT_MAX: 3,
  COMMAND_TIMEOUT: 60000, // 60 seconds for command execution
} as const;

// Session Configuration
export const SESSION_CONSTANTS = {
  CLEANUP_INTERVAL_MS: 300000, // 5 minutes
  ACTIVITY_UPDATE_INTERVAL_MS: 60000, // 1 minute
  MAX_SESSIONS_PER_USER: 5,
} as const;

// Authentication Constants
export const AUTH_CONSTANTS = {
  BCRYPT_SALT_ROUNDS: 12,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  TOKEN_TYPE: 'Bearer',
} as const;

// Rate Limiting
export const RATE_LIMIT_CONSTANTS = {
  AUTH_WINDOW_MS: 900000, // 15 minutes
  AUTH_MAX_REQUESTS: 5, // 5 login attempts per 15 minutes
  API_WINDOW_MS: 900000, // 15 minutes
  API_MAX_REQUESTS: 100, // 100 requests per 15 minutes
} as const;

// Desktop Environments
export const DESKTOP_ENVIRONMENTS = ['xfce', 'lxde'] as const;
export type DesktopEnvironment = typeof DESKTOP_ENVIRONMENTS[number];

// Cloud Providers
export const CLOUD_PROVIDERS = ['ec2', 'oci'] as const;
export type CloudProvider = typeof CLOUD_PROVIDERS[number];

// Instance Authentication Types
export const AUTH_TYPES = ['key', 'password'] as const;
export type AuthType = typeof AUTH_TYPES[number];

// Session Statuses
export const SESSION_STATUSES = ['connecting', 'connected', 'disconnected', 'error'] as const;
export type SessionStatus = typeof SESSION_STATUSES[number];

// Instance Statuses
export const INSTANCE_STATUSES = ['active', 'inactive'] as const;
export type InstanceStatus = typeof INSTANCE_STATUSES[number];

// User Roles
export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = typeof USER_ROLES[number];

// Audit Log Actions
export const AUDIT_ACTIONS = {
  // Auth actions
  USER_REGISTER: 'USER_REGISTER',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',

  // Instance actions
  INSTANCE_CREATE: 'INSTANCE_CREATE',
  INSTANCE_UPDATE: 'INSTANCE_UPDATE',
  INSTANCE_DELETE: 'INSTANCE_DELETE',
  INSTANCE_TEST_CONNECTION: 'INSTANCE_TEST_CONNECTION',

  // Session actions
  SESSION_CONNECT: 'SESSION_CONNECT',
  SESSION_DISCONNECT: 'SESSION_DISCONNECT',
  SESSION_TIMEOUT: 'SESSION_TIMEOUT',

  // VNC actions
  VNC_INSTALL: 'VNC_INSTALL',
  VNC_START: 'VNC_START',
  VNC_STOP: 'VNC_STOP',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

// Error Codes
export const ERROR_CODES = {
  // General
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',

  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_EXISTS: 'USER_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_INACTIVE: 'USER_INACTIVE',

  // Instance
  INSTANCE_NOT_FOUND: 'INSTANCE_NOT_FOUND',
  INSTANCE_ACCESS_DENIED: 'INSTANCE_ACCESS_DENIED',

  // SSH
  SSH_CONNECTION_FAILED: 'SSH_CONNECTION_FAILED',
  SSH_AUTH_FAILED: 'SSH_AUTH_FAILED',
  SSH_COMMAND_FAILED: 'SSH_COMMAND_FAILED',
  SSH_TIMEOUT: 'SSH_TIMEOUT',

  // VNC
  VNC_NOT_INSTALLED: 'VNC_NOT_INSTALLED',
  VNC_INSTALLATION_FAILED: 'VNC_INSTALLATION_FAILED',
  VNC_START_FAILED: 'VNC_START_FAILED',
  VNC_ALREADY_RUNNING: 'VNC_ALREADY_RUNNING',

  // Session
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_ALREADY_EXISTS: 'SESSION_ALREADY_EXISTS',
  SESSION_LIMIT_REACHED: 'SESSION_LIMIT_REACHED',

  // Tunnel
  TUNNEL_CREATION_FAILED: 'TUNNEL_CREATION_FAILED',
  NO_PORTS_AVAILABLE: 'NO_PORTS_AVAILABLE',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export default {
  VNC_CONSTANTS,
  SSH_CONSTANTS,
  SESSION_CONSTANTS,
  AUTH_CONSTANTS,
  RATE_LIMIT_CONSTANTS,
  DESKTOP_ENVIRONMENTS,
  CLOUD_PROVIDERS,
  AUTH_TYPES,
  SESSION_STATUSES,
  INSTANCE_STATUSES,
  USER_ROLES,
  AUDIT_ACTIONS,
  ERROR_CODES,
  HTTP_STATUS,
};
