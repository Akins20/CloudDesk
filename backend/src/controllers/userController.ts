import { Request, Response } from 'express';
import { User } from '../models/User';
import { asyncHandler, AuthRequest } from '../middleware';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { NotFoundError, ForbiddenError } from '../utils/errors';

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
  }

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
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * Update user profile
 * PUT /api/users/profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { firstName, lastName } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
  }

  // Update allowed fields
  if (firstName !== undefined) {
    user.firstName = firstName;
  }
  if (lastName !== undefined) {
    user.lastName = lastName;
  }

  await user.save();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * Get all users (admin only)
 * GET /api/users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { role } = (req as AuthRequest).user;

  if (role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const [users, total] = await Promise.all([
    User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(),
  ]);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: users.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Get user by ID (admin only)
 * GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { role } = (req as AuthRequest).user;
  const { id } = req.params;

  if (role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
  }

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
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * Update user status (admin only)
 * PUT /api/users/:id/status
 */
export const updateUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { role, userId: currentUserId } = (req as AuthRequest).user;
  const { id } = req.params;
  const { isActive } = req.body;

  if (role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  // Prevent admin from deactivating themselves
  if (id === currentUserId && isActive === false) {
    throw new ForbiddenError('Cannot deactivate your own account');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
  }

  user.isActive = isActive;
  await user.save();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      id: user._id.toString(),
      email: user.email,
      isActive: user.isActive,
    },
  });
});

export default {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
};
