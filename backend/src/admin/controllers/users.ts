/**
 * Admin Users Controller
 * User management with advanced filters and analytics
 */

import { Request, Response } from 'express';
import { User } from '../../models/User';
import { Instance } from '../../models/Instance';
import { Session } from '../../models/Session';
import { logger } from '../../utils/logger';
import { renderPage, filterBar, pagination, statusBadge, emptyState } from '../templates';

// Build URL with query params
const buildUrl = (baseUrl: string, params: Record<string, string | undefined>): string => {
  const queryParts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== 'all' && value !== '') {
      queryParts.push(`${key}=${encodeURIComponent(value)}`);
    }
  }
  return queryParts.length > 0 ? `${baseUrl}?${queryParts.join('&')}&` : `${baseUrl}?`;
};

/**
 * Users list page with filters
 */
export const usersList = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const role = (req.query.role as string) || 'all';
    const status = (req.query.status as string) || 'all';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    if (role !== 'all') {
      query.role = role;
    }

    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59');
    }

    // Build sort
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute queries
    const [users, total, totalUsers, activeUsers, adminUsers] = await Promise.all([
      User.find(query).sort(sort).skip(skip).limit(limit),
      User.countDocuments(query),
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
    ]);

    // Get user stats (instances and sessions count)
    const userIds = users.map(u => u._id);
    const [instanceCounts, sessionCounts] = await Promise.all([
      Instance.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
      Session.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]),
    ]);

    const instanceCountMap = new Map(instanceCounts.map(i => [i._id.toString(), i.count]));
    const sessionCountMap = new Map(sessionCounts.map(s => [s._id.toString(), s.count]));

    const totalPages = Math.ceil(total / limit);
    const baseUrl = buildUrl('/admin/users', { search, role, status, sortBy, sortOrder, dateFrom, dateTo });

    const content = `
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">Users</h1>
          <p class="text-muted-foreground mt-1">Manage and monitor user accounts</p>
        </div>
        <div class="flex gap-4">
          <div class="text-center px-4 py-2 bg-muted rounded-lg">
            <p class="text-2xl font-bold">${totalUsers}</p>
            <p class="text-xs text-muted-foreground">Total</p>
          </div>
          <div class="text-center px-4 py-2 bg-status-success/10 rounded-lg">
            <p class="text-2xl font-bold text-status-success">${activeUsers}</p>
            <p class="text-xs text-muted-foreground">Active</p>
          </div>
          <div class="text-center px-4 py-2 bg-status-warning/10 rounded-lg">
            <p class="text-2xl font-bold text-status-warning">${adminUsers}</p>
            <p class="text-xs text-muted-foreground">Admins</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      ${filterBar([
        { name: 'search', label: 'Search', type: 'text', value: search, placeholder: 'Search by name or email...' },
        { name: 'role', label: 'Role', type: 'select', value: role, options: [
          { value: 'all', label: 'All Roles' },
          { value: 'user', label: 'User' },
          { value: 'admin', label: 'Admin' },
        ]},
        { name: 'status', label: 'Status', type: 'select', value: status, options: [
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]},
        { name: 'dateFrom', label: 'From Date', type: 'date', value: dateFrom },
        { name: 'dateTo', label: 'To Date', type: 'date', value: dateTo },
        { name: 'sortBy', label: 'Sort By', type: 'select', value: sortBy, options: [
          { value: 'createdAt', label: 'Created Date' },
          { value: 'lastLoginAt', label: 'Last Login' },
          { value: 'email', label: 'Email' },
          { value: 'firstName', label: 'First Name' },
        ]},
        { name: 'sortOrder', label: 'Order', type: 'select', value: sortOrder, options: [
          { value: 'desc', label: 'Descending' },
          { value: 'asc', label: 'Ascending' },
        ]},
      ])}

      <!-- Results info -->
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-muted-foreground">
          Showing ${skip + 1}-${Math.min(skip + limit, total)} of ${total} users
        </p>
        <a href="/admin/users/export?${baseUrl.split('?')[1] || ''}" class="btn btn-secondary text-sm">
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Export CSV
        </a>
      </div>

      <!-- Users Table -->
      ${users.length > 0 ? `
      <div class="glass-card rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted">
              <tr>
                <th class="table-header">User</th>
                <th class="table-header">Role</th>
                <th class="table-header">Status</th>
                <th class="table-header">Instances</th>
                <th class="table-header">Sessions</th>
                <th class="table-header">Last Login</th>
                <th class="table-header">Created</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              ${users.map(user => {
                const instanceCount = instanceCountMap.get(user._id.toString()) || 0;
                const sessionCount = sessionCountMap.get(user._id.toString()) || 0;
                return `
                <tr class="hover:bg-muted/50 transition-colors">
                  <td class="table-cell">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        ${(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                      </div>
                      <div>
                        <p class="font-medium">${user.firstName} ${user.lastName}</p>
                        <p class="text-xs text-muted-foreground">${user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td class="table-cell">${statusBadge(user.role)}</td>
                  <td class="table-cell">${statusBadge(user.isActive ? 'active' : 'inactive')}</td>
                  <td class="table-cell font-medium">${instanceCount}</td>
                  <td class="table-cell font-medium">${sessionCount}</td>
                  <td class="table-cell text-muted-foreground">
                    ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td class="table-cell text-muted-foreground">
                    ${new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : emptyState('No users found matching your criteria')}

      ${pagination(page, totalPages, baseUrl)}
    `;

    res.send(renderPage('Users', content, { isLoggedIn: true, currentPath: '/admin/users' }));
  } catch (error) {
    logger.error('Users list error:', error);
    res.status(500).send(renderPage('Error', '<div class="text-status-error text-center py-12">Failed to load users</div>', { isLoggedIn: true }));
  }
};

/**
 * Export users as CSV
 */
export const exportUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = (req.query.search as string) || '';
    const role = (req.query.role as string) || 'all';
    const status = (req.query.status as string) || 'all';
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    if (role !== 'all') query.role = role;
    if (status !== 'all') query.isActive = status === 'active';

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59');
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    // Generate CSV
    const headers = ['Email', 'First Name', 'Last Name', 'Role', 'Status', 'Last Login', 'Created'];
    const rows = users.map(user => [
      user.email,
      user.firstName,
      user.lastName,
      user.role,
      user.isActive ? 'Active' : 'Inactive',
      user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : '',
      new Date(user.createdAt).toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    logger.error('Export users error:', error);
    res.status(500).send('Export failed');
  }
};

export default {
  usersList,
  exportUsers,
};
