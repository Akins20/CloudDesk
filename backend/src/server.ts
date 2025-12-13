import http from 'http';
import { createApp } from './app';
import { env } from './config/environment';
import { connectDatabase, disconnectDatabase } from './config/database';
import { sessionService } from './services/sessionService';
import { tunnelService } from './services/tunnelService';
import { sshService } from './services/sshService';
import { createVNCProxy } from './websocket/vncProxy';
import { connectionManager } from './websocket/connectionManager';
import { logger } from './utils/logger';

// Create Express app
const app = createApp();

// Create HTTP server
const server = http.createServer(app);

// Create VNC WebSocket proxy
const vncProxy = createVNCProxy({ server, path: '/vnc' });

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Stop session cleanup job
    sessionService.stopCleanupJob();

    // Close all WebSocket connections
    vncProxy.closeAll();
    connectionManager.closeAll();
    connectionManager.stopHeartbeat();

    // Close all SSH tunnels
    await tunnelService.closeAllTunnels();

    // Close all SSH connections
    sshService.closeAllConnections();

    // Disconnect from database
    await disconnectDatabase();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Start session cleanup job
    sessionService.startCleanupJob();

    // Start WebSocket heartbeat
    connectionManager.startHeartbeat();

    // Start HTTP server
    server.listen(env.PORT, () => {
      logger.info(`
========================================
🚀 CloudDesk Backend Server Started
========================================
Environment: ${env.NODE_ENV}
Port: ${env.PORT}
API URL: http://localhost:${env.PORT}/api
WebSocket URL: ws://localhost:${env.PORT}/vnc
========================================
      `);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${env.PORT} is already in use`);
        process.exit(1);
      } else {
        throw error;
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

export { server };
