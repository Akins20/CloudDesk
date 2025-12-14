import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  REDIS_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
  ENCRYPTION_KEY: string;
  TUNNEL_PORT_RANGE_START: number;
  TUNNEL_PORT_RANGE_END: number;
  WEBSOCKET_PORT_RANGE_START: number;
  WEBSOCKET_PORT_RANGE_END: number;
  SESSION_TIMEOUT_MINUTES: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  CORS_ORIGINS: string; // Comma-separated list of allowed origins
  LOG_LEVEL: string;
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
    NODE_ENV: validateNodeEnv(getEnvVariable('NODE_ENV', 'development')),
    PORT: getEnvNumber('PORT', 3000),
    MONGODB_URI: getEnvVariable('MONGODB_URI'),
    REDIS_URL: getEnvVariable('REDIS_URL', 'redis://localhost:6379'),
    JWT_ACCESS_SECRET: getEnvVariable('JWT_ACCESS_SECRET'),
    JWT_REFRESH_SECRET: getEnvVariable('JWT_REFRESH_SECRET'),
    JWT_ACCESS_EXPIRY: getEnvVariable('JWT_ACCESS_EXPIRY', '15m'),
    JWT_REFRESH_EXPIRY: getEnvVariable('JWT_REFRESH_EXPIRY', '7d'),
    ENCRYPTION_KEY: getEnvVariable('ENCRYPTION_KEY'),
    TUNNEL_PORT_RANGE_START: getEnvNumber('TUNNEL_PORT_RANGE_START', 6000),
    TUNNEL_PORT_RANGE_END: getEnvNumber('TUNNEL_PORT_RANGE_END', 7000),
    WEBSOCKET_PORT_RANGE_START: getEnvNumber('WEBSOCKET_PORT_RANGE_START', 6080),
    WEBSOCKET_PORT_RANGE_END: getEnvNumber('WEBSOCKET_PORT_RANGE_END', 6180),
    SESSION_TIMEOUT_MINUTES: getEnvNumber('SESSION_TIMEOUT_MINUTES', 30),
    RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
    RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    CORS_ORIGINS: getEnvVariable('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001,https://cloud-desk-tawny.vercel.app'),
    LOG_LEVEL: getEnvVariable('LOG_LEVEL', 'info'),
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

  return env;
}

// Export singleton environment
export const env = loadEnvironment();

export default env;
