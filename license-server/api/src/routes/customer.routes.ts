import { Router } from 'express';
import { customerController } from '../controllers';
import { authenticateCustomer } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import {
  registerCustomerSchema,
  loginCustomerSchema,
  updateCustomerSchema,
} from '../utils/validators';
import Joi from 'joi';

const router = Router();

// Public routes
router.post(
  '/register',
  authLimiter,
  validateBody(registerCustomerSchema),
  customerController.register
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginCustomerSchema),
  customerController.login
);

router.post(
  '/refresh',
  validateBody(Joi.object({ refreshToken: Joi.string().required() })),
  customerController.refreshToken
);

// Protected routes
router.get('/profile', authenticateCustomer, customerController.getProfile);

router.put(
  '/profile',
  authenticateCustomer,
  validateBody(updateCustomerSchema),
  customerController.updateProfile
);

router.get('/licenses', authenticateCustomer, customerController.getLicenses);

router.get('/subscription', authenticateCustomer, customerController.getSubscription);

export default router;
