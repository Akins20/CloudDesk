import { Session, ISessionDocument } from '../models/Session';
import { sessionRegistry } from './redis/sessionRegistry';
import { logger } from '../utils/logger';

// Recovery result types
export interface RecoveryResult {
  totalChecked: number;
  recovered: number;
  disconnected: number;
  errors: string[];
}

export interface SessionHealthStatus {
  sessionId: string;
  isRecoverable: boolean;
  workerStatus: 'running' | 'stopped' | 'not_found';
  lastHeartbeat?: string;
  reason?: string;
}

// Heartbeat timeout threshold (60 seconds)
const HEARTBEAT_TIMEOUT_MS = 60000;

class SessionRecoveryService {
  /**
   * Recover sessions on backend startup
   * Called after database connection, before accepting HTTP requests
   */
  async recoverSessions(): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      totalChecked: 0,
      recovered: 0,
      disconnected: 0,
      errors: [],
    };

    try {
      logger.info('Starting session recovery...');

      // Find all sessions that were marked as connected or connecting
      const activeSessions = await Session.find({
        status: { $in: ['connected', 'connecting'] },
      }).exec();

      result.totalChecked = activeSessions.length;

      if (activeSessions.length === 0) {
        logger.info('No active sessions to recover');
        return result;
      }

      logger.info(`Found ${activeSessions.length} sessions to check`);

      // Check each session
      for (const session of activeSessions) {
        try {
          const healthStatus = await this.checkSessionHealth(session);

          if (healthStatus.isRecoverable) {
            // Mark as recoverable - worker is still running
            await this.markSessionRecoverable(session);
            result.recovered++;
            logger.info(`Session ${session._id} marked as recoverable`, {
              workerStatus: healthStatus.workerStatus,
            });
          } else {
            // Worker is dead - mark session as disconnected
            await this.markSessionDisconnected(session, healthStatus.reason);
            result.disconnected++;
            logger.info(`Session ${session._id} marked as disconnected`, {
              reason: healthStatus.reason,
            });
          }
        } catch (error) {
          const errorMsg = `Error recovering session ${session._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      logger.info('Session recovery complete', result);
      return result;
    } catch (error) {
      logger.error('Session recovery failed:', error);
      throw error;
    }
  }

  /**
   * Check if a session's worker is still alive
   */
  async checkSessionHealth(session: ISessionDocument): Promise<SessionHealthStatus> {
    const sessionId = session._id.toString();

    try {
      // Get routing info from Redis
      const routing = await sessionRegistry.getSession(sessionId);

      if (!routing) {
        return {
          sessionId,
          isRecoverable: false,
          workerStatus: 'not_found',
          reason: 'No routing info in Redis',
        };
      }

      // Check heartbeat timestamp
      const lastHeartbeat = new Date(routing.lastHeartbeat).getTime();
      const now = Date.now();
      const heartbeatAge = now - lastHeartbeat;

      if (heartbeatAge > HEARTBEAT_TIMEOUT_MS) {
        return {
          sessionId,
          isRecoverable: false,
          workerStatus: 'stopped',
          lastHeartbeat: routing.lastHeartbeat,
          reason: `Heartbeat stale (${Math.round(heartbeatAge / 1000)}s old)`,
        };
      }

      // Worker is alive - session can be recovered
      return {
        sessionId,
        isRecoverable: true,
        workerStatus: 'running',
        lastHeartbeat: routing.lastHeartbeat,
      };
    } catch (error) {
      return {
        sessionId,
        isRecoverable: false,
        workerStatus: 'not_found',
        reason: `Error checking health: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }
  }

  /**
   * Check health of a specific session by ID
   */
  async checkWorkerHealth(sessionId: string): Promise<SessionHealthStatus> {
    const session = await Session.findById(sessionId);

    if (!session) {
      return {
        sessionId,
        isRecoverable: false,
        workerStatus: 'not_found',
        reason: 'Session not found in database',
      };
    }

    return this.checkSessionHealth(session);
  }

  /**
   * Mark a session as recoverable
   */
  private async markSessionRecoverable(session: ISessionDocument): Promise<void> {
    // Update status to 'recoverable' in MongoDB
    session.status = 'recoverable' as any; // Will add to types
    session.lastActivityAt = new Date();
    await session.save();

    // Update Redis status
    await sessionRegistry.updateSessionStatus(session._id.toString(), 'connected');
  }

  /**
   * Mark a session as disconnected and clean up
   */
  private async markSessionDisconnected(session: ISessionDocument, reason?: string): Promise<void> {
    const sessionId = session._id.toString();

    // Update MongoDB
    session.status = 'disconnected';
    session.connectionEndedAt = new Date();
    session.errorMessage = reason || 'Session ended during backend restart';
    await session.save();

    // Clean up Redis
    await sessionRegistry.deleteSession(sessionId);
  }

  /**
   * Get recoverable sessions for a user
   */
  async getRecoverableSessions(userId: string): Promise<ISessionDocument[]> {
    return Session.find({
      userId,
      status: { $in: ['connected', 'recoverable'] },
    })
      .populate('instanceId', 'name host provider')
      .sort({ lastActivityAt: -1 })
      .exec();
  }

  /**
   * Clean up stale sessions that have been recoverable for too long
   */
  async cleanupStaleSessions(maxAgeMinutes: number = 60): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    const staleSessions = await Session.find({
      status: 'recoverable',
      lastActivityAt: { $lt: cutoff },
    }).exec();

    let cleanedCount = 0;

    for (const session of staleSessions) {
      await this.markSessionDisconnected(session, 'Recovery window expired');
      cleanedCount++;
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} stale recoverable sessions`);
    }

    return cleanedCount;
  }
}

export const sessionRecoveryService = new SessionRecoveryService();
