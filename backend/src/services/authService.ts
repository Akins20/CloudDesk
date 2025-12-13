import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { User, IUserDocument } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { AUDIT_ACTIONS, ERROR_CODES } from '../config/constants';
import {
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import {
  RegisterDTO,
  LoginDTO,
  TokenPayload,
  RefreshTokenPayload,
  AuthTokens,
  AuthResponse,
} from '../types';

class AuthService {
  /**
   * Register a new user
   */
  async register(
    data: RegisterDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      await this.logAuditAction(
        existingUser._id.toString(),
        AUDIT_ACTIONS.USER_REGISTER,
        'failure',
        ipAddress,
        userAgent,
        { reason: 'Email already exists' }
      );
      throw new ConflictError('User with this email already exists', ERROR_CODES.USER_EXISTS);
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
    });

    await user.save();

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Log audit
    await this.logAuditAction(
      user._id.toString(),
      AUDIT_ACTIONS.USER_REGISTER,
      'success',
      ipAddress,
      userAgent
    );

    logger.info(`User registered: ${user.email}`);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Login user
   */
  async login(
    data: LoginDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user by email (include password for comparison)
    const user = await User.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password', ERROR_CODES.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
      await this.logAuditAction(
        user._id.toString(),
        AUDIT_ACTIONS.USER_LOGIN,
        'failure',
        ipAddress,
        userAgent,
        { reason: 'Account inactive' }
      );
      throw new UnauthorizedError('Account is inactive', ERROR_CODES.USER_INACTIVE);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await this.logAuditAction(
        user._id.toString(),
        AUDIT_ACTIONS.USER_LOGIN,
        'failure',
        ipAddress,
        userAgent,
        { reason: 'Invalid password' }
      );
      throw new UnauthorizedError('Invalid email or password', ERROR_CODES.INVALID_CREDENTIALS);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Log audit
    await this.logAuditAction(
      user._id.toString(),
      AUDIT_ACTIONS.USER_LOGIN,
      'success',
      ipAddress,
      userAgent
    );

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthTokens> {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedError('User not found', ERROR_CODES.USER_NOT_FOUND);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive', ERROR_CODES.USER_INACTIVE);
    }

    // Check refresh token version (for token invalidation)
    if (payload.version !== user.refreshTokenVersion) {
      await this.logAuditAction(
        user._id.toString(),
        AUDIT_ACTIONS.TOKEN_REFRESH,
        'failure',
        ipAddress,
        userAgent,
        { reason: 'Token version mismatch' }
      );
      throw new UnauthorizedError('Refresh token has been revoked', ERROR_CODES.TOKEN_INVALID);
    }

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Log audit
    await this.logAuditAction(
      user._id.toString(),
      AUDIT_ACTIONS.TOKEN_REFRESH,
      'success',
      ipAddress,
      userAgent
    );

    logger.debug(`Tokens refreshed for user: ${user.email}`);

    return tokens;
  }

  /**
   * Logout user (invalidate refresh tokens)
   */
  async logout(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
    }

    // Increment refresh token version to invalidate all existing refresh tokens
    await user.incrementRefreshTokenVersion();

    // Log audit
    await this.logAuditAction(
      userId,
      AUDIT_ACTIONS.USER_LOGOUT,
      'success',
      ipAddress,
      userAgent
    );

    logger.info(`User logged out: ${user.email}`);
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
    }
    return user;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      await this.logAuditAction(
        userId,
        AUDIT_ACTIONS.PASSWORD_CHANGE,
        'failure',
        ipAddress,
        userAgent,
        { reason: 'Invalid current password' }
      );
      throw new ValidationError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;

    // Increment refresh token version to invalidate all existing tokens
    user.refreshTokenVersion += 1;

    await user.save();

    // Log audit
    await this.logAuditAction(
      userId,
      AUDIT_ACTIONS.PASSWORD_CHANGE,
      'success',
      ipAddress,
      userAgent
    );

    logger.info(`Password changed for user: ${user.email}`);
  }

  /**
   * Generate access and refresh tokens
   */
  generateTokens(user: IUserDocument): AuthTokens {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    return { accessToken, refreshToken };
  }

  /**
   * Generate access token
   */
  generateAccessToken(user: IUserDocument): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload as object, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user: IUserDocument): string {
    const payload: RefreshTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      version: user.refreshTokenVersion,
    };

    return jwt.sign(payload as object, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token has expired', ERROR_CODES.TOKEN_EXPIRED);
      }
      throw new UnauthorizedError('Invalid access token', ERROR_CODES.TOKEN_INVALID);
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token has expired', ERROR_CODES.TOKEN_EXPIRED);
      }
      throw new UnauthorizedError('Invalid refresh token', ERROR_CODES.TOKEN_INVALID);
    }
  }

  /**
   * Log audit action
   */
  private async logAuditAction(
    userId: string,
    action: string,
    status: 'success' | 'failure',
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await AuditLog.logAction({
        userId,
        action: action as typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS],
        status,
        ipAddress,
        userAgent,
        details,
      });
    } catch (error) {
      logger.error('Failed to log audit action:', error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

export default authService;
