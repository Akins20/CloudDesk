import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

/**
 * Middleware to capture raw body for Stripe webhook verification
 */
export function captureRawBody(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.originalUrl === '/api/webhooks/stripe') {
    // Raw body is needed for Stripe signature verification
    let data = '';

    req.setEncoding('utf8');

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      (req as Request & { rawBody: Buffer }).rawBody = Buffer.from(data);
      next();
    });
  } else {
    next();
  }
}

/**
 * Verify Stripe webhook signature
 * Note: The actual verification happens in the stripeService
 * This middleware just ensures the raw body is available
 */
export function verifyStripeWebhook(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    next(new ValidationError('Missing Stripe signature'));
    return;
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!rawBody) {
    next(new ValidationError('Missing raw body for signature verification'));
    return;
  }

  next();
}
