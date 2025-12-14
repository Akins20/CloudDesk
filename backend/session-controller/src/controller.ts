import Docker from 'dockerode';
import Redis from 'ioredis';
import { PortManager } from './portManager';

// Session create request from Redis pub/sub
interface SessionCreateRequest {
  sessionId: string;
  userId: string;
  instanceId: string;
  desktopEnvironment: 'xfce' | 'lxde';
  sshConfig: {
    host: string;
    port: number;
    username: string;
    credential: string;
    authType: 'key' | 'password';
  };
}

// Redis pub/sub channels
const CHANNELS = {
  SESSION_CREATE: 'session:create',
  SESSION_READY: 'session:ready',
  SESSION_ERROR: 'session:error',
  SESSION_TERMINATE: 'session:terminate',
  SESSION_HEARTBEAT: 'session:heartbeat',
};

// Session worker container configuration
interface WorkerContainerConfig {
  sessionId: string;
  userId: string;
  instanceId: string;
  sshHost: string;
  sshPort: number;
  sshUsername: string;
  sshCredential: string;
  sshAuthType: 'key' | 'password';
  desktopEnvironment: 'xfce' | 'lxde';
  hostPort: number;
  redisUrl: string;
  jwtSecret: string;
}

export class SessionController {
  private docker: Docker;
  private redis: Redis;
  private subscriber: Redis;
  private portManager: PortManager;
  private workerImage: string;
  private networkName: string;
  private activeContainers: Map<string, string> = new Map(); // sessionId -> containerId
  private heartbeatTimeout: number;
  private heartbeatCheckInterval: NodeJS.Timeout | null = null;
  private lastHeartbeats: Map<string, number> = new Map(); // sessionId -> timestamp

  constructor(options: {
    redisUrl: string;
    workerImage: string;
    networkName: string;
    portRangeStart?: number;
    portRangeEnd?: number;
    heartbeatTimeout?: number;
    jwtSecret: string;
  }) {
    this.docker = new Docker();
    this.redis = new Redis(options.redisUrl);
    this.subscriber = new Redis(options.redisUrl);
    this.portManager = new PortManager(
      this.redis,
      options.portRangeStart || 8080,
      options.portRangeEnd || 8180
    );
    this.workerImage = options.workerImage;
    this.networkName = options.networkName;
    this.heartbeatTimeout = options.heartbeatTimeout || 60000;
  }

  /**
   * Start the controller
   */
  async start(): Promise<void> {
    console.log('[Controller] Starting session controller...');

    // Subscribe to session events
    await this.subscribeToEvents();

    // Start heartbeat checker
    this.startHeartbeatChecker();

    // Clean up any orphaned containers on startup
    await this.cleanupOrphanedContainers();

    console.log('[Controller] Session controller started');
  }

  /**
   * Subscribe to Redis pub/sub events
   */
  private async subscribeToEvents(): Promise<void> {
    await this.subscriber.subscribe(
      CHANNELS.SESSION_CREATE,
      CHANNELS.SESSION_TERMINATE,
      CHANNELS.SESSION_HEARTBEAT
    );

    this.subscriber.on('message', async (channel, message) => {
      try {
        const data = JSON.parse(message);

        switch (channel) {
          case CHANNELS.SESSION_CREATE:
            await this.handleSessionCreate(data as SessionCreateRequest);
            break;
          case CHANNELS.SESSION_TERMINATE:
            await this.handleSessionTerminate(data.sessionId, data.reason);
            break;
          case CHANNELS.SESSION_HEARTBEAT:
            this.handleHeartbeat(data.sessionId);
            break;
        }
      } catch (error) {
        console.error(`[Controller] Error handling message on ${channel}:`, error);
      }
    });

    console.log('[Controller] Subscribed to Redis pub/sub channels');
  }

