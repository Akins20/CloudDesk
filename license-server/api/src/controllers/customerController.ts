import { Request, Response, NextFunction } from 'express';
import * as customerService from '../services/customerService';
import * as authService from '../services/authService';
import { sendWelcomeEmail } from '../services/emailService';

/**
 * Register a new customer
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { customer, tokens } = await customerService.createCustomer(
      req.body,
      req.ip
    );

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(customer.email, customer.firstName);

    res.status(201).json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          organizationName: customer.organizationName,
        },
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login customer
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    const { customer, tokens } = await authService.authenticateCustomer(email, password);

    res.json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          organizationName: customer.organizationName,
        },
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshCustomerTokens(refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get customer profile
 */
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customer = await customerService.getCustomerById(req.customer!.id);

    res.json({
      success: true,
      data: {
        id: customer._id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        organizationName: customer.organizationName,
        emailVerified: customer.emailVerified,
        createdAt: customer.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update customer profile
 */
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customer = await customerService.updateCustomer(
      req.customer!.id,
      req.body,
      req.ip
    );

    res.json({
      success: true,
      data: {
        id: customer._id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        organizationName: customer.organizationName,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get customer's licenses
 */
export async function getLicenses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const licenses = await customerService.getCustomerLicenses(req.customer!.id);

    res.json({
      success: true,
      data: { licenses },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get customer's subscription
 */
export async function getSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subscription = await customerService.getCustomerSubscription(req.customer!.id);

    res.json({
      success: true,
      data: {
        subscription: subscription
          ? {
              id: subscription._id,
              tier: subscription.tier,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              billingCycle: subscription.metadata.billingCycle,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
}
