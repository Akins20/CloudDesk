/**
 * Admin Routes
 * All admin dashboard routes
 */

import { Router } from 'express';
import { requireAdminAuth } from './middleware';
import authController from './controllers/auth';
import dashboardController from './controllers/dashboard';
import usersController from './controllers/users';
import instancesController from './controllers/instances';
import sessionsController from './controllers/sessions';
import analyticsController from './controllers/analytics';

const router = Router();

// Public routes (login)
router.get('/login', authController.loginPage);
router.post('/login', authController.handleLogin);

// Protected routes (require admin session)
router.get('/logout', authController.logout);
router.get('/', requireAdminAuth, dashboardController.dashboard);
router.get('/users', requireAdminAuth, usersController.usersList);
router.get('/users/export', requireAdminAuth, usersController.exportUsers);
router.get('/instances', requireAdminAuth, instancesController.instancesList);
router.get('/sessions', requireAdminAuth, sessionsController.sessionsList);
router.get('/analytics', requireAdminAuth, analyticsController.analyticsPage);

export default router;
