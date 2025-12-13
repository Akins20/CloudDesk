import { Router } from 'express';
import { instanceController } from '../controllers';
import {
  authenticate,
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware';
import {
  createInstanceSchema,
  updateInstanceSchema,
  objectIdParamSchema,
  instanceQuerySchema,
} from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/instances
 * @desc    Get all instances for current user
 * @access  Private
 */
router.get(
  '/',
  validateQuery(instanceQuerySchema),
  instanceController.getInstances
);

/**
 * @route   GET /api/instances/:id
 * @desc    Get instance by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(objectIdParamSchema),
  instanceController.getInstanceById
);

/**
 * @route   POST /api/instances
 * @desc    Create a new instance
 * @access  Private
 */
router.post(
  '/',
  validateBody(createInstanceSchema),
  instanceController.createInstance
);

/**
 * @route   PUT /api/instances/:id
 * @desc    Update an instance
 * @access  Private
 */
router.put(
  '/:id',
  validateParams(objectIdParamSchema),
  validateBody(updateInstanceSchema),
  instanceController.updateInstance
);

/**
 * @route   DELETE /api/instances/:id
 * @desc    Delete an instance
 * @access  Private
 */
router.delete(
  '/:id',
  validateParams(objectIdParamSchema),
  instanceController.deleteInstance
);

/**
 * @route   POST /api/instances/:id/test-connection
 * @desc    Test SSH connection to an instance
 * @access  Private
 */
router.post(
  '/:id/test-connection',
  validateParams(objectIdParamSchema),
  instanceController.testConnection
);

export default router;
