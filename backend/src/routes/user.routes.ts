import { Router } from 'express';
import Joi from 'joi';
import { userController } from '../controllers';
import { authenticate, validateBody, validateParams } from '../middleware';
import { objectIdParamSchema } from '../utils/validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete current user account and all data
 * @access  Private
 */
router.delete(
  '/account',
  validateBody(
    Joi.object({
      password: Joi.string().required().messages({
        'any.required': 'Password is required to confirm deletion',
      }),
      confirmDelete: Joi.string().valid('DELETE').required().messages({
        'any.only': 'Please type DELETE to confirm account deletion',
        'any.required': 'Confirmation is required',
      }),
    })
  ),
  userController.deleteAccount
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/profile',
  validateBody(
    Joi.object({
      firstName: Joi.string().min(2).max(50).trim(),
      lastName: Joi.string().min(2).max(50).trim(),
    }).min(1)
  ),
  userController.updateProfile
);

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/', userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  validateParams(objectIdParamSchema),
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id/status
 * @desc    Update user status (admin only)
 * @access  Private (Admin)
 */
router.put(
  '/:id/status',
  validateParams(objectIdParamSchema),
  validateBody(
    Joi.object({
      isActive: Joi.boolean().required(),
    })
  ),
  userController.updateUserStatus
);

export default router;
