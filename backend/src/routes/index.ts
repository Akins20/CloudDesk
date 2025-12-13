import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import instanceRoutes from './instance.routes';
import sessionRoutes from './session.routes';

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
    },
  });
});

export default router;
