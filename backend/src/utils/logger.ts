import winston from 'winston';
import path from 'path';

// Custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    // Add stack trace for errors
    if (stack) {
      msg += `\n${stack}`;
    }

    return msg;
  })
);

// JSON format for production
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine log level from environment
const getLogLevel = (): string => {
  return process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
};

// Create transports based on environment
const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

  // Console transport - always enabled
  transports.push(
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : customFormat,
    })
  );

  // File transports - only in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    const logsDir = path.resolve(__dirname, '../../logs');

    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: jsonFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: jsonFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  return transports;
};

// Create the logger instance
export const logger = winston.createLogger({
  level: getLogLevel(),
  transports: getTransports(),
  exitOnError: false,
});

// Stream for Morgan HTTP request logging
export const httpLogStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

// Helper methods for structured logging
export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string
): void => {
  logger.http('HTTP Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    userId,
  });
};

export const logError = (
  error: Error,
  context?: Record<string, unknown>
): void => {
  logger.error(error.message, {
    name: error.name,
    stack: error.stack,
    ...context,
  });
};

export const logAudit = (
  action: string,
  userId: string,
  resource?: string,
  details?: Record<string, unknown>
): void => {
  logger.info('Audit Log', {
    action,
    userId,
    resource,
    ...details,
  });
};

export const logSSH = (
  event: string,
  host: string,
  details?: Record<string, unknown>
): void => {
  logger.debug('SSH Event', {
    event,
    host,
    ...details,
  });
};

export const logVNC = (
  event: string,
  instanceId: string,
  details?: Record<string, unknown>
): void => {
  logger.debug('VNC Event', {
    event,
    instanceId,
    ...details,
  });
};

export default logger;
