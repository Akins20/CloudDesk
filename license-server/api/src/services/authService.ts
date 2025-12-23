import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/environment';
import { Customer, ICustomer } from '../models/Customer';
import { Admin, IAdmin } from '../models/Admin';
import { UnauthorizedError, NotFoundError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';
import { logger } from '../utils/logger';

export interface TokenPayload {
  id: string;
  email: string;
  type: 'customer' | 'admin';
  tokenVersion?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access and refresh tokens
 */
export function generateTokens(payload: TokenPayload): AuthTokens {
  // Note: expiresIn accepts formats like "15m", "7d", or seconds as number
  const accessToken = jwt.sign(
    { ...payload, type: payload.type },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY } as SignOptions
  );

  const refreshToken = jwt.sign(
    { ...payload, type: payload.type },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY } as SignOptions
  );

  return { accessToken, refreshToken };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired', ERROR_CODES.TOKEN_EXPIRED);
    }
    throw new UnauthorizedError('Invalid token', ERROR_CODES.TOKEN_INVALID);
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token expired', ERROR_CODES.TOKEN_EXPIRED);
    }
    throw new UnauthorizedError('Invalid refresh token', ERROR_CODES.TOKEN_INVALID);
  }
}

/**
 * Refresh tokens for customer
 */
export async function refreshCustomerTokens(refreshToken: string): Promise<AuthTokens> {
  const payload = verifyRefreshToken(refreshToken);

  if (payload.type !== 'customer') {
    throw new UnauthorizedError('Invalid token type', ERROR_CODES.TOKEN_INVALID);
  }

  const customer = await Customer.findById(payload.id);
  if (!customer) {
    throw new NotFoundError('Customer not found', ERROR_CODES.CUSTOMER_NOT_FOUND);
  }

  if (!customer.isActive) {
    throw new UnauthorizedError('Account is inactive', ERROR_CODES.CUSTOMER_INACTIVE);
  }

  // Verify token version (allows invalidating all tokens)
  if (payload.tokenVersion !== undefined && payload.tokenVersion !== customer.refreshTokenVersion) {
    throw new UnauthorizedError('Token has been revoked', ERROR_CODES.TOKEN_INVALID);
  }

  return generateTokens({
    id: customer._id.toString(),
    email: customer.email,
    type: 'customer',
    tokenVersion: customer.refreshTokenVersion,
  });
}

/**
 * Refresh tokens for admin
 */
export async function refreshAdminTokens(refreshToken: string): Promise<AuthTokens> {
  const payload = verifyRefreshToken(refreshToken);

  if (payload.type !== 'admin') {
    throw new UnauthorizedError('Invalid token type', ERROR_CODES.TOKEN_INVALID);
  }

  const admin = await Admin.findById(payload.id);
  if (!admin) {
    throw new NotFoundError('Admin not found', ERROR_CODES.CUSTOMER_NOT_FOUND);
  }

  if (!admin.isActive) {
    throw new UnauthorizedError('Account is inactive', ERROR_CODES.CUSTOMER_INACTIVE);
  }

  if (payload.tokenVersion !== undefined && payload.tokenVersion !== admin.refreshTokenVersion) {
    throw new UnauthorizedError('Token has been revoked', ERROR_CODES.TOKEN_INVALID);
  }

  return generateTokens({
    id: admin._id.toString(),
    email: admin.email,
    type: 'admin',
    tokenVersion: admin.refreshTokenVersion,
  });
}

/**
 * Authenticate customer
 */
export async function authenticateCustomer(
  email: string,
  password: string
): Promise<{ customer: ICustomer; tokens: AuthTokens }> {
  const customer = await Customer.findOne({ email: email.toLowerCase() }).select('+password');

  if (!customer) {
    throw new UnauthorizedError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
  }

  if (!customer.isActive) {
    throw new UnauthorizedError('Account is inactive', ERROR_CODES.CUSTOMER_INACTIVE);
  }

  const isMatch = await customer.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
  }

  const tokens = generateTokens({
    id: customer._id.toString(),
    email: customer.email,
    type: 'customer',
    tokenVersion: customer.refreshTokenVersion,
  });

  logger.info(`Customer logged in: ${customer.email}`);

  return { customer, tokens };
}

/**
 * Authenticate admin
 */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<{ admin: IAdmin; tokens: AuthTokens }> {
  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

  if (!admin) {
    throw new UnauthorizedError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
  }

  if (!admin.isActive) {
    throw new UnauthorizedError('Account is inactive', ERROR_CODES.CUSTOMER_INACTIVE);
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials', ERROR_CODES.INVALID_CREDENTIALS);
  }

  // Update last login
  admin.lastLoginAt = new Date();
  await admin.save();

  const tokens = generateTokens({
    id: admin._id.toString(),
    email: admin.email,
    type: 'admin',
    tokenVersion: admin.refreshTokenVersion,
  });

  logger.info(`Admin logged in: ${admin.email}`);

  return { admin, tokens };
}

/**
 * Create initial admin user if none exists
 */
export async function ensureAdminExists(): Promise<void> {
  const adminCount = await Admin.countDocuments();

  if (adminCount === 0) {
    await Admin.create({
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      name: 'System Admin',
      role: 'super_admin',
    });
    logger.info(`Created initial admin user: ${env.ADMIN_EMAIL}`);
  }
}
