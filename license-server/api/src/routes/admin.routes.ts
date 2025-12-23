import { Router } from 'express';
import { adminController } from '../controllers';
import { authenticateAdmin } from '../middleware/adminAuth';
import { validateBody } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import { adminLoginSchema, generateLicenseSchema } from '../utils/validators';
import Joi from 'joi';

const router = Router();

// Public admin routes
router.post(
  '/login',
  authLimiter,
  validateBody(adminLoginSchema),
  adminController.login
);

router.post(
  '/refresh',
  validateBody(Joi.object({ refreshToken: Joi.string().required() })),
  adminController.refreshToken
);

// Protected admin routes
router.use(authenticateAdmin);

// Customers
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomer);

// Licenses
router.get('/licenses', adminController.getLicenses);
router.post(
  '/licenses',
  validateBody(generateLicenseSchema),
  adminController.generateLicense
);
router.post(
  '/licenses/:id/revoke',
  validateBody(Joi.object({ reason: Joi.string().max(500) })),
  adminController.revokeLicense
);
router.post('/licenses/:id/reactivate', adminController.reactivateLicense);
router.post(
  '/licenses/:id/extend',
  validateBody(Joi.object({ expiresAt: Joi.date().iso().required() })),
  adminController.extendLicense
);

// Analytics
router.get('/analytics', adminController.getAnalytics);

export default router;
