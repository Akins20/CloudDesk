import { SessionController } from './controller';

// Configuration from environment
const config = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  workerImage: process.env.WORKER_IMAGE || 'clouddesk/session-worker:latest',
  networkName: process.env.DOCKER_NETWORK || 'clouddesk-network',
  portRangeStart: parseInt(process.env.PORT_RANGE_START || '8080', 10),
  portRangeEnd: parseInt(process.env.PORT_RANGE_END || '8180', 10),
  heartbeatTimeout: parseInt(process.env.HEARTBEAT_TIMEOUT || '60000', 10),
  jwtSecret: process.env.JWT_ACCESS_SECRET || '',
};

let controller: SessionController | null = null;

async function main(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Session Controller starting...`);
  console.log(`  Redis URL: ${config.redisUrl}`);
  console.log(`  Worker Image: ${config.workerImage}`);
  console.log(`  Docker Network: ${config.networkName}`);
  console.log(`  Port Range: ${config.portRangeStart}-${config.portRangeEnd}`);

  controller = new SessionController(config);
  await controller.start();

  console.log(`[${new Date().toISOString()}] Session Controller ready`);
}

async function shutdown(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Shutting down...`);

  if (controller) {
    await controller.stop();
    controller = null;
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
