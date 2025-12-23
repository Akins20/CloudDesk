import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import instanceRoutes from './instance.routes';
import sessionRoutes from './session.routes';
import { licenseService } from '../services/licenseService';
import { env } from '../config/environment';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/instances', instanceRoutes);
router.use('/sessions', sessionRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    },
  });
});

// License info endpoint (public - shows tier and limits)
router.get('/license', (_req, res) => {
  const summary = licenseService.getLicenseSummary();
  res.json({
    success: true,
    data: {
      tier: summary.tier,
      valid: summary.valid,
      limits: summary.limits,
      features: summary.features,
      appName: env.APP_NAME,
    },
  });
});

export default router;
