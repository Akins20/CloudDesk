/**
 * Admin Instances Controller
 * Instance management with filters and analytics
 */

import { Request, Response } from 'express';
import { Instance } from '../../models/Instance';
import { Session } from '../../models/Session';
import { logger } from '../../utils/logger';
import { renderPage, filterBar, pagination, emptyState } from '../templates';

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
 * Instances list page with filters
 */
export const instancesList = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const provider = (req.query.provider as string) || 'all';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { host: { $regex: search, $options: 'i' } },
      ];
    }

    if (provider !== 'all') {
      query.provider = provider;
    }

    // Build sort
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Get unique providers for filter
    const providers = await Instance.distinct('provider');

    // Execute queries
    const [instances, total] = await Promise.all([
      Instance.find(query).sort(sort).skip(skip).limit(limit).populate('userId', 'email firstName lastName'),
      Instance.countDocuments(query),
    ]);

    // Get session counts for each instance
    const instanceIds = instances.map(i => i._id);
    const [sessionCounts, activeSessionCounts] = await Promise.all([
      Session.aggregate([
        { $match: { instanceId: { $in: instanceIds } } },
        { $group: { _id: '$instanceId', count: { $sum: 1 } } },
      ]),
      Session.aggregate([
        { $match: { instanceId: { $in: instanceIds }, status: { $in: ['connected', 'connecting'] } } },
        { $group: { _id: '$instanceId', count: { $sum: 1 } } },
      ]),
    ]);

    const sessionCountMap = new Map(sessionCounts.map(s => [s._id.toString(), s.count]));
    const activeSessionCountMap = new Map(activeSessionCounts.map(s => [s._id.toString(), s.count]));

    // Provider stats
    const providerStats = await Instance.aggregate([
      { $group: { _id: '$provider', count: { $sum: 1 } } },
    ]);

    const totalPages = Math.ceil(total / limit);
    const baseUrl = buildUrl('/admin/instances', { search, provider, sortBy, sortOrder });

    const content = `
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">Instances</h1>
          <p class="text-muted-foreground mt-1">Monitor cloud instances and connections</p>
        </div>
        <div class="flex gap-4">
          ${providerStats.map(p => `
            <div class="text-center px-4 py-2 bg-muted rounded-lg">
              <p class="text-2xl font-bold">${p.count}</p>
              <p class="text-xs text-muted-foreground">${p._id}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Filters -->
      ${filterBar([
        { name: 'search', label: 'Search', type: 'text', value: search, placeholder: 'Search by name or host...' },
        { name: 'provider', label: 'Provider', type: 'select', value: provider, options: [
          { value: 'all', label: 'All Providers' },
          ...providers.map(p => ({ value: p, label: p.toUpperCase() })),
        ]},
        { name: 'sortBy', label: 'Sort By', type: 'select', value: sortBy, options: [
          { value: 'createdAt', label: 'Created Date' },
          { value: 'name', label: 'Name' },
          { value: 'host', label: 'Host' },
        ]},
        { name: 'sortOrder', label: 'Order', type: 'select', value: sortOrder, options: [
          { value: 'desc', label: 'Descending' },
          { value: 'asc', label: 'Ascending' },
        ]},
      ])}

      <!-- Results info -->
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-muted-foreground">
          Showing ${skip + 1}-${Math.min(skip + limit, total)} of ${total} instances
        </p>
      </div>

      <!-- Instances Table -->
      ${instances.length > 0 ? `
      <div class="glass-card rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted">
              <tr>
                <th class="table-header">Instance</th>
                <th class="table-header">Owner</th>
                <th class="table-header">Connection</th>
                <th class="table-header">Provider</th>
                <th class="table-header">Total Sessions</th>
                <th class="table-header">Active</th>
                <th class="table-header">Created</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              ${instances.map(instance => {
                const owner = instance.userId as any;
                const sessionCount = sessionCountMap.get(instance._id.toString()) || 0;
                const activeCount = activeSessionCountMap.get(instance._id.toString()) || 0;
                return `
                <tr class="hover:bg-muted/50 transition-colors">
                  <td class="table-cell">
                    <div>
                      <p class="font-medium">${instance.name}</p>
                      <p class="text-xs text-muted-foreground font-mono">${instance._id}</p>
                    </div>
                  </td>
                  <td class="table-cell">
                    <div>
                      <p class="text-sm">${owner?.firstName || ''} ${owner?.lastName || ''}</p>
                      <p class="text-xs text-muted-foreground">${owner?.email || 'Unknown'}</p>
                    </div>
                  </td>
                  <td class="table-cell">
                    <code class="text-xs bg-muted px-2 py-1 rounded">${instance.host}:${instance.port}</code>
                  </td>
                  <td class="table-cell">
                    <span class="px-2 py-1 text-xs rounded-full bg-status-info/10 text-status-info font-medium">
                      ${instance.provider.toUpperCase()}
                    </span>
                  </td>
                  <td class="table-cell font-medium">${sessionCount}</td>
                  <td class="table-cell">
                    ${activeCount > 0 ? `
                      <span class="flex items-center gap-1.5 text-status-success">
                        <span class="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
                        ${activeCount}
                      </span>
                    ` : '<span class="text-muted-foreground">0</span>'}
                  </td>
                  <td class="table-cell text-muted-foreground">
                    ${new Date(instance.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : emptyState('No instances found matching your criteria', 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01')}

      ${pagination(page, totalPages, baseUrl)}
    `;

    res.send(renderPage('Instances', content, { isLoggedIn: true, currentPath: '/admin/instances' }));
  } catch (error) {
    logger.error('Instances list error:', error);
    res.status(500).send(renderPage('Error', '<div class="text-status-error text-center py-12">Failed to load instances</div>', { isLoggedIn: true }));
  }
};

export default {
  instancesList,
};
