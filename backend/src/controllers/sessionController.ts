import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService';
import { asyncHandler, AuthRequest, getClientIp, getUserAgent } from '../middleware';
import { HTTP_STATUS } from '../config/constants';
import { ConnectSessionDTO } from '../types';

/**
 * Connect to an instance (create session)
 * POST /api/sessions/connect
 */
export const connect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const data: ConnectSessionDTO = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const sessionInfo = await sessionService.connectToInstance(
    userId,
    data.instanceId,
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

  await sessionService.disconnectSession(userId, sessionId, ipAddress, userAgent);

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

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: sessions.map((session) => ({
      id: session._id.toString(),
      instanceId: session.instanceId,
      vncDisplayNumber: session.vncDisplayNumber,
      websocketPort: session.websocketPort,
      status: session.status,
      connectionStartedAt: session.connectionStartedAt,
      lastActivityAt: session.lastActivityAt,
    })),
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
      totalDurationMs: stats.totalDuration,
      totalDurationHours: Math.round(stats.totalDuration / 3600000 * 100) / 100,
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

export default {
  connect,
  disconnect,
  getActiveSessions,
  getSession,
  updateActivity,
  getStats,
  disconnectAll,
};
