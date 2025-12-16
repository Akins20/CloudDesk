import { createApp } from './app';
import { env } from './config/environment';
import { connectDatabase } from './config/database';
import { initializeKeys } from './utils/crypto';
import { ensureAdminExists } from './services/authService';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  try {
    logger.info('Starting CloudDesk License Server...');

    // Initialize cryptographic keys
    initializeKeys();

    // Connect to database
    await connectDatabase();

    // Ensure admin user exists
    await ensureAdminExists();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(`License Server running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`API URL: ${env.API_URL}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          const mongoose = await import('mongoose');
          await mongoose.default.disconnect();
          logger.info('Database connection closed');
        } catch (err) {
          logger.error('Error during shutdown:', err);
        }

        process.exit(0);
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
