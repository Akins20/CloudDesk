import { Router } from 'express';
import { authController } from '../controllers';
import { authenticate, validateBody, authLimiter, checkUserLimit } from '../middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../utils/validators';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  checkUserLimit,
  validateBody(registerSchema),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires valid refresh token)
 */
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate refresh tokens)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

export default router;
