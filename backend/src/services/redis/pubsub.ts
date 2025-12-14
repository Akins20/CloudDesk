import { sessionRegistry, CHANNELS, SessionCreateRequest, SessionRouting } from './sessionRegistry';
import { logger } from '../../utils/logger';

// Event handler types
type SessionCreateHandler = (request: SessionCreateRequest) => Promise<void>;
type SessionReadyHandler = (routing: SessionRouting) => Promise<void>;
type SessionErrorHandler = (data: { sessionId: string; error: string }) => Promise<void>;
type SessionTerminateHandler = (data: { sessionId: string; reason: string }) => Promise<void>;
type SessionHeartbeatHandler = (data: { sessionId: string; workerId: string; timestamp: string }) => Promise<void>;

interface PubSubHandlers {
  onSessionCreate?: SessionCreateHandler;
  onSessionReady?: SessionReadyHandler;
  onSessionError?: SessionErrorHandler;
  onSessionTerminate?: SessionTerminateHandler;
  onSessionHeartbeat?: SessionHeartbeatHandler;
}

class PubSubManager {
  private handlers: PubSubHandlers = {};
  private isSubscribed: boolean = false;

  /**
   * Register event handlers
   */
  registerHandlers(handlers: PubSubHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Start listening to pub/sub events
   */
  async startListening(): Promise<void> {
    if (this.isSubscribed) {
      logger.warn('PubSub already subscribed');
      return;
    }

    // Subscribe to session create events
    if (this.handlers.onSessionCreate) {
      await sessionRegistry.subscribe(CHANNELS.SESSION_CREATE, async (message) => {
        try {
          const request = JSON.parse(message) as SessionCreateRequest;
          await this.handlers.onSessionCreate!(request);
        } catch (error) {
          logger.error('Error handling session:create event:', error);
        }
      });
    }

    // Subscribe to session ready events
    if (this.handlers.onSessionReady) {
      await sessionRegistry.subscribe(CHANNELS.SESSION_READY, async (message) => {
        try {
          const routing = JSON.parse(message) as SessionRouting;
          await this.handlers.onSessionReady!(routing);
        } catch (error) {
          logger.error('Error handling session:ready event:', error);
        }
      });
    }

    // Subscribe to session error events
    if (this.handlers.onSessionError) {
      await sessionRegistry.subscribe(CHANNELS.SESSION_ERROR, async (message) => {
        try {
          const data = JSON.parse(message) as { sessionId: string; error: string };
          await this.handlers.onSessionError!(data);
        } catch (error) {
          logger.error('Error handling session:error event:', error);
        }
      });
    }

    // Subscribe to session terminate events
    if (this.handlers.onSessionTerminate) {
      await sessionRegistry.subscribe(CHANNELS.SESSION_TERMINATE, async (message) => {
        try {
          const data = JSON.parse(message) as { sessionId: string; reason: string };
          await this.handlers.onSessionTerminate!(data);
        } catch (error) {
          logger.error('Error handling session:terminate event:', error);
        }
      });
    }

    // Subscribe to heartbeat events
    if (this.handlers.onSessionHeartbeat) {
      await sessionRegistry.subscribe(CHANNELS.SESSION_HEARTBEAT, async (message) => {
        try {
          const data = JSON.parse(message) as { sessionId: string; workerId: string; timestamp: string };
          await this.handlers.onSessionHeartbeat!(data);
        } catch (error) {
          logger.error('Error handling session:heartbeat event:', error);
        }
      });
    }

    this.isSubscribed = true;
    logger.info('PubSub manager started listening');
  }

  /**
   * Publish session ready event (called by session worker)
   */
  async publishSessionReady(routing: SessionRouting): Promise<void> {
    const redis = await import('ioredis').then(m => new m.default(process.env.REDIS_URL || 'redis://localhost:6379'));
    await redis.publish(CHANNELS.SESSION_READY, JSON.stringify(routing));
    await redis.quit();
    logger.debug(`Published session:ready for ${routing.sessionId}`);
  }

  /**
   * Publish session error event (called by session worker)
   */
  async publishSessionError(sessionId: string, error: string): Promise<void> {
    const redis = await import('ioredis').then(m => new m.default(process.env.REDIS_URL || 'redis://localhost:6379'));
    await redis.publish(CHANNELS.SESSION_ERROR, JSON.stringify({ sessionId, error }));
    await redis.quit();
    logger.debug(`Published session:error for ${sessionId}: ${error}`);
  }

  /**
   * Publish heartbeat event (called by session worker)
   */
  async publishHeartbeat(sessionId: string, workerId: string): Promise<void> {
    const redis = await import('ioredis').then(m => new m.default(process.env.REDIS_URL || 'redis://localhost:6379'));
    await redis.publish(CHANNELS.SESSION_HEARTBEAT, JSON.stringify({
      sessionId,
      workerId,
      timestamp: new Date().toISOString(),
    }));
    await redis.quit();
  }

  /**
   * Publish session disconnected event
   */
  async publishSessionDisconnected(sessionId: string, reason: string): Promise<void> {
    const redis = await import('ioredis').then(m => new m.default(process.env.REDIS_URL || 'redis://localhost:6379'));
    await redis.publish(CHANNELS.SESSION_DISCONNECTED, JSON.stringify({ sessionId, reason }));
    await redis.quit();
    logger.debug(`Published session:disconnected for ${sessionId}`);
  }
}

// Export singleton
export const pubSubManager = new PubSubManager();

export default pubSubManager;
