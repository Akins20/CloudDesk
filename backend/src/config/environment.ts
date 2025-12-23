import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Environment {
  // Core
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  APP_NAME: string;
  APP_URL: string;

  // Database
  MONGODB_URI: string;
  REDIS_URL: string;

  // Security
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
  ENCRYPTION_KEY: string;
  ADMIN_SECRET: string;

  // Session
  SESSION_TIMEOUT_MINUTES: number;
  MAX_SESSIONS_PER_USER: number;
  SESSION_CLEANUP_INTERVAL_MS: number;

  // VNC
  VNC_DEFAULT_GEOMETRY: string;
  VNC_DEFAULT_DEPTH: number;
  VNC_MAX_DISPLAYS: number;
  VNC_PASSWORD_LENGTH: number;

  // SSH
  SSH_CONNECTION_TIMEOUT: number;
  SSH_KEEPALIVE_INTERVAL: number;
  SSH_KEEPALIVE_COUNT_MAX: number;
  SSH_COMMAND_TIMEOUT: number;

  // Port Ranges
  TUNNEL_PORT_RANGE_START: number;
  TUNNEL_PORT_RANGE_END: number;
  WEBSOCKET_PORT_RANGE_START: number;
  WEBSOCKET_PORT_RANGE_END: number;
  WORKER_PORT_RANGE_START: number;
  WORKER_PORT_RANGE_END: number;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  AUTH_RATE_LIMIT_MAX: number;
  API_RATE_LIMIT_MAX: number;

  // CORS
  CORS_ORIGINS: string;

  // Logging
  LOG_LEVEL: string;
  LOG_FORMAT: string;

  // License
  LICENSE_KEY: string;

  // Docker (for session controller)
  DOCKER_NETWORK: string;
  WORKER_IMAGE: string;
  HEARTBEAT_TIMEOUT: number;
}

