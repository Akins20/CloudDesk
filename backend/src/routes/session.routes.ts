import { Router } from 'express';
import { sessionController, inviteController } from '../controllers';
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
 * @route   GET /api/sessions/history
 * @desc    Get all sessions including history
 * @access  Private
 */
router.get('/history', sessionController.getSessionHistory);

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

// ============================================
// Collaboration & Invite Routes
// ============================================

/**
 * @route   POST /api/sessions/join/:inviteToken
 * @desc    Join a session via invite token
 * @access  Private
 */
router.post('/join/:inviteToken', inviteController.joinSession);

/**
 * @route   GET /api/sessions/invite-info/:inviteToken
 * @desc    Get session info for an invite (without joining)
 * @access  Private
 */
router.get('/invite-info/:inviteToken', inviteController.getInviteInfo);

/**
 * @route   POST /api/sessions/:sessionId/invite
 * @desc    Create a session invitation
 * @access  Private (session owner only)
 */
router.post(
  '/:sessionId/invite',
  validateParams(sessionIdParamSchema),
  inviteController.createInvite
);

/**
 * @route   GET /api/sessions/:sessionId/invites
 * @desc    List active invitations for a session
 * @access  Private (session owner only)
 */
router.get(
  '/:sessionId/invites',
  validateParams(sessionIdParamSchema),
  inviteController.listInvites
);

/**
 * @route   DELETE /api/sessions/:sessionId/invite/:inviteId
 * @desc    Revoke an invitation
 * @access  Private (session owner only)
 */
router.delete(
  '/:sessionId/invite/:inviteId',
  validateParams(sessionIdParamSchema),
  inviteController.revokeInvite
);

/**
 * @route   GET /api/sessions/:sessionId/viewers
 * @desc    Get active viewers for a session
 * @access  Private (owner or viewer)
 */
router.get(
  '/:sessionId/viewers',
  validateParams(sessionIdParamSchema),
  inviteController.getViewers
);

/**
 * @route   POST /api/sessions/:sessionId/collaboration
 * @desc    Toggle collaboration mode on/off
 * @access  Private (session owner only)
 */
router.post(
  '/:sessionId/collaboration',
  validateParams(sessionIdParamSchema),
  inviteController.toggleCollaboration
);

/**
 * @route   DELETE /api/sessions/:sessionId/viewers/:viewerId
 * @desc    Kick a viewer from session
 * @access  Private (session owner only)
 */
router.delete(
  '/:sessionId/viewers/:viewerId',
  validateParams(sessionIdParamSchema),
  inviteController.kickViewer
);

/**
 * @route   PATCH /api/sessions/:sessionId/viewers/:viewerId
 * @desc    Update viewer permissions
 * @access  Private (session owner only)
 */
router.patch(
  '/:sessionId/viewers/:viewerId',
  validateParams(sessionIdParamSchema),
  inviteController.updateViewerPermissions
);

export default router;
