import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Environment {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  API_URL: string;

  // Database
  MONGODB_URI: string;
  REDIS_URL?: string;

  // JWT
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;

  // License Signing
  LICENSE_PRIVATE_KEY: string;
  LICENSE_PUBLIC_KEY: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_TEAM_MONTHLY_PRICE_ID: string;
  STRIPE_TEAM_YEARLY_PRICE_ID: string;
  STRIPE_ENTERPRISE_MONTHLY_PRICE_ID: string;
  STRIPE_ENTERPRISE_YEARLY_PRICE_ID: string;

  // Admin
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;

  // URLs
  PORTAL_URL: string;
  CLOUDDESK_URL: string;

  // Email
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM: string;

  // CORS
  CORS_ORIGINS: string[];

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
}

function loadEnvironment(): Environment {
  const requiredVars = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'MONGODB_URI',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    // Server
    NODE_ENV: (process.env.NODE_ENV as Environment['NODE_ENV']) || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),
    API_URL: process.env.API_URL || 'http://localhost:3001',

    // Database
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/clouddesk-licenses',
    REDIS_URL: process.env.REDIS_URL,

    // JWT
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

    // License Signing
    LICENSE_PRIVATE_KEY: process.env.LICENSE_PRIVATE_KEY || '',
    LICENSE_PUBLIC_KEY: process.env.LICENSE_PUBLIC_KEY || '',

    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    STRIPE_TEAM_MONTHLY_PRICE_ID: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID || '',
    STRIPE_TEAM_YEARLY_PRICE_ID: process.env.STRIPE_TEAM_YEARLY_PRICE_ID || '',
    STRIPE_ENTERPRISE_MONTHLY_PRICE_ID: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    STRIPE_ENTERPRISE_YEARLY_PRICE_ID: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',

    // Admin
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@clouddesk.io',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'change-this-password',

    // URLs
    PORTAL_URL: process.env.PORTAL_URL || 'http://localhost:3002',
    CLOUDDESK_URL: process.env.CLOUDDESK_URL || 'https://clouddesk.io',

    // Email
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM || 'noreply@clouddesk.io',

    // CORS
    CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || ['http://localhost:3002'],

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  };
}

export const env = loadEnvironment();
