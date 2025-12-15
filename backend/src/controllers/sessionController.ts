import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService';
import { asyncHandler, AuthRequest, getClientIp, getUserAgent } from '../middleware';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { ConnectSessionDTO } from '../types';
import { logger } from '../utils/logger';
import { User } from '../models/User';

/**
 * Connect to an instance (create session)
 * POST /api/sessions/connect
 */
export const connect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const data: ConnectSessionDTO = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  // Debug logging
  logger.info('Connect request received', {
    body: req.body,
    hasPassword: !!data.password,
    instanceId: data.instanceId,
  });

  if (!data.password) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        message: 'Password is required to decrypt credentials',
        code: 'PASSWORD_REQUIRED',
      },
    });
    return;
  }

  // Verify user's password before attempting to decrypt credentials
  const user = await User.findById(userId);
  if (!user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        message: 'User not found',
        code: ERROR_CODES.USER_NOT_FOUND,
      },
    });
    return;
  }

  const isPasswordValid = await user.comparePassword(data.password);
  if (!isPasswordValid) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        message: 'Incorrect password. Please enter your account password to decrypt credentials.',
        code: ERROR_CODES.INCORRECT_PASSWORD,
      },
    });
    return;
  }

  const sessionInfo = await sessionService.connectToInstance(
    userId,
    data.instanceId,
    data.password,
    data.desktopEnvironment || 'xfce',
    ipAddress,
    userAgent
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: sessionInfo,
  });
});

/**
 * Disconnect a session
 * POST /api/sessions/disconnect/:sessionId
 */
export const disconnect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { sessionId } = req.params;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  logger.info('Disconnect request received', { userId, sessionId });

  await sessionService.disconnectSession(userId, sessionId, ipAddress, userAgent);

  logger.info('Disconnect completed successfully', { sessionId });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { message: 'Session disconnected successfully' },
  });
});

/**
 * Get active sessions
 * GET /api/sessions/active
 */
export const getActiveSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;

  const sessions = await sessionService.getActiveSessions(userId);

  const isActiveStatus = (status: string) => status === 'connected' || status === 'connecting';

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: sessions.map((session) => {
      const durationMs = session.connectionStartedAt
        ? Date.now() - new Date(session.connectionStartedAt).getTime()
        : null;
      const duration = durationMs !== null ? Math.floor(durationMs / 1000) : null;
      return {
        id: session._id.toString(),
        instanceId: session.instanceId,
        vncDisplayNumber: session.vncDisplayNumber,
        vncPort: session.vncPort,
        sshTunnelLocalPort: session.sshTunnelLocalPort,
        websocketPort: session.websocketPort,
        status: session.status,
        errorMessage: session.errorMessage,
        connectionStartedAt: session.connectionStartedAt,
        connectionEndedAt: session.connectionEndedAt,
        lastActivityAt: session.lastActivityAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isActive: isActiveStatus(session.status),
        duration,
      };
    }),
  });
});

/**
 * Get session by ID
 * GET /api/sessions/:sessionId
 */
export const getSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { sessionId } = req.params;

  const session = await sessionService.getSessionById(userId, sessionId);

  if (!session) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      error: {
        message: 'Session not found',
        code: 'SESSION_NOT_FOUND',
      },
    });
    return;
  }

  const isActive = session.status === 'connected' || session.status === 'connecting';
  const durationMs = session.connectionStartedAt
    ? (session.connectionEndedAt
        ? new Date(session.connectionEndedAt).getTime() - new Date(session.connectionStartedAt).getTime()
        : Date.now() - new Date(session.connectionStartedAt).getTime())
    : null;
  const duration = durationMs !== null ? Math.floor(durationMs / 1000) : null;

  // Determine if current user is the session owner
  const isOwner = session.userId.toString() === userId;

  // Get viewer permissions if user is a viewer
  let permissions: 'view' | 'control' | undefined;
  if (!isOwner) {
    const viewer = session.activeViewers?.find(
      (v) => v.userId.toString() === userId
    );
    permissions = viewer?.permissions;
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      id: session._id.toString(),
      instanceId: session.instanceId,
      vncDisplayNumber: session.vncDisplayNumber,
      vncPort: session.vncPort,
      sshTunnelLocalPort: session.sshTunnelLocalPort,
      websocketPort: session.websocketPort,
      status: session.status,
      errorMessage: session.errorMessage,
      connectionStartedAt: session.connectionStartedAt,
      connectionEndedAt: session.connectionEndedAt,
      lastActivityAt: session.lastActivityAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      isActive,
      duration,
      isOwner,
      permissions,
    },
  });
});

/**
 * Update session activity (keep-alive)
 * POST /api/sessions/:sessionId/activity
 */
export const updateActivity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { sessionId } = req.params;

  await sessionService.updateSessionActivity(userId, sessionId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { message: 'Activity updated' },
  });
});

/**
 * Get session statistics
 * GET /api/sessions/stats
 */
export const getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;

  const stats = await sessionService.getSessionStats(userId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      activeSessions: stats.activeSessions,
      totalSessions: stats.totalSessions,
      totalDuration: stats.totalDuration,
    },
  });
});

/**
 * Disconnect all sessions
 * POST /api/sessions/disconnect-all
 */
export const disconnectAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;

  const disconnectedCount = await sessionService.disconnectAllUserSessions(userId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      message: `${disconnectedCount} session(s) disconnected`,
      disconnectedCount,
    },
  });
});

/**
 * Get all sessions (including history)
 * GET /api/sessions/history
 */
export const getSessionHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { limit = 50, offset = 0, status } = req.query;

  const sessions = await sessionService.getSessionHistory(
    userId,
    Number(limit),
    Number(offset),
    status as string | undefined
  );

  const isActiveStatus = (s: string) => s === 'connected' || s === 'connecting';

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: sessions.map((session) => {
      const durationMs = session.connectionStartedAt
        ? (session.connectionEndedAt
            ? new Date(session.connectionEndedAt).getTime() - new Date(session.connectionStartedAt).getTime()
            : Date.now() - new Date(session.connectionStartedAt).getTime())
        : null;
      const duration = durationMs !== null ? Math.floor(durationMs / 1000) : null;
      return {
        id: session._id.toString(),
        instanceId: session.instanceId,
        vncDisplayNumber: session.vncDisplayNumber,
        vncPort: session.vncPort,
        sshTunnelLocalPort: session.sshTunnelLocalPort,
        websocketPort: session.websocketPort,
        status: session.status,
        errorMessage: session.errorMessage,
        connectionStartedAt: session.connectionStartedAt,
        connectionEndedAt: session.connectionEndedAt,
        lastActivityAt: session.lastActivityAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        isActive: isActiveStatus(session.status),
        duration,
      };
    }),
  });
});

export default {
  connect,
  disconnect,
  getActiveSessions,
  getSession,
  updateActivity,
  getStats,
  disconnectAll,
  getSessionHistory,
};
