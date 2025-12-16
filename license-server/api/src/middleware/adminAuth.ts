import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../services/authService';
import { Admin, AdminRole } from '../models/Admin';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        role: AdminRole;
      };
    }
  }
}

/**
 * Authentication middleware for admin routes
 */
export async function authenticateAdmin(
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

    if (payload.type !== 'admin') {
      throw new UnauthorizedError('Invalid token type', ERROR_CODES.TOKEN_INVALID);
    }

    // Verify admin still exists and is active
    const admin = await Admin.findById(payload.id);
    if (!admin) {
      throw new UnauthorizedError('Admin not found', ERROR_CODES.CUSTOMER_NOT_FOUND);
    }

    if (!admin.isActive) {
      throw new UnauthorizedError('Account is inactive', ERROR_CODES.CUSTOMER_INACTIVE);
    }

    // Attach admin info to request
    req.admin = {
      id: payload.id,
      email: payload.email,
      role: admin.role,
    };
    req.tokenPayload = payload;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require specific admin role
 */
export function requireRole(role: AdminRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin) {
      next(new UnauthorizedError('Not authenticated', ERROR_CODES.UNAUTHORIZED));
      return;
    }

    // super_admin has all permissions
    if (req.admin.role === 'super_admin') {
      next();
      return;
    }

    if (req.admin.role !== role) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}
