import Redis from 'ioredis';
import { env } from '../../config/environment';
import { logger } from '../../utils/logger';

// Session status types
export type SessionStatus = 'creating' | 'connecting' | 'connected' | 'recoverable' | 'disconnecting' | 'disconnected' | 'error';

// Session routing info stored in Redis
export interface SessionRouting {
  sessionId: string;
  workerId: string;
  workerUrl: string;
  workerPort: number;
  userId: string;
  instanceId: string;
  status: SessionStatus;
  createdAt: string;
  lastHeartbeat: string;
}

// Worker info stored in Redis
export interface WorkerInfo {
  workerId: string;
  sessionId: string;
  containerId: string;
  hostPort: number;
  status: 'starting' | 'healthy' | 'unhealthy' | 'terminating';
  createdAt: string;
  lastHeartbeat: string;
}

// Session create request
export interface SessionCreateRequest {
  sessionId: string;
  userId: string;
  instanceId: string;
  desktopEnvironment: 'xfce' | 'lxde';
  sshConfig: {
    host: string;
    port: number;
    username: string;
    credential: string; // Encrypted
    authType: 'key' | 'password';
  };
}

// Redis pub/sub channels
export const CHANNELS = {
  SESSION_CREATE: 'session:create',
  SESSION_READY: 'session:ready',
  SESSION_ERROR: 'session:error',
  SESSION_TERMINATE: 'session:terminate',
  SESSION_HEARTBEAT: 'session:heartbeat',
  SESSION_DISCONNECTED: 'session:disconnected',
};

// Redis key prefixes
const KEYS = {
  SESSION: 'session:',
  WORKER: 'worker:',
  LOCK: 'lock:session:',
  PORT: 'port:allocated:',
};

