import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Session } from '../models/Session';
import { SessionInvite, InvitePermission } from '../models/SessionInvite';
import { asyncHandler, AuthRequest } from '../middleware';
import { HTTP_STATUS } from '../config/constants';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Create a session invitation
 * POST /api/sessions/:sessionId/invite
 */
export const createInvite = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { sessionId } = req.params;
  const { permissions = 'view', expiresInMinutes, maxUses = 1, email } = req.body;

  // Validate session exists and user owns it
  const session = await Session.findOne({
    _id: sessionId,
    userId,
    status: { $in: ['connecting', 'connected'] },
  });

  if (!session) {
    throw new NotFoundError('Session not found or not active');
  }

  // Check if collaboration is enabled
  if (!session.isCollaborative) {
    // Auto-enable collaboration when creating first invite
    await session.enableCollaboration();
  }

  // Calculate expiration
  let expiresAt: Date | undefined;
  if (expiresInMinutes && expiresInMinutes > 0) {
    expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  }

  // Generate invite token
  const inviteToken = SessionInvite.generateToken();

  // Create invite
  const invite = new SessionInvite({
    sessionId: new mongoose.Types.ObjectId(sessionId),
    inviteToken,
    permissions: permissions as InvitePermission,
    createdBy: new mongoose.Types.ObjectId(userId),
    expiresAt,
    maxUses: maxUses || 1,
    invitedEmail: email || null,
  });

  await invite.save();

  logger.info('Session invite created', {
    sessionId,
    inviteId: invite._id.toString(),
    permissions,
    maxUses,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: {
      inviteId: invite._id.toString(),
      inviteToken: invite.inviteToken,
      inviteUrl: `/join/${invite.inviteToken}`,
      permissions: invite.permissions,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
    },
  });
});

/**
 * List active invitations for a session
 * GET /api/sessions/:sessionId/invites
 */
export const listInvites = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { sessionId } = req.params;

  // Validate session exists and user owns it
  const session = await Session.findOne({
    _id: sessionId,
    userId,
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Get pending invites
  const invites = await SessionInvite.findPendingBySession(sessionId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: invites.map((invite) => ({
      inviteId: invite._id.toString(),
      inviteToken: invite.inviteToken,
      inviteUrl: `/join/${invite.inviteToken}`,
      permissions: invite.permissions,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      useCount: invite.useCount,
      createdAt: invite.createdAt,
      invitedEmail: invite.invitedEmail,
    })),
  });
});

/**
 * Revoke an invitation
 * DELETE /api/sessions/:sessionId/invite/:inviteId
 */
export const revokeInvite = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { sessionId, inviteId } = req.params;

  // Validate session exists and user owns it
  const session = await Session.findOne({
    _id: sessionId,
    userId,
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  // Find and revoke invite
  const invite = await SessionInvite.findOne({
    _id: inviteId,
    sessionId,
    createdBy: userId,
  });

  if (!invite) {
    throw new NotFoundError('Invite not found');
  }

  await invite.revoke();

  logger.info('Session invite revoked', {
    sessionId,
    inviteId,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { message: 'Invite revoked successfully' },
  });
});

/**
 * Join a session via invite token
 * POST /api/sessions/join/:inviteToken
 */
export const joinSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { inviteToken } = req.params;

  // Find valid invite
  const invite = await SessionInvite.findValidByToken(inviteToken);

  if (!invite) {
    throw new NotFoundError('Invalid or expired invite');
  }

  // Get session
  const session = await Session.findOne({
    _id: invite.sessionId,
    status: { $in: ['connecting', 'connected'] },
  });

  if (!session) {
    throw new NotFoundError('Session is no longer active');
  }

  // Check if user is the owner (can't join own session via invite)
  if (session.userId.toString() === userId) {
    throw new ValidationError('You are the owner of this session');
  }

  // Check max viewers
  if (session.activeViewers.length >= session.maxViewers) {
    throw new ForbiddenError('Session has reached maximum viewers');
  }

  // Mark invite as used
  await invite.markUsed(userId);

  // Add viewer to session
  await session.addViewer(userId, invite.permissions);

  logger.info('User joined session via invite', {
    userId,
    sessionId: session._id.toString(),
    inviteToken,
    permissions: invite.permissions,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      sessionId: session._id.toString(),
      websocketUrl: `/vnc?sessionId=${session._id.toString()}`,
      permissions: invite.permissions,
      message: 'Successfully joined session',
    },
  });
});

/**
 * Get session info for an invite token (without joining)
 * GET /api/sessions/invite-info/:inviteToken
 */
