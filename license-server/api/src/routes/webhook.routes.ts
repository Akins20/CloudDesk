import { Router } from 'express';
import { webhookController } from '../controllers';
import { verifyStripeWebhook } from '../middleware/stripeWebhook';
import { webhookLimiter } from '../middleware/rateLimiter';

const router = Router();

// Stripe webhook
// Note: Raw body parsing is handled in app.ts
router.post(
  '/stripe',
  webhookLimiter,
  verifyStripeWebhook,
  webhookController.handleStripeWebhook
);

export default router;
