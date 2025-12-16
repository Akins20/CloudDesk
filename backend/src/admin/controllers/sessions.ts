/**
 * Admin Sessions Controller
 * Session management with filters and analytics
 */

import { Request, Response } from 'express';
import { Session } from '../../models/Session';
import { logger } from '../../utils/logger';
import { renderPage, filterBar, pagination, emptyState } from '../templates';
import { getSessionAnalytics } from '../services/analytics';

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

// Format duration
const formatDuration = (ms: number): string => {
  if (!ms || ms <= 0) return '-';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

/**
 * Sessions list page with filters
 */
export const sessionsList = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || 'all';
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Build query
    const query: any = {};

    if (status !== 'all') {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59');
    }

    // Build sort
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Get session analytics
    const analytics = await getSessionAnalytics();

    // Execute queries
    let sessions = await Session.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email firstName lastName')
      .populate('instanceId', 'name host');

    // Filter by search (user email) - do this after populate
    if (search) {
      const searchLower = search.toLowerCase();
      sessions = sessions.filter(s => {
        const user = s.userId as any;
        const instance = s.instanceId as any;
        return (
          user?.email?.toLowerCase().includes(searchLower) ||
          instance?.name?.toLowerCase().includes(searchLower) ||
          instance?.host?.toLowerCase().includes(searchLower)
        );
      });
    }

    const total = search ? sessions.length : await Session.countDocuments(query);

    const totalPages = Math.ceil(total / limit);
    const baseUrl = buildUrl('/admin/sessions', { search, status, dateFrom, dateTo, sortBy, sortOrder });

    const content = `
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">Sessions</h1>
          <p class="text-muted-foreground mt-1">Monitor active connections and session history</p>
        </div>
        <div class="flex gap-4">
          <div class="text-center px-4 py-2 bg-status-success/10 rounded-lg">
            <p class="text-2xl font-bold text-status-success">${analytics.connected}</p>
            <p class="text-xs text-muted-foreground">Connected</p>
          </div>
          <div class="text-center px-4 py-2 bg-muted rounded-lg">
            <p class="text-2xl font-bold">${analytics.disconnected}</p>
            <p class="text-xs text-muted-foreground">Disconnected</p>
          </div>
          <div class="text-center px-4 py-2 bg-status-error/10 rounded-lg">
            <p class="text-2xl font-bold text-status-error">${analytics.errors}</p>
            <p class="text-xs text-muted-foreground">Errors</p>
          </div>
          <div class="text-center px-4 py-2 bg-status-info/10 rounded-lg">
            <p class="text-2xl font-bold text-status-info">${analytics.avgDuration}m</p>
            <p class="text-xs text-muted-foreground">Avg Duration</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      ${filterBar([
        { name: 'search', label: 'Search', type: 'text', value: search, placeholder: 'Search by user or instance...' },
        { name: 'status', label: 'Status', type: 'select', value: status, options: [
          { value: 'all', label: 'All Status' },
          { value: 'connected', label: 'Connected' },
          { value: 'connecting', label: 'Connecting' },
          { value: 'disconnected', label: 'Disconnected' },
          { value: 'error', label: 'Error' },
        ]},
        { name: 'dateFrom', label: 'From Date', type: 'date', value: dateFrom },
        { name: 'dateTo', label: 'To Date', type: 'date', value: dateTo },
        { name: 'sortBy', label: 'Sort By', type: 'select', value: sortBy, options: [
          { value: 'createdAt', label: 'Created Date' },
          { value: 'connectionStartedAt', label: 'Connection Start' },
          { value: 'status', label: 'Status' },
        ]},
        { name: 'sortOrder', label: 'Order', type: 'select', value: sortOrder, options: [
          { value: 'desc', label: 'Descending' },
          { value: 'asc', label: 'Ascending' },
        ]},
      ])}

      <!-- Quick status filters -->
      <div class="flex gap-2 mb-4">
        <a href="/admin/sessions" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${status === 'all' || !status ? 'bg-white text-black' : 'bg-muted text-muted-foreground hover:bg-border'}">
          All (${analytics.total})
        </a>
        <a href="/admin/sessions?status=connected" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${status === 'connected' ? 'bg-status-success text-black' : 'bg-muted text-muted-foreground hover:bg-border'}">
          Connected (${analytics.connected})
        </a>
        <a href="/admin/sessions?status=disconnected" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${status === 'disconnected' ? 'bg-white/50 text-black' : 'bg-muted text-muted-foreground hover:bg-border'}">
          Disconnected (${analytics.disconnected})
        </a>
        <a href="/admin/sessions?status=error" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors ${status === 'error' ? 'bg-status-error text-white' : 'bg-muted text-muted-foreground hover:bg-border'}">
          Errors (${analytics.errors})
        </a>
      </div>

      <!-- Results info -->
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-muted-foreground">
          Showing ${Math.min(skip + 1, total)}-${Math.min(skip + limit, total)} of ${total} sessions
        </p>
      </div>

      <!-- Sessions Table -->
      ${sessions.length > 0 ? `
      <div class="glass-card rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted">
              <tr>
                <th class="table-header">User</th>
                <th class="table-header">Instance</th>
                <th class="table-header">Status</th>
                <th class="table-header">VNC Port</th>
                <th class="table-header">Started</th>
                <th class="table-header">Duration</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              ${sessions.map(session => {
                const user = session.userId as any;
                const instance = session.instanceId as any;
                const statusColors: Record<string, string> = {
                  connected: 'status-success',
                  connecting: 'status-warning',
                  disconnected: 'muted-foreground',
                  error: 'status-error',
                  recoverable: 'status-info',
                };
                const statusColor = statusColors[session.status] || 'muted-foreground';

                let duration = '-';
                if (session.connectionStartedAt) {
                  const start = new Date(session.connectionStartedAt).getTime();
                  const end = session.connectionEndedAt ? new Date(session.connectionEndedAt).getTime() : Date.now();
                  duration = formatDuration(end - start);
                }

                return `
                <tr class="hover:bg-muted/50 transition-colors">
                  <td class="table-cell">
                    <div>
                      <p class="font-medium">${user?.firstName || ''} ${user?.lastName || ''}</p>
                      <p class="text-xs text-muted-foreground">${user?.email || 'Unknown'}</p>
                    </div>
                  </td>
                  <td class="table-cell">
                    <div>
                      <p class="text-sm">${instance?.name || 'Unknown'}</p>
                      <code class="text-xs text-muted-foreground">${instance?.host || '-'}</code>
                    </div>
                  </td>
                  <td class="table-cell">
                    <div>
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-${statusColor}/10 text-${statusColor}">
                        <span class="w-1.5 h-1.5 rounded-full bg-${statusColor} ${session.status === 'connected' ? 'animate-pulse' : ''}"></span>
                        ${session.status}
                      </span>
                      ${session.errorMessage ? `
                        <p class="text-xs text-status-error mt-1 max-w-[200px] truncate" title="${session.errorMessage}">${session.errorMessage}</p>
                      ` : ''}
                    </div>
                  </td>
                  <td class="table-cell">
                    <code class="text-sm text-muted-foreground">${session.vncPort || '-'}</code>
                  </td>
                  <td class="table-cell text-muted-foreground text-sm">
                    ${session.connectionStartedAt ? new Date(session.connectionStartedAt).toLocaleString() : '-'}
                  </td>
                  <td class="table-cell font-medium">
                    ${session.status === 'connected' ? `<span class="text-status-success">${duration}</span>` : duration}
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : emptyState('No sessions found matching your criteria', 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122')}

      ${pagination(page, totalPages, baseUrl)}
    `;

    res.send(renderPage('Sessions', content, { isLoggedIn: true, currentPath: '/admin/sessions' }));
  } catch (error) {
    logger.error('Sessions list error:', error);
    res.status(500).send(renderPage('Error', '<div class="text-status-error text-center py-12">Failed to load sessions</div>', { isLoggedIn: true }));
  }
};

export default {
  sessionsList,
};
