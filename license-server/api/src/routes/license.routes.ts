import { Router } from 'express';
import { licenseController } from '../controllers';
import { validateBody } from '../middleware/validation';
import { validationLimiter } from '../middleware/rateLimiter';
import { validateLicenseSchema } from '../utils/validators';

const router = Router();

// Validate license (called by self-hosted instances)
router.post(
  '/validate',
  validationLimiter,
  validateBody(validateLicenseSchema),
  licenseController.validate
);

// Get license status (public)
router.get('/:key/status', validationLimiter, licenseController.getStatus);

export default router;
