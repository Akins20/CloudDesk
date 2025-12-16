import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import * as customerService from '../services/customerService';
import * as licenseService from '../services/licenseService';
import { Subscription } from '../models/Subscription';
import { LICENSE_TIERS } from '../config/constants';

/**
 * Admin login
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    const { admin, tokens } = await authService.authenticateAdmin(email, password);

    res.json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh admin token
 */
export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAdminTokens(refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all customers (paginated)
 */
export async function getCustomers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.q as string | undefined;

    const result = await customerService.getCustomers(page, limit, search);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get customer details
 */
export async function getCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customerId = req.params.id!;
    const customer = await customerService.getCustomerById(customerId);
    const licenses = await customerService.getCustomerLicenses(customerId);
    const subscription = await customerService.getCustomerSubscription(customerId);

    res.json({
      success: true,
      data: {
        customer,
        licenses,
        subscription,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all licenses (paginated)
 */
export async function getLicenses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      status: req.query.status as string | undefined,
      tier: req.query.tier as 'community' | 'team' | 'enterprise' | undefined,
      customerId: req.query.customerId as string | undefined,
    };

    const result = await licenseService.getLicenses(page, limit, filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate a license manually
 */
export async function generateLicense(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { customerId, tier, expiresAt, notes } = req.body;

    const { license, key } = await licenseService.createLicense(
      {
        customerId,
        tier,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        notes,
      },
      req.admin!.id
    );

    res.status(201).json({
      success: true,
      data: {
        license: {
          id: license._id,
          tier: license.tier,
          status: license.status,
          createdAt: license.createdAt,
        },
        key, // Only returned once on creation
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Revoke a license
 */
export async function revokeLicense(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { reason } = req.body;
    const license = await licenseService.revokeLicense(
      req.params.id!,
      reason || 'Revoked by admin',
      req.admin!.id
    );

    res.json({
      success: true,
      data: { license },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reactivate a license
 */
export async function reactivateLicense(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const license = await licenseService.reactivateLicense(
      req.params.id!,
      req.admin!.id
    );

    res.json({
      success: true,
      data: { license },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Extend license expiry
 */
export async function extendLicense(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { expiresAt } = req.body;
    const license = await licenseService.extendLicense(
      req.params.id!,
      new Date(expiresAt),
      req.admin!.id
    );

    res.json({
      success: true,
      data: { license },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get analytics dashboard
 */
export async function getAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [licenseAnalytics, subscriptionStats] = await Promise.all([
      licenseService.getLicenseAnalytics(),
      Subscription.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$tier',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Calculate MRR
    let mrr = 0;
    for (const stat of subscriptionStats) {
      const tierInfo = LICENSE_TIERS[stat._id as keyof typeof LICENSE_TIERS];
      if (tierInfo) {
        mrr += stat.count * tierInfo.price.monthly;
      }
    }

    res.json({
      success: true,
      data: {
        licenses: licenseAnalytics,
        subscriptions: {
          byTier: Object.fromEntries(subscriptionStats.map((s) => [s._id, s.count])),
          mrr,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
