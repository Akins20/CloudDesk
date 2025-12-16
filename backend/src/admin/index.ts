/**
 * Admin Module
 * Dashboard for managing users, instances, sessions, and analytics
 */

export { default as adminRoutes } from './routes';
export { requireAdminAuth } from './middleware';
