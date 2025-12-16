import { Router } from 'express';
import customerRoutes from './customer.routes';
import licenseRoutes from './license.routes';
import subscriptionRoutes from './subscription.routes';
import webhookRoutes from './webhook.routes';
import adminRoutes from './admin.routes';

const router = Router();

// API routes
router.use('/customers', customerRoutes);
router.use('/licenses', licenseRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
