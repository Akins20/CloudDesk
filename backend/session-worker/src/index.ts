import { SessionWorker } from './worker';
import Redis from 'ioredis';

// Configuration from environment
const config = {
  sessionId: process.env.SESSION_ID!,
  userId: process.env.USER_ID!,
  instanceId: process.env.INSTANCE_ID!,
  sshConfig: {
    host: process.env.SSH_HOST!,
    port: parseInt(process.env.SSH_PORT || '22', 10),
    username: process.env.SSH_USERNAME!,
    authType: process.env.SSH_AUTH_TYPE as 'key' | 'password',
    credential: process.env.SSH_CREDENTIAL!,
  },
  desktopEnvironment: (process.env.DESKTOP_ENVIRONMENT || 'xfce') as 'xfce' | 'lxde',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_ACCESS_SECRET!,
  port: parseInt(process.env.WORKER_PORT || '8080', 10),
};

// Validate required config
function validateConfig(): void {
  const required = ['SESSION_ID', 'USER_ID', 'INSTANCE_ID', 'SSH_HOST', 'SSH_USERNAME', 'SSH_CREDENTIAL', 'JWT_ACCESS_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

// Redis pub/sub channels
const CHANNELS = {
  SESSION_READY: 'session:ready',
  SESSION_ERROR: 'session:error',
  SESSION_HEARTBEAT: 'session:heartbeat',
  SESSION_TERMINATE: 'session:terminate',
};

let worker: SessionWorker | null = null;
let redis: Redis | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

async function main(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Session Worker starting...`);
  console.log(`  Session ID: ${config.sessionId}`);
  console.log(`  Instance: ${config.sshConfig.host}:${config.sshConfig.port}`);
  console.log(`  WebSocket Port: ${config.port}`);

  validateConfig();

  redis = new Redis(config.redisUrl);
  worker = new SessionWorker(config);

  try {
    // Start the worker
    await worker.start();

    const workerId = process.env.HOSTNAME || `worker-${config.sessionId}`;
    const workerUrl = `${workerId}:${config.port}`;

    // Publish ready event
    await redis.publish(CHANNELS.SESSION_READY, JSON.stringify({
      sessionId: config.sessionId,
      workerId,
      workerUrl,
      workerPort: config.port,
      userId: config.userId,
      instanceId: config.instanceId,
      status: 'connected',
      createdAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
    }));

    console.log(`[${new Date().toISOString()}] Session Worker ready`);

    // Start heartbeat
    heartbeatInterval = setInterval(async () => {
      try {
        await redis!.publish(CHANNELS.SESSION_HEARTBEAT, JSON.stringify({
          sessionId: config.sessionId,
          workerId,
          timestamp: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, 30000);

    // Subscribe to terminate events
    const subscriber = new Redis(config.redisUrl);
    await subscriber.subscribe(CHANNELS.SESSION_TERMINATE);
    subscriber.on('message', async (channel, message) => {
      if (channel === CHANNELS.SESSION_TERMINATE) {
        try {
          const data = JSON.parse(message);
          if (data.sessionId === config.sessionId) {
            console.log(`[${new Date().toISOString()}] Received terminate signal: ${data.reason}`);
            await shutdown();
          }
        } catch (error) {
          console.error('Error processing terminate message:', error);
        }
      }
    });

  } catch (error) {
    console.error('Worker startup failed:', error);

    // Publish error event
    await redis.publish(CHANNELS.SESSION_ERROR, JSON.stringify({
      sessionId: config.sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }));

    process.exit(1);
  }
}

async function shutdown(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Shutting down gracefully...`);

  // Stop heartbeat
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  // Shutdown worker
  if (worker) {
    await worker.shutdown();
    worker = null;
  }

  // Close Redis
  if (redis) {
    await redis.quit();
    redis = null;
  }

  console.log(`[${new Date().toISOString()}] Shutdown complete`);
  process.exit(0);
}

// Signal handlers
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await shutdown();
});
process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled rejection:', reason);
  await shutdown();
});

// Start
main().catch(async (error) => {
  console.error('Fatal error:', error);
  await shutdown();
});