  /**
   * Handle session create request
   */
  private async handleSessionCreate(request: SessionCreateRequest): Promise<void> {
    console.log(`[Controller] Creating session ${request.sessionId}`);

    try {
      // Allocate a port
      const hostPort = await this.portManager.allocatePort(request.sessionId);
      if (!hostPort) {
        throw new Error('No available ports');
      }

      // Create worker container
      const containerId = await this.createWorkerContainer({
        sessionId: request.sessionId,
        userId: request.userId,
        instanceId: request.instanceId,
        sshHost: request.sshConfig.host,
        sshPort: request.sshConfig.port,
        sshUsername: request.sshConfig.username,
        sshCredential: request.sshConfig.credential,
        sshAuthType: request.sshConfig.authType,
        desktopEnvironment: request.desktopEnvironment,
        hostPort,
        redisUrl: process.env.REDIS_URL || 'redis://redis:6379',
        jwtSecret: process.env.JWT_ACCESS_SECRET || '',
      });

      // Track the container
      this.activeContainers.set(request.sessionId, containerId);
      this.lastHeartbeats.set(request.sessionId, Date.now());

      console.log(`[Controller] Session ${request.sessionId} container created: ${containerId.substring(0, 12)}`);

    } catch (error) {
      console.error(`[Controller] Failed to create session ${request.sessionId}:`, error);

      // Publish error event
      await this.redis.publish(CHANNELS.SESSION_ERROR, JSON.stringify({
        sessionId: request.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }

  /**
   * Create a worker container
   */
  private async createWorkerContainer(config: WorkerContainerConfig): Promise<string> {
    const containerName = `session-worker-${config.sessionId}`;

    // Create container
    const container = await this.docker.createContainer({
      name: containerName,
      Image: this.workerImage,
      Env: [
        `SESSION_ID=${config.sessionId}`,
        `USER_ID=${config.userId}`,
        `INSTANCE_ID=${config.instanceId}`,
        `SSH_HOST=${config.sshHost}`,
        `SSH_PORT=${config.sshPort}`,
        `SSH_USERNAME=${config.sshUsername}`,
        `SSH_CREDENTIAL=${config.sshCredential}`,
        `SSH_AUTH_TYPE=${config.sshAuthType}`,
        `DESKTOP_ENVIRONMENT=${config.desktopEnvironment}`,
        `REDIS_URL=${config.redisUrl}`,
        `JWT_ACCESS_SECRET=${config.jwtSecret}`,
        `WORKER_PORT=8080`,
      ],
      ExposedPorts: {
        '8080/tcp': {},
      },
      HostConfig: {
        PortBindings: {
          '8080/tcp': [{ HostPort: config.hostPort.toString() }],
        },
        NetworkMode: this.networkName,
        RestartPolicy: { Name: 'no' },
        // Resource limits
        Memory: 256 * 1024 * 1024, // 256MB
        NanoCpus: 200000000, // 0.2 CPU
      },
      Labels: {
        'clouddesk.session.id': config.sessionId,
        'clouddesk.user.id': config.userId,
        'clouddesk.instance.id': config.instanceId,
        'clouddesk.type': 'session-worker',
      },
    });

    // Start container
    await container.start();

    return container.id;
  }

  /**
   * Handle session terminate request
   */
  private async handleSessionTerminate(sessionId: string, reason: string): Promise<void> {
    console.log(`[Controller] Terminating session ${sessionId}: ${reason}`);

    const containerId = this.activeContainers.get(sessionId);
    if (!containerId) {
      console.warn(`[Controller] No container found for session ${sessionId}`);
      return;
    }

    try {
      await this.stopAndRemoveContainer(containerId);
      this.activeContainers.delete(sessionId);
      this.lastHeartbeats.delete(sessionId);

      // Release port
      const allocatedPorts = await this.portManager.getAllocatedPorts();
      for (const [port, sid] of allocatedPorts) {
        if (sid === sessionId) {
          await this.portManager.releasePort(port);
          break;
        }
      }

      console.log(`[Controller] Session ${sessionId} terminated`);
    } catch (error) {
      console.error(`[Controller] Error terminating session ${sessionId}:`, error);
    }
  }

  /**
   * Handle heartbeat from worker
   */
  private handleHeartbeat(sessionId: string): void {
    this.lastHeartbeats.set(sessionId, Date.now());
  }

  /**
   * Start heartbeat checker
   */
  private startHeartbeatChecker(): void {
    this.heartbeatCheckInterval = setInterval(async () => {
      const now = Date.now();

      for (const [sessionId, lastHeartbeat] of this.lastHeartbeats) {
        if (now - lastHeartbeat > this.heartbeatTimeout) {
          console.warn(`[Controller] Session ${sessionId} heartbeat timeout`);
          await this.handleSessionTerminate(sessionId, 'heartbeat_timeout');
        }
      }
    }, 30000);
  }

  /**
   * Stop and remove a container
   */
  private async stopAndRemoveContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);

      // Try to stop gracefully
      try {
        await container.stop({ t: 10 });
      } catch (error: unknown) {
        // Container might already be stopped
        if (error instanceof Error && !error.message.includes('not running')) {
          throw error;
        }
      }

      // Remove container
      await container.remove({ force: true });
    } catch (error) {
      console.error(`[Controller] Error removing container ${containerId}:`, error);
    }
  }

  /**
   * Clean up orphaned containers on startup
   */
  private async cleanupOrphanedContainers(): Promise<void> {
    console.log('[Controller] Checking for orphaned containers...');

    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: ['clouddesk.type=session-worker'],
        },
      });

      for (const containerInfo of containers) {
        const sessionId = containerInfo.Labels?.['clouddesk.session.id'];
        if (sessionId && !this.activeContainers.has(sessionId)) {
          console.log(`[Controller] Removing orphaned container: ${containerInfo.Id.substring(0, 12)}`);
          await this.stopAndRemoveContainer(containerInfo.Id);
        }
      }
    } catch (error) {
      console.error('[Controller] Error cleaning up orphaned containers:', error);
    }
  }

  /**
   * Stop the controller
   */
  async stop(): Promise<void> {
    console.log('[Controller] Stopping session controller...');

    // Stop heartbeat checker
    if (this.heartbeatCheckInterval) {
      clearInterval(this.heartbeatCheckInterval);
      this.heartbeatCheckInterval = null;
    }

    // Stop all active containers
    for (const [sessionId, containerId] of this.activeContainers) {
      console.log(`[Controller] Stopping session ${sessionId}`);
      await this.stopAndRemoveContainer(containerId);
    }

    // Close Redis connections
    await this.subscriber.quit();
    await this.redis.quit();

    console.log('[Controller] Session controller stopped');
  }
}