function getEnvVariable(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set and no default provided`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set and no default provided`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} is not a valid number`);
  }
  return parsed;
}

function validateNodeEnv(value: string): 'development' | 'production' | 'test' {
  if (value === 'development' || value === 'production' || value === 'test') {
    return value;
  }
  throw new Error(`Invalid NODE_ENV: ${value}. Must be 'development', 'production', or 'test'`);
}

function validateEncryptionKey(key: string): void {
  // AES-256 requires a 32-byte key, which is 64 hex characters
  if (!/^[a-fA-F0-9]{64}$/.test(key)) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes)');
  }
}

function validateJwtSecret(key: string, name: string): void {
  if (key.length < 32) {
    throw new Error(`${name} must be at least 32 characters long`);
  }
}

export function loadEnvironment(): Environment {
  const env: Environment = {
    // Core
    NODE_ENV: validateNodeEnv(getEnvVariable('NODE_ENV', 'development')),
    PORT: getEnvNumber('PORT', 3000),
    APP_NAME: getEnvVariable('APP_NAME', 'CloudDesk'),
    APP_URL: getEnvVariable('APP_URL', 'http://localhost:3000'),

    // Database
    MONGODB_URI: getEnvVariable('MONGODB_URI'),
    REDIS_URL: getEnvVariable('REDIS_URL', 'redis://localhost:6379'),

    // Security
    JWT_ACCESS_SECRET: getEnvVariable('JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET: getEnvVariable('JWT_REFRESH_SECRET'),
    JWT_ACCESS_EXPIRY: getEnvVariable('JWT_ACCESS_EXPIRY', '24h'),
    JWT_REFRESH_EXPIRY: getEnvVariable('JWT_REFRESH_EXPIRY', '7d'),
    ENCRYPTION_KEY: getEnvVariable('ENCRYPTION_KEY'),
    ADMIN_SECRET: getEnvVariable('ADMIN_SECRET', ''),

    // Session
    SESSION_TIMEOUT_MINUTES: getEnvNumber('SESSION_TIMEOUT_MINUTES', 30),
    MAX_SESSIONS_PER_USER: getEnvNumber('MAX_SESSIONS_PER_USER', 5),
    SESSION_CLEANUP_INTERVAL_MS: getEnvNumber('SESSION_CLEANUP_INTERVAL_MS', 300000),

    // VNC
    VNC_DEFAULT_GEOMETRY: getEnvVariable('VNC_DEFAULT_GEOMETRY', '1920x1080'),
    VNC_DEFAULT_DEPTH: getEnvNumber('VNC_DEFAULT_DEPTH', 24),
    VNC_MAX_DISPLAYS: getEnvNumber('VNC_MAX_DISPLAYS', 50),
    VNC_PASSWORD_LENGTH: getEnvNumber('VNC_PASSWORD_LENGTH', 8),

    // SSH
    SSH_CONNECTION_TIMEOUT: getEnvNumber('SSH_CONNECTION_TIMEOUT', 30000),
    SSH_KEEPALIVE_INTERVAL: getEnvNumber('SSH_KEEPALIVE_INTERVAL', 10000),
    SSH_KEEPALIVE_COUNT_MAX: getEnvNumber('SSH_KEEPALIVE_COUNT_MAX', 3),
    SSH_COMMAND_TIMEOUT: getEnvNumber('SSH_COMMAND_TIMEOUT', 60000),

    // Port Ranges
    TUNNEL_PORT_RANGE_START: getEnvNumber('TUNNEL_PORT_RANGE_START', 6000),
    TUNNEL_PORT_RANGE_END: getEnvNumber('TUNNEL_PORT_RANGE_END', 7000),
    WEBSOCKET_PORT_RANGE_START: getEnvNumber('WEBSOCKET_PORT_RANGE_START', 6080),
    WEBSOCKET_PORT_RANGE_END: getEnvNumber('WEBSOCKET_PORT_RANGE_END', 6180),
    WORKER_PORT_RANGE_START: getEnvNumber('WORKER_PORT_RANGE_START', 8080),
    WORKER_PORT_RANGE_END: getEnvNumber('WORKER_PORT_RANGE_END', 8180),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
    RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 300),
    AUTH_RATE_LIMIT_MAX: getEnvNumber('AUTH_RATE_LIMIT_MAX', 180),
    API_RATE_LIMIT_MAX: getEnvNumber('API_RATE_LIMIT_MAX', 900),

    // CORS
    CORS_ORIGINS: getEnvVariable('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001'),

    // Logging
    LOG_LEVEL: getEnvVariable('LOG_LEVEL', 'info'),
    LOG_FORMAT: getEnvVariable('LOG_FORMAT', 'json'),

    // License
    LICENSE_KEY: getEnvVariable('LICENSE_KEY', ''),

    // Docker
    DOCKER_NETWORK: getEnvVariable('DOCKER_NETWORK', 'clouddesk-network'),
    WORKER_IMAGE: getEnvVariable('WORKER_IMAGE', 'clouddesk/session-worker:latest'),
    HEARTBEAT_TIMEOUT: getEnvNumber('HEARTBEAT_TIMEOUT', 60000),
  };

  // Validate secrets
  validateEncryptionKey(env.ENCRYPTION_KEY);
  validateJwtSecret(env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET');
  validateJwtSecret(env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');

  // Validate port ranges
  if (env.TUNNEL_PORT_RANGE_START >= env.TUNNEL_PORT_RANGE_END) {
    throw new Error('TUNNEL_PORT_RANGE_START must be less than TUNNEL_PORT_RANGE_END');
  }
  if (env.WEBSOCKET_PORT_RANGE_START >= env.WEBSOCKET_PORT_RANGE_END) {
    throw new Error('WEBSOCKET_PORT_RANGE_START must be less than WEBSOCKET_PORT_RANGE_END');
  }
  if (env.WORKER_PORT_RANGE_START >= env.WORKER_PORT_RANGE_END) {
    throw new Error('WORKER_PORT_RANGE_START must be less than WORKER_PORT_RANGE_END');
  }

  return env;
}

// Export singleton environment
export const env = loadEnvironment();

export default env;
