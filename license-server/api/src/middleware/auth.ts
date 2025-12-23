import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../services/authService';
import { Customer } from '../models/Customer';
import { UnauthorizedError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      customer?: {
        id: string;
        email: string;
      };
      tokenPayload?: TokenPayload;
    }
  }
}

/**
 * Authentication middleware for customer routes
 */
export async function authenticateCustomer(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided', ERROR_CODES.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (payload.type !== 'customer') {
      throw new UnauthorizedError('Invalid token type', ERROR_CODES.TOKEN_INVALID);
    }

    // Verify customer still exists and is active
    const customer = await Customer.findById(payload.id);
    if (!customer) {
      throw new UnauthorizedError('Customer not found', ERROR_CODES.CUSTOMER_NOT_FOUND);
    }

    if (!customer.isActive) {
      throw new UnauthorizedError('Account is inactive', ERROR_CODES.CUSTOMER_INACTIVE);
    }

    // Attach customer info to request
    req.customer = {
      id: payload.id,
      email: payload.email,
    };
    req.tokenPayload = payload;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);

      if (payload.type === 'customer') {
        req.customer = {
          id: payload.id,
          email: payload.email,
        };
        req.tokenPayload = payload;
      }
    }

    next();
  } catch {
    // Ignore auth errors for optional auth
    next();
  }
}
