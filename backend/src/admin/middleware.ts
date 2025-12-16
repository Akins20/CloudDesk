/**
 * Admin Authentication Middleware
 * Session management and access control
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Admin session interface
interface AdminSession {
  userId: string;
  email: string;
  expiresAt: Date;
}

// In-memory session storage (use Redis in production for horizontal scaling)
const adminSessions = new Map<string, AdminSession>();

/**
 * Generate a secure random token
 */
export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create an admin session
 */
export const createSession = (userId: string, email: string): string => {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  adminSessions.set(token, { userId, email, expiresAt });

  // Clean up expired sessions periodically
  cleanupExpiredSessions();

  return token;
};

/**
 * Get session by token
 */
export const getSession = (token: string): AdminSession | null => {
  const session = adminSessions.get(token);

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    adminSessions.delete(token);
    return null;
  }

  return session;
};

/**
 * Delete a session
 */
export const deleteSession = (token: string): void => {
  adminSessions.delete(token);
};

/**
 * Clean up expired sessions
 */
const cleanupExpiredSessions = (): void => {
  const now = new Date();
  for (const [token, session] of adminSessions.entries()) {
    if (session.expiresAt < now) {
      adminSessions.delete(token);
    }
  }
};

/**
 * Get active session count
 */
export const getActiveSessionCount = (): number => {
  cleanupExpiredSessions();
  return adminSessions.size;
};

/**
 * Extend request type with admin user
 */
declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminSession;
    }
  }
}

/**
 * Require admin authentication middleware
 */
export const requireAdminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.admin_session;

  if (!token) {
    res.redirect('/admin/login');
    return;
  }

  const session = getSession(token);

  if (!session) {
    res.clearCookie('admin_session');
    res.redirect('/admin/login');
    return;
  }

  req.adminUser = session;
  next();
};

/**
 * Set admin session cookie
 */
export const setSessionCookie = (res: Response, token: string): void => {
  res.cookie('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
};

/**
 * Clear admin session cookie
 */
export const clearSessionCookie = (res: Response): void => {
  res.clearCookie('admin_session');
};

export default {
  generateToken,
  createSession,
  getSession,
  deleteSession,
  getActiveSessionCount,
  requireAdminAuth,
  setSessionCookie,
  clearSessionCookie,
};
