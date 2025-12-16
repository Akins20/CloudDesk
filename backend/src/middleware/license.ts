/**
 * License Middleware
 * Enforces license limits and feature access
 */

import { Request, Response, NextFunction } from 'express';
import { licenseService, LicenseInfo } from '../services/licenseService';
import { User } from '../models/User';
import { Instance } from '../models/Instance';
import { Session } from '../models/Session';
import { ForbiddenError } from '../utils/errors';

/**
 * Add license info to request
 */
export const attachLicense = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  (req as any).license = licenseService.getLicense();
  next();
};

/**
 * Require a specific feature to be enabled
 */
export const requireFeature = (feature: keyof LicenseInfo['features']) => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    if (!licenseService.hasFeature(feature)) {
      throw new ForbiddenError(
        `This feature requires a higher license tier. Current tier: ${licenseService.getLicense().tier}`
      );
    }
    next();
  };
};

/**
 * Check user limit before creating new user
 */
export const checkUserLimit = async (
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const currentUserCount = await User.countDocuments({ isActive: true });

  if (!licenseService.canAddUser(currentUserCount)) {
    const license = licenseService.getLicense();
    throw new ForbiddenError(
      `User limit reached (${license.maxUsers}). Upgrade your license to add more users.`
    );
  }

  next();
};

/**
 * Check instance limit before creating new instance
 */
export const checkInstanceLimit = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = (req as any).user?.userId;
  const currentInstanceCount = await Instance.countDocuments({ userId });

  if (!licenseService.canAddInstance(currentInstanceCount)) {
    const license = licenseService.getLicense();
    throw new ForbiddenError(
      `Instance limit reached (${license.maxInstances}). Upgrade your license to add more instances.`
    );
  }

  next();
};

/**
 * Check session limit before starting new session
 */
export const checkSessionLimit = async (
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const currentSessionCount = await Session.countDocuments({
    status: { $in: ['connecting', 'connected'] },
  });

  if (!licenseService.canStartSession(currentSessionCount)) {
    const license = licenseService.getLicense();
    throw new ForbiddenError(
      `Concurrent session limit reached (${license.maxConcurrentSessions}). Wait for existing sessions to end or upgrade your license.`
    );
  }

  next();
};

/**
 * Require minimum license tier
 */
export const requireTier = (minimumTier: 'team' | 'enterprise') => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const license = licenseService.getLicense();
    const tierOrder = { community: 0, team: 1, enterprise: 2 };

    if (tierOrder[license.tier] < tierOrder[minimumTier]) {
      throw new ForbiddenError(
        `This feature requires ${minimumTier} tier or higher. Current tier: ${license.tier}`
      );
    }

    next();
  };
};

export default {
  attachLicense,
  requireFeature,
  checkUserLimit,
  checkInstanceLimit,
  checkSessionLimit,
  requireTier,
};
