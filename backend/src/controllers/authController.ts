import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { asyncHandler, AuthRequest, getClientIp, getUserAgent } from '../middleware';
import { HTTP_STATUS } from '../config/constants';
import { RegisterDTO, LoginDTO } from '../types';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data: RegisterDTO = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const result = await authService.register(data, ipAddress, userAgent);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: result,
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data: LoginDTO = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const result = await authService.login(data, ipAddress, userAgent);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result,
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  const tokens = await authService.refreshTokens(refreshToken, ipAddress, userAgent);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: tokens,
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  await authService.logout(userId, ipAddress, userAgent);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;

  const user = await authService.getCurrentUser(userId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    },
  });
});

/**
 * Change password
 * POST /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { currentPassword, newPassword } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  await authService.changePassword(userId, currentPassword, newPassword, ipAddress, userAgent);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { message: 'Password changed successfully' },
  });
});

export default {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword,
};
