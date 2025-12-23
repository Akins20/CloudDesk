import { Router } from 'express';
import { instanceController } from '../controllers';
import * as instanceFeaturesController from '../controllers/instanceFeaturesController';
import {
  authenticate,
  validateBody,
  validateParams,
  validateQuery,
  checkInstanceLimit,
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
  checkInstanceLimit,
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

// ============================================
// Instance Features Routes
// ============================================

/**
 * @route   GET /api/instances/:id/os-info
 * @desc    Get OS information for an instance
 * @access  Private
 */
router.get(
  '/:id/os-info',
  validateParams(objectIdParamSchema),
  instanceFeaturesController.getOSInfo
);

/**
 * @route   POST /api/instances/:id/preflight
 * @desc    Run pre-flight checks on an instance
 * @access  Private
 */
router.post(
  '/:id/preflight',
  validateParams(objectIdParamSchema),
  instanceFeaturesController.runPreflightCheck
);

/**
 * @route   POST /api/instances/:id/provision/dry-run
 * @desc    Dry-run VNC provisioning (preview what will be installed)
 * @access  Private
 */
router.post(
  '/:id/provision/dry-run',
  validateParams(objectIdParamSchema),
  instanceFeaturesController.dryRunProvisioning
);

/**
 * @route   GET /api/instances/:id/software/templates
 * @desc    Get available dev software templates
 * @access  Private
 */
router.get(
  '/:id/software/templates',
  validateParams(objectIdParamSchema),
  instanceFeaturesController.getDevSoftwareTemplates
);

/**
 * @route   POST /api/instances/:id/software/install
 * @desc    Install dev software template
 * @access  Private
 */
router.post(
  '/:id/software/install',
  validateParams(objectIdParamSchema),
  instanceFeaturesController.installDevSoftware
);

// ============================================
// SFTP File Operations Routes
// ============================================

/**
 * @route   POST /api/instances/:id/files/list
 * @desc    List directory contents on remote instance
 * @access  Private
 */
router.post(
  '/:id/files/list',
  validateParams(objectIdParamSchema),
  instanceFeaturesController.listDirectory
);

/**
 * @route   POST /api/instances/:id/files/download
 * @desc    Download file from remote instance
 * @access  Private
 */
router.post(
  '/:id/files/download',
  validateParams(objectIdParamSchema),
  instanceFeaturesController.downloadFile
);

/**
 * @route   POST /api/instances/:id/files/upload
 * @desc    Upload file to remote instance
 * @access  Private
 */
router.post(
  '/:id/files/upload',
  validateParams(objectIdParamSchema),
  instanceFeaturesController.uploadFile
);

/**
 * @route   POST /api/instances/:id/files/delete
 * @desc    Delete file or directory on remote instance
 * @access  Private
 */
router.post(
  '/:id/files/delete',
  validateParams(objectIdParamSchema),
  instanceFeaturesController.deleteFile
);

/**
 * @route   POST /api/instances/:id/files/mkdir
 * @desc    Create directory on remote instance
 * @access  Private
 */
router.post(
  '/:id/files/mkdir',
  validateParams(objectIdParamSchema),
  instanceFeaturesController.createDirectory
);

export default router;
