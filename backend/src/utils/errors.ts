import { ERROR_CODES, HTTP_STATUS, ErrorCode } from '../config/constants';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: ErrorCode = ERROR_CODES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: ErrorCode = ERROR_CODES.NOT_FOUND) {
    super(message, HTTP_STATUS.NOT_FOUND, code);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.USER_EXISTS) {
    super(message, HTTP_STATUS.CONFLICT, code);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class SSHError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.SSH_CONNECTION_FAILED) {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE, code);
    Object.setPrototypeOf(this, SSHError.prototype);
  }
}

export class VNCError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.VNC_START_FAILED) {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE, code);
    Object.setPrototypeOf(this, VNCError.prototype);
  }
}

export class SessionError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.SESSION_NOT_FOUND) {
    super(message, HTTP_STATUS.BAD_REQUEST, code);
    Object.setPrototypeOf(this, SessionError.prototype);
  }
}

export class TunnelError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.TUNNEL_CREATION_FAILED) {
    super(message, HTTP_STATUS.SERVICE_UNAVAILABLE, code);
    Object.setPrototypeOf(this, TunnelError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.VALIDATION_ERROR);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

// Type guard for AppError
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

// Type guard for operational errors (errors we threw intentionally)
export const isOperationalError = (error: unknown): boolean => {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
};

export default {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  SSHError,
  VNCError,
  SessionError,
  TunnelError,
  RateLimitError,
  isAppError,
  isOperationalError,
};
