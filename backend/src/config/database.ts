import mongoose from 'mongoose';
import { env } from './environment';
import { logger } from '../utils/logger';

interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

const getDatabaseConfig = (): DatabaseConfig => {
  return {
    uri: env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    },
  };
};

export const connectDatabase = async (): Promise<typeof mongoose> => {
  const config = getDatabaseConfig();

  try {
    // Set up connection event handlers before connecting
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    const connection = await mongoose.connect(config.uri, config.options);

    logger.info(`MongoDB connected to database: ${connection.connection.name}`);

    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

export const getDatabaseStatus = (): {
  isConnected: boolean;
  readyState: number;
  readyStateString: string;
} => {
  const readyState = mongoose.connection.readyState;
  const readyStateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    isConnected: readyState === 1,
    readyState,
    readyStateString: readyStateMap[readyState] || 'unknown',
  };
};

export default {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
};
