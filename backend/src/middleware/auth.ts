import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { UnauthorizedError } from '../utils/errors';
import { ERROR_CODES, AUTH_CONSTANTS } from '../config/constants';

export interface AuthRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware
 * Validates JWT access token and attaches user info to request
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header provided', ERROR_CODES.UNAUTHORIZED);
    }

    // Check Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== AUTH_CONSTANTS.TOKEN_TYPE) {
      throw new UnauthorizedError('Invalid authorization header format', ERROR_CODES.UNAUTHORIZED);
    }

    const token = parts[1];

    // Verify token
    const payload = authService.verifyAccessToken(token);

    // Attach user info to request
    (req as AuthRequest).user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if valid token is present, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== AUTH_CONSTANTS.TOKEN_TYPE) {
      return next();
    }

    const token = parts[1];

    try {
      const payload = authService.verifyAccessToken(token);
      (req as AuthRequest).user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      // Token invalid but optional, continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * Requires authenticate middleware to run first
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return next(new UnauthorizedError('Authentication required', ERROR_CODES.UNAUTHORIZED));
    }

    if (roles.length > 0 && !roles.includes(authReq.user.role)) {
      return next(
        new UnauthorizedError(
          'You do not have permission to access this resource',
          ERROR_CODES.FORBIDDEN
        )
      );
    }

    next();
  };
};

/**
 * Get client IP address from request
 */
export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
    return ips.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Get user agent from request
 */
export const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};

export default {
  authenticate,
  optionalAuth,
  authorize,
  getClientIp,
  getUserAgent,
};
