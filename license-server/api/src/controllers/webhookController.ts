import { Request, Response, NextFunction } from 'express';
import * as stripeService from '../services/stripeService';
import { logger } from '../utils/logger';

/**
 * Handle Stripe webhook
 */
export async function handleStripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = (req as Request & { rawBody: Buffer }).rawBody;

    await stripeService.handleWebhook(rawBody, signature);

    // Always return 200 to Stripe
    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    // Return 200 anyway to prevent Stripe from retrying
    // (we've logged the error for investigation)
    res.json({ received: true, error: 'Processing error logged' });
  }
}