class SessionRegistry {
  private redis: Redis;
  private subscriber: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.redis = new Redis(env.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.subscriber = new Redis(env.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && this.redis.status === 'ready';
  }

  /**
   * Acquire a lock for session creation to prevent duplicates
   */
  async acquireSessionLock(userId: string, instanceId: string, sessionId: string, ttlSeconds: number = 30): Promise<boolean> {
    const lockKey = `${KEYS.LOCK}${userId}:${instanceId}`;
    const result = await this.redis.set(lockKey, sessionId, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /**
   * Release session lock
   */
  async releaseSessionLock(userId: string, instanceId: string): Promise<void> {
    const lockKey = `${KEYS.LOCK}${userId}:${instanceId}`;
    await this.redis.del(lockKey);
  }

  /**
   * Register a new session
   */
  async registerSession(routing: SessionRouting): Promise<void> {
    const key = `${KEYS.SESSION}${routing.sessionId}`;
    await this.redis.hset(key, {
      sessionId: routing.sessionId,
      workerId: routing.workerId,
      workerUrl: routing.workerUrl,
      workerPort: routing.workerPort.toString(),
      userId: routing.userId,
      instanceId: routing.instanceId,
      status: routing.status,
      createdAt: routing.createdAt,
      lastHeartbeat: routing.lastHeartbeat,
    });

    // Set TTL for cleanup (24 hours)
    await this.redis.expire(key, 86400);

    logger.debug(`Session registered: ${routing.sessionId}`);
  }

  /**
   * Get session routing info
   */
  async getSession(sessionId: string): Promise<SessionRouting | null> {
    const key = `${KEYS.SESSION}${sessionId}`;
    const data = await this.redis.hgetall(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      sessionId: data.sessionId,
      workerId: data.workerId,
      workerUrl: data.workerUrl,
      workerPort: parseInt(data.workerPort, 10),
      userId: data.userId,
      instanceId: data.instanceId,
      status: data.status as SessionStatus,
      createdAt: data.createdAt,
      lastHeartbeat: data.lastHeartbeat,
    };
  }

  /**
   * Update session status
   */
  async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
    const key = `${KEYS.SESSION}${sessionId}`;
    await this.redis.hset(key, {
      status,
      lastHeartbeat: new Date().toISOString(),
    });
  }

  /**
   * Update session worker info (after worker starts)
   */
  async updateSessionWorker(sessionId: string, workerId: string, workerUrl: string, workerPort: number): Promise<void> {
    const key = `${KEYS.SESSION}${sessionId}`;
    await this.redis.hset(key, {
      workerId,
      workerUrl,
      workerPort: workerPort.toString(),
      status: 'connected',
      lastHeartbeat: new Date().toISOString(),
    });
  }

  /**
   * Update session heartbeat
   */
  async updateHeartbeat(sessionId: string): Promise<void> {
    const key = `${KEYS.SESSION}${sessionId}`;
    await this.redis.hset(key, 'lastHeartbeat', new Date().toISOString());
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      // Release the lock
      await this.releaseSessionLock(session.userId, session.instanceId);
    }

    const key = `${KEYS.SESSION}${sessionId}`;
    await this.redis.del(key);

    logger.debug(`Session deleted: ${sessionId}`);
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionRouting[]> {
    const keys = await this.redis.keys(`${KEYS.SESSION}*`);
    const sessions: SessionRouting[] = [];

    for (const key of keys) {
      const data = await this.redis.hgetall(key);
      if (data.userId === userId && data.status !== 'disconnected') {
        sessions.push({
          sessionId: data.sessionId,
          workerId: data.workerId,
          workerUrl: data.workerUrl,
          workerPort: parseInt(data.workerPort, 10),
          userId: data.userId,
          instanceId: data.instanceId,
          status: data.status as SessionStatus,
          createdAt: data.createdAt,
          lastHeartbeat: data.lastHeartbeat,
        });
      }
    }

    return sessions;
  }

  /**
   * Register a worker
   */
  async registerWorker(worker: WorkerInfo): Promise<void> {
    const key = `${KEYS.WORKER}${worker.workerId}`;
    await this.redis.hset(key, {
      workerId: worker.workerId,
      sessionId: worker.sessionId,
      containerId: worker.containerId,
      hostPort: worker.hostPort.toString(),
      status: worker.status,
      createdAt: worker.createdAt,
      lastHeartbeat: worker.lastHeartbeat,
    });

    // Set TTL
    await this.redis.expire(key, 86400);
  }

  /**
   * Get worker info
   */
  async getWorker(workerId: string): Promise<WorkerInfo | null> {
    const key = `${KEYS.WORKER}${workerId}`;
    const data = await this.redis.hgetall(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      workerId: data.workerId,
      sessionId: data.sessionId,
      containerId: data.containerId,
      hostPort: parseInt(data.hostPort, 10),
      status: data.status as WorkerInfo['status'],
      createdAt: data.createdAt,
      lastHeartbeat: data.lastHeartbeat,
    };
  }

  /**
   * Delete worker
   */
  async deleteWorker(workerId: string): Promise<void> {
    const key = `${KEYS.WORKER}${workerId}`;
    await this.redis.del(key);
  }

  /**
   * Allocate a port for a worker
   */
  async allocatePort(portRangeStart: number, portRangeEnd: number): Promise<number | null> {
    for (let port = portRangeStart; port <= portRangeEnd; port++) {
      const key = `${KEYS.PORT}${port}`;
      const acquired = await this.redis.set(key, '1', 'EX', 86400, 'NX');
      if (acquired === 'OK') {
        return port;
      }
    }
    return null;
  }

  /**
   * Release an allocated port
   */
  async releasePort(port: number): Promise<void> {
    const key = `${KEYS.PORT}${port}`;
    await this.redis.del(key);
  }

  /**
   * Publish a session create event
   */
  async publishSessionCreate(request: SessionCreateRequest): Promise<void> {
    await this.redis.publish(CHANNELS.SESSION_CREATE, JSON.stringify(request));
    logger.debug(`Published session:create for ${request.sessionId}`);
  }

  /**
   * Publish a session terminate event
   */
  async publishSessionTerminate(sessionId: string, reason: string = 'user_disconnect'): Promise<void> {
    await this.redis.publish(CHANNELS.SESSION_TERMINATE, JSON.stringify({ sessionId, reason }));
    logger.debug(`Published session:terminate for ${sessionId}`);
  }

  /**
   * Subscribe to session events
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  /**
   * Wait for a session to become ready
   */
  async waitForSessionReady(sessionId: string, timeoutMs: number = 60000): Promise<SessionRouting> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.subscriber.unsubscribe(CHANNELS.SESSION_READY, CHANNELS.SESSION_ERROR);
        reject(new Error('Session creation timed out'));
      }, timeoutMs);

      const handler = (channel: string, message: string) => {
        try {
          const data = JSON.parse(message);
          if (data.sessionId !== sessionId) return;

          clearTimeout(timeout);
          this.subscriber.unsubscribe(CHANNELS.SESSION_READY, CHANNELS.SESSION_ERROR);
          this.subscriber.removeListener('message', handler);

          if (channel === CHANNELS.SESSION_READY) {
            resolve(data as SessionRouting);
          } else {
            reject(new Error(data.error || 'Session creation failed'));
          }
        } catch (error) {
          // Ignore parse errors for messages we don't care about
        }
      };

      this.subscriber.subscribe(CHANNELS.SESSION_READY, CHANNELS.SESSION_ERROR);
      this.subscriber.on('message', handler);
    });
  }

  /**
   * Get sessions with stale heartbeats
   */
  async getStaleSessionIds(maxAgeMs: number = 60000): Promise<string[]> {
    const keys = await this.redis.keys(`${KEYS.SESSION}*`);
    const staleSessions: string[] = [];
    const now = Date.now();

    for (const key of keys) {
      const data = await this.redis.hgetall(key);
      if (data.status === 'connected' || data.status === 'connecting') {
        const lastHeartbeat = new Date(data.lastHeartbeat).getTime();
        if (now - lastHeartbeat > maxAgeMs) {
          staleSessions.push(data.sessionId);
        }
      }
    }

    return staleSessions;
  }

  /**
   * Close Redis connections
   */
  async close(): Promise<void> {
    await this.subscriber.quit();
    await this.redis.quit();
    logger.info('Redis connections closed');
  }
}

// Export singleton instance
export const sessionRegistry = new SessionRegistry();

export default sessionRegistry;
