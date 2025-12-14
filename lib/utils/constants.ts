// API Configuration
// IMPORTANT: Use HTTPS in production to avoid mixed content errors
// Set NEXT_PUBLIC_API_URL in .env.local or Vercel environment variables
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://18.209.65.32';
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },
  // Instances
  INSTANCES: {
    BASE: '/api/instances',
    BY_ID: (id: string) => `/api/instances/${id}`,
    TEST_CONNECTION: (id: string) => `/api/instances/${id}/test-connection`,
  },
  // Sessions
  SESSIONS: {
    BASE: '/api/sessions',
    BY_ID: (id: string) => `/api/sessions/${id}`,
    CONNECT: '/api/sessions/connect',
    DISCONNECT: (id: string) => `/api/sessions/disconnect/${id}`,
    STATS: '/api/sessions/stats',
    HISTORY: '/api/sessions/history',
    ACTIVE: '/api/sessions/active',
    DISCONNECT_ALL: '/api/sessions/disconnect-all',
  },
  // Users
  USERS: {
    PROFILE: '/api/users/profile',
    DELETE_ACCOUNT: '/api/users/account',
  },
  // Health
  HEALTH: '/api/health',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'clouddesk_access_token',
  REFRESH_TOKEN: 'clouddesk_refresh_token',
  USER: 'clouddesk_user',
  THEME: 'clouddesk_theme',
  SIDEBAR_COLLAPSED: 'clouddesk_sidebar_collapsed',
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    REQUIREMENTS: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  INSTANCE_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  HOST: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
  },
  USERNAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 64,
  },
  PORT: {
    MIN: 1,
    MAX: 65535,
    DEFAULT_SSH: 22,
  },
  TAG: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    MAX_TAGS: 10,
  },
} as const;

// Status Mappings
export const STATUS_COLORS = {
  SESSION: {
    connecting: 'warning',
    connected: 'success',
    disconnected: 'default',
    error: 'error',
  },
  INSTANCE: {
    active: 'success',
    inactive: 'default',
  },
} as const;

export const STATUS_LABELS = {
  SESSION: {
    connecting: 'Connecting',
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error',
  },
  INSTANCE: {
    active: 'Active',
    inactive: 'Inactive',
  },
} as const;

// Cloud Providers
export const CLOUD_PROVIDERS = {
  ec2: { label: 'Amazon EC2', icon: 'aws' },
  oci: { label: 'Oracle Cloud', icon: 'oracle' },
} as const;

// Auth Types
export const AUTH_TYPES = {
  key: { label: 'SSH Key', description: 'Use SSH private key for authentication' },
  password: { label: 'Password', description: 'Use password for authentication' },
} as const;

// Desktop Environments
export const DESKTOP_ENVIRONMENTS = {
  xfce: { label: 'XFCE', description: 'Lightweight and fast' },
  lxde: { label: 'LXDE', description: 'Minimal resource usage' },
} as const;

// Connection Steps
export const CONNECTION_STEPS = [
  { id: 'init', message: 'Initializing connection...' },
  { id: 'ssh', message: 'Establishing SSH tunnel...' },
  { id: 'vnc', message: 'Starting VNC server...' },
  { id: 'websocket', message: 'Setting up WebSocket proxy...' },
  { id: 'connect', message: 'Connecting to desktop...' },
] as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 25, 50, 100],
} as const;

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  API_REQUEST: 30000,
  CONNECTION: 60000,
  SESSION_IDLE: 30 * 60 * 1000, // 30 minutes
  TOKEN_REFRESH_BUFFER: 5 * 60 * 1000, // 5 minutes before expiry
  TOAST_DURATION: 5000,
  DEBOUNCE: 300,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  CONNECTION_FAILED: 'Failed to connect to the instance. Please check the instance settings.',
  SESSION_TIMEOUT: 'Your session has timed out due to inactivity.',
  DELETE_FAILED: 'Failed to delete. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Welcome back!',
  REGISTER: 'Account created successfully. Please log in.',
  LOGOUT: 'You have been logged out.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  INSTANCE_CREATED: 'Instance created successfully.',
  INSTANCE_UPDATED: 'Instance updated successfully.',
  INSTANCE_DELETED: 'Instance deleted successfully.',
  DELETE_SUCCESS: 'Deleted successfully.',
  CONNECTION_SUCCESS: 'Connected to instance.',
  DISCONNECTION_SUCCESS: 'Disconnected from instance.',
} as const;

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  INSTANCES: '/instances',
  INSTANCE_NEW: '/instances/new',
  INSTANCE_EDIT: (id: string) => `/instances/${id}/edit`,
  SESSIONS: '/sessions',
  DESKTOP: (sessionId: string) => `/desktop/${sessionId}`,
  SETTINGS: '/settings',
} as const;

// Public Routes (no auth required)
export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
] as const;
