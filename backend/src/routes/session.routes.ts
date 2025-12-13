import { Router } from 'express';
import { sessionController } from '../controllers';
import {
  authenticate,
  validateBody,
  validateParams,
  sessionLimiter,
} from '../middleware';
import { connectSessionSchema, sessionIdParamSchema } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/sessions
 * @desc    Get all sessions (alias for active)
 * @access  Private
 */
router.get('/', sessionController.getActiveSessions);

/**
 * @route   POST /api/sessions/connect
 * @desc    Connect to an instance (create session)
 * @access  Private
 */
router.post(
  '/connect',
  sessionLimiter,
  validateBody(connectSessionSchema),
  sessionController.connect
);

/**
 * @route   POST /api/sessions/disconnect/:sessionId
 * @desc    Disconnect a session
 * @access  Private
 */
router.post(
  '/disconnect/:sessionId',
  validateParams(sessionIdParamSchema),
  sessionController.disconnect
);

/**
 * @route   GET /api/sessions/active
 * @desc    Get active sessions
 * @access  Private
 */
router.get('/active', sessionController.getActiveSessions);

/**
 * @route   GET /api/sessions/stats
 * @desc    Get session statistics
 * @access  Private
 */
router.get('/stats', sessionController.getStats);

/**
 * @route   POST /api/sessions/disconnect-all
 * @desc    Disconnect all sessions
 * @access  Private
 */
router.post('/disconnect-all', sessionController.disconnectAll);

/**
 * @route   GET /api/sessions/:sessionId
 * @desc    Get session by ID
 * @access  Private
 */
router.get(
  '/:sessionId',
  validateParams(sessionIdParamSchema),
  sessionController.getSession
);

/**
 * @route   POST /api/sessions/:sessionId/activity
 * @desc    Update session activity (keep-alive)
 * @access  Private
 */
router.post(
  '/:sessionId/activity',
  validateParams(sessionIdParamSchema),
  sessionController.updateActivity
);

export default router;
