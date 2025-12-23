import { Router } from 'express';
import { subscriptionController } from '../controllers';
import { authenticateCustomer } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { checkoutSchema } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticateCustomer);

// Create checkout session
router.post(
  '/checkout',
  validateBody(checkoutSchema),
  subscriptionController.createCheckout
);

// Create billing portal session
router.post('/portal', subscriptionController.createPortal);

// Get current subscription
router.get('/current', subscriptionController.getCurrent);

export default router;
