import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { isAppError, isOperationalError } from '../utils/errors';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants';
import { logger, logError } from '../utils/logger';

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
}

/**
 * List of sensitive fields that should never appear in error responses
 */
const SENSITIVE_FIELDS = [
  'password',
  'privateKey',
  'credential',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
];

/**
 * Sanitize error details to remove sensitive information
 */
function sanitizeErrorDetails(details: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!details) return undefined;

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase();

    // Skip sensitive fields
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeErrorDetails(value as Record<string, unknown>);
    } else if (typeof value === 'string' && value.length > 200) {
      // Truncate long strings that might contain sensitive data
      sanitized[key] = value.substring(0, 200) + '...[truncated]';
    } else {
      sanitized[key] = value;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * Global error handler middleware
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logError(err, {
    method: req.method,
    url: req.url,
    userId: (req as unknown as { user?: { userId: string } }).user?.userId,
    ip: req.ip,
  });

  // Default error values
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let code: string = ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected error occurred';
  let details: Record<string, unknown> | undefined;

  // Handle known error types
  if (isAppError(err)) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = HTTP_STATUS.BAD_REQUEST;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    details = { errors: (err as unknown as { errors: unknown }).errors };
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId, etc.)
    statusCode = HTTP_STATUS.BAD_REQUEST;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Invalid ID format';
  } else if (err.name === 'MongoServerError') {
    // MongoDB errors
    const mongoErr = err as unknown as { code: number; keyValue?: Record<string, unknown> };
    if (mongoErr.code === 11000) {
      statusCode = HTTP_STATUS.CONFLICT;
      code = ERROR_CODES.USER_EXISTS;
      message = 'Duplicate key error';
      details = { duplicateKey: mongoErr.keyValue };
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    code = ERROR_CODES.TOKEN_INVALID;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    code = ERROR_CODES.TOKEN_EXPIRED;
    message = 'Token has expired';
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    // JSON parse error
    statusCode = HTTP_STATUS.BAD_REQUEST;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Invalid JSON in request body';
  }

  // Sanitize error details before sending to client
  const sanitizedDetails = sanitizeErrorDetails(details);

  // Build error response - NEVER include stack traces in responses
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
      ...(sanitizedDetails && { details: sanitizedDetails }),
    },
  };

  // Log unexpected errors at error level (includes full stack for debugging)
  if (!isOperationalError(err)) {
    logger.error('Unexpected error:', {
      error: err.message,
      stack: err.stack,
      name: err.name,
      // Log full details to server logs, not client response
      fullDetails: details,
    });
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Not found handler (404)
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: ERROR_CODES.NOT_FOUND,
    },
  };

  res.status(HTTP_STATUS.NOT_FOUND).json(errorResponse);
};

/**
 * Async handler wrapper to catch async errors
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