export const getInviteInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { inviteToken } = req.params;

  // Find valid invite
  const invite = await SessionInvite.findValidByToken(inviteToken);

  if (!invite) {
    throw new NotFoundError('Invalid or expired invite');
  }

  // Get session with instance info
  const session = await Session.findOne({
    _id: invite.sessionId,
    status: { $in: ['connecting', 'connected'] },
  }).populate('instanceId', 'name');

  if (!session) {
    throw new NotFoundError('Session is no longer active');
  }

  const instanceName = (session.instanceId as unknown as { name: string })?.name || 'Unknown';

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      sessionId: session._id.toString(),
      instanceName,
      permissions: invite.permissions,
      viewerCount: session.activeViewers.length,
      maxViewers: session.maxViewers,
      expiresAt: invite.expiresAt,
    },
  });
});

/**
 * Get active viewers for a session
 * GET /api/sessions/:sessionId/viewers
 */
export const getViewers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { sessionId } = req.params;

  // Find session - user must be owner or a viewer
  const session = await Session.findOne({
    _id: sessionId,
    $or: [
      { userId },
      { 'activeViewers.userId': new mongoose.Types.ObjectId(userId) },
    ],
  }).populate('activeViewers.userId', 'name email');

  if (!session) {
    throw new NotFoundError('Session not found or access denied');
  }

  const isOwner = session.userId.toString() === userId;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      isOwner,
      isCollaborative: session.isCollaborative,
      viewerCount: session.activeViewers.length,
      maxViewers: session.maxViewers,
      viewers: session.activeViewers.map((v) => {
        const user = v.userId as unknown as { _id: mongoose.Types.ObjectId; name: string; email: string };
        return {
          odId: user._id?.toString() || v.userId.toString(),
          name: user.name || 'Unknown User',
          permissions: v.permissions,
          joinedAt: v.joinedAt,
        };
      }),
    },
  });
});

/**
 * Toggle collaboration mode
 * POST /api/sessions/:sessionId/collaboration
 */
export const toggleCollaboration = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { sessionId } = req.params;
  const { enabled } = req.body;

  // Validate session exists and user owns it
  const session = await Session.findOne({
    _id: sessionId,
    userId,
    status: { $in: ['connecting', 'connected'] },
  });

  if (!session) {
    throw new NotFoundError('Session not found or not active');
  }

  if (enabled) {
    await session.enableCollaboration();
  } else {
    await session.disableCollaboration();
    // Also revoke all pending invites
    await SessionInvite.updateMany(
      { sessionId, status: 'pending' },
      { status: 'revoked' }
    );
  }

  logger.info('Session collaboration toggled', {
    sessionId,
    enabled,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      isCollaborative: enabled,
      message: enabled ? 'Collaboration enabled' : 'Collaboration disabled',
    },
  });
});

/**
 * Kick a viewer from session
 * DELETE /api/sessions/:sessionId/viewers/:viewerId
 */
export const kickViewer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { sessionId, viewerId } = req.params;

  // Validate session exists and user owns it
  const session = await Session.findOne({
    _id: sessionId,
    userId,
  });

  if (!session) {
    throw new NotFoundError('Session not found or access denied');
  }

  // Can't kick yourself
  if (viewerId === userId) {
    throw new ValidationError('Cannot kick yourself from the session');
  }

  // Remove viewer
  await session.removeViewer(viewerId);

  logger.info('Viewer kicked from session', {
    sessionId,
    viewerId,
    kickedBy: userId,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { message: 'Viewer removed from session' },
  });
});

/**
 * Update viewer permissions
 * PATCH /api/sessions/:sessionId/viewers/:viewerId
 */
export const updateViewerPermissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { sessionId, viewerId } = req.params;
  const { permissions } = req.body;

  if (!['view', 'control'].includes(permissions)) {
    throw new ValidationError('Invalid permissions. Must be "view" or "control"');
  }

  // Validate session exists and user owns it
  const session = await Session.findOne({
    _id: sessionId,
    userId,
  });

  if (!session) {
    throw new NotFoundError('Session not found or access denied');
  }

  // Update viewer permissions
  const viewerIndex = session.activeViewers.findIndex(
    (v) => v.userId.toString() === viewerId
  );

  if (viewerIndex < 0) {
    throw new NotFoundError('Viewer not found in session');
  }

  session.activeViewers[viewerIndex].permissions = permissions;
  await session.save();

  logger.info('Viewer permissions updated', {
    sessionId,
    viewerId,
    newPermissions: permissions,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      viewerId,
      permissions,
      message: 'Permissions updated successfully',
    },
  });
});

export default {
  createInvite,
  listInvites,
  revokeInvite,
  joinSession,
  getInviteInfo,
  getViewers,
  toggleCollaboration,
  kickViewer,
  updateViewerPermissions,
};
