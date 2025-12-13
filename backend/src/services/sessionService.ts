import mongoose from 'mongoose';
import { Client } from 'ssh2';
import { env } from '../config/environment';
import { Session, ISessionDocument } from '../models/Session';
import { Instance } from '../models/Instance';
import { AuditLog } from '../models/AuditLog';
import {
  AUDIT_ACTIONS,
  SESSION_CONSTANTS,
  ERROR_CODES,
  DesktopEnvironment,
} from '../config/constants';
import {
  SessionError,
  NotFoundError,
  VNCError,
} from '../utils/errors';
import { logger, logVNC } from '../utils/logger';
import { findAvailablePort } from '../utils/helpers';
import { sshService } from './sshService';
import { vncService } from './vncService';
import { provisionService } from './provisionService';
import { tunnelService } from './tunnelService';
import { SessionInfo, SSHConfig } from '../types';

class SessionService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Start the session cleanup job
   */
  startCleanupJob(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(
      () => this.cleanupInactiveSessions(),
      SESSION_CONSTANTS.CLEANUP_INTERVAL_MS
    );

    logger.info('Session cleanup job started');
  }

  /**
   * Stop the session cleanup job
   */
  stopCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Session cleanup job stopped');
    }
  }

  /**
   * Connect to an instance (create session)
   */
  async connectToInstance(
    userId: string,
    instanceId: string,
    desktopEnvironment: DesktopEnvironment = 'xfce',
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionInfo> {
    let sshClient: Client | null = null;

    try {
      // Check for existing active session
      const existingSession = await Session.findActiveSessionByInstance(userId, instanceId);
      if (existingSession) {
        throw new SessionError(
          'An active session already exists for this instance',
          ERROR_CODES.SESSION_ALREADY_EXISTS
        );
      }

      // Check session limit
      const activeCount = await Session.countActiveSessions(userId);
      if (activeCount >= SESSION_CONSTANTS.MAX_SESSIONS_PER_USER) {
        throw new SessionError(
          `Maximum ${SESSION_CONSTANTS.MAX_SESSIONS_PER_USER} concurrent sessions allowed`,
          ERROR_CODES.SESSION_LIMIT_REACHED
        );
      }

      // Get instance with credentials
      const instance = await Instance.findByUserIdAndId(userId, instanceId);
      if (!instance) {
        throw new NotFoundError('Instance not found', ERROR_CODES.INSTANCE_NOT_FOUND);
      }

      // Create SSH config
      const sshConfig: SSHConfig = {
        host: instance.host,
        port: instance.port,
        username: instance.username,
      };

      // Get decrypted credential
      const credential = instance.getDecryptedCredential();
      if (instance.authType === 'key') {
        sshConfig.privateKey = credential;
      } else {
        sshConfig.password = credential;
      }

      logVNC('connecting_ssh', instanceId);

      // Establish SSH connection
      sshClient = await sshService.createConnection(sshConfig);

      // Check if VNC is installed, provision if not
      const vncInstalled = await vncService.isVNCInstalled(sshClient);
      const desktopInstalled = await vncService.isDesktopInstalled(sshClient, desktopEnvironment);

      if (!vncInstalled || !desktopInstalled) {
        logVNC('provisioning_required', instanceId);

        const provisionResult = await provisionService.provisionVNC(sshClient, desktopEnvironment);

        if (!provisionResult.success) {
          throw new VNCError(`Failed to provision VNC: ${provisionResult.message}`);
        }

        // Update instance with VNC installed flag
        instance.isVncInstalled = true;
        instance.desktopEnvironment = desktopEnvironment;
        await instance.save();
      }

      // Get available VNC display
      const displayNumber = await vncService.getAvailableDisplayNumber(sshClient);

      logVNC('starting_vnc', instanceId, { displayNumber });

      // Start VNC server
      const vncInfo = await vncService.startVNCServer(sshClient, displayNumber, {
        desktop: desktopEnvironment,
      });

      // Create SSH tunnel
      logVNC('creating_tunnel', instanceId);

      const tunnelInfo = await tunnelService.createTunnel(
        sshClient,
        '127.0.0.1',
        vncInfo.port,
        instanceId,
        '' // Will be updated with session ID
      );

      // Get WebSocket port
      const usedWsPorts = new Set<number>();
      const websocketPort = findAvailablePort(
        env.WEBSOCKET_PORT_RANGE_START,
        env.WEBSOCKET_PORT_RANGE_END,
        usedWsPorts
      );

      if (websocketPort === null) {
        throw new SessionError('No available WebSocket ports');
      }

      // Create session in database
      const session = new Session({
        userId: new mongoose.Types.ObjectId(userId),
        instanceId: new mongoose.Types.ObjectId(instanceId),
        vncDisplayNumber: vncInfo.displayNumber,
        vncPort: vncInfo.port,
        sshTunnelLocalPort: tunnelInfo.localPort,
        websocketPort,
        status: 'connected',
        connectionStartedAt: new Date(),
        lastActivityAt: new Date(),
      });

      await session.save();

      // Update tunnel with actual session ID
      tunnelService.updateTunnelSessionId(tunnelInfo.localPort, session._id.toString());

      // Update instance lastConnectedAt
      await instance.markConnected();

      // Log audit
      await this.logAuditAction(
        userId,
        AUDIT_ACTIONS.SESSION_CONNECT,
        'success',
        instance.name,
        ipAddress,
        userAgent,
        { instanceId, sessionId: session._id.toString() }
      );

      logVNC('session_created', instanceId, {
        sessionId: session._id.toString(),
        displayNumber: vncInfo.displayNumber,
        tunnelPort: tunnelInfo.localPort,
        websocketPort,
      });

      return {
        sessionId: session._id.toString(),
        websocketUrl: `/vnc?sessionId=${session._id.toString()}`,
        vncDisplayNumber: vncInfo.displayNumber,
        status: 'connected',
      };
    } catch (error) {
      // Clean up on error
      if (sshClient) {
        sshService.closeConnection(sshClient);
      }

      // Log failure
      await this.logAuditAction(
        userId,
        AUDIT_ACTIONS.SESSION_CONNECT,
        'failure',
        undefined,
        ipAddress,
        userAgent,
        {
          instanceId,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      throw error;
    }
  }

  /**
   * Disconnect a session
   */
  async disconnectSession(
    userId: string,
    sessionId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const session = await Session.findOne({
      _id: sessionId,
      userId,
    }).populate('instanceId', 'name');

    if (!session) {
      throw new NotFoundError('Session not found', ERROR_CODES.SESSION_NOT_FOUND);
    }

    if (session.status === 'disconnected') {
      return; // Already disconnected
    }

    try {
      // Close tunnel
      await tunnelService.closeTunnel(session.sshTunnelLocalPort);

      // Update session status
      await session.disconnect();

      const instanceName = (session.instanceId as unknown as { name: string })?.name;

      // Log audit
      await this.logAuditAction(
        userId,
        AUDIT_ACTIONS.SESSION_DISCONNECT,
        'success',
        instanceName,
        ipAddress,
        userAgent,
        { sessionId }
      );

      logVNC('session_disconnected', sessionId);
    } catch (error) {
      logger.error('Error disconnecting session:', error);
      // Still mark as disconnected even if cleanup fails
      await session.disconnect(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<ISessionDocument[]> {
    return Session.findActiveSessions(userId);
  }

  /**
   * Get session by ID
   */
  async getSessionById(
    userId: string,
    sessionId: string
  ): Promise<ISessionDocument | null> {
    return Session.findOne({
      _id: sessionId,
      userId,
    }).populate('instanceId', 'name host provider');
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(
    userId: string,
    sessionId: string
  ): Promise<void> {
    const session = await Session.findOne({
      _id: sessionId,
      userId,
      status: { $in: ['connecting', 'connected'] },
    });

    if (!session) {
      throw new NotFoundError('Active session not found', ERROR_CODES.SESSION_NOT_FOUND);
    }

    await session.updateActivity();
  }

  /**
   * Cleanup inactive sessions
   */
  async cleanupInactiveSessions(): Promise<number> {
    try {
      const inactiveSessions = await Session.findInactiveSessions(env.SESSION_TIMEOUT_MINUTES);

      let cleanedCount = 0;

      for (const session of inactiveSessions) {
        try {
          // Close tunnel
          await tunnelService.closeTunnel(session.sshTunnelLocalPort);

          // Mark session as disconnected
          await session.disconnect('Session timed out due to inactivity');

          // Log audit
          await this.logAuditAction(
            session.userId.toString(),
            AUDIT_ACTIONS.SESSION_TIMEOUT,
            'success',
            undefined,
            undefined,
            undefined,
            { sessionId: session._id.toString() }
          );

          cleanedCount++;
          logVNC('session_timeout', session._id.toString());
        } catch (error) {
          logger.error('Error cleaning up session:', {
            sessionId: session._id.toString(),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} inactive sessions`);
      }

      return cleanedCount;
    } catch (error) {
      logger.error('Error in session cleanup job:', error);
      return 0;
    }
  }

  /**
   * Force disconnect all sessions for a user
   */
  async disconnectAllUserSessions(userId: string): Promise<number> {
    const sessions = await Session.findActiveSessions(userId);
    let disconnectedCount = 0;

    for (const session of sessions) {
      try {
        await this.disconnectSession(userId, session._id.toString());
        disconnectedCount++;
      } catch (error) {
        logger.error('Error disconnecting session:', {
          sessionId: session._id.toString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return disconnectedCount;
  }

  /**
   * Get session statistics for a user
   */
  async getSessionStats(userId: string): Promise<{
    activeSessions: number;
    totalSessions: number;
    totalDuration: number;
  }> {
    const [activeCount, allSessions] = await Promise.all([
      Session.countActiveSessions(userId),
      Session.find({ userId }).select('connectionStartedAt connectionEndedAt'),
    ]);

    let totalDuration = 0;
    for (const session of allSessions) {
      if (session.connectionStartedAt) {
        const endTime = session.connectionEndedAt || new Date();
        totalDuration += endTime.getTime() - session.connectionStartedAt.getTime();
      }
    }

    return {
      activeSessions: activeCount,
      totalSessions: allSessions.length,
      totalDuration,
    };
  }

  /**
   * Log audit action
   */
  private async logAuditAction(
    userId: string,
    action: string,
    status: 'success' | 'failure',
    resource?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await AuditLog.logAction({
        userId,
        action: action as typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS],
        resource,
        status,
        ipAddress,
        userAgent,
        details,
      });
    } catch (error) {
      logger.error('Failed to log audit action:', error);
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();

export default sessionService;
