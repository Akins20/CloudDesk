/**
 * Admin Analytics Controller
 * Detailed analytics and reporting page
 */

import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { renderPage } from '../templates';
import {
  getServerMetrics,
  formatBytes,
  getUserAnalytics,
  getSessionAnalytics,
  getInstanceAnalytics,
} from '../services/analytics';

/**
 * Analytics page
 */
export const analyticsPage = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [server, users, sessions, instances] = await Promise.all([
      getServerMetrics(),
      getUserAnalytics(),
      getSessionAnalytics(),
      getInstanceAnalytics(),
    ]);

    const usersByDayData = JSON.stringify(users.registrationsByDay);
    const usersByMonthData = JSON.stringify(users.registrationsByMonth);
    const sessionsByDayData = JSON.stringify(sessions.sessionsByDay);
    const sessionsByStatusData = JSON.stringify(sessions.sessionsByStatus);
    const instancesByProviderData = JSON.stringify(instances.byProvider);

    const content = `
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold">Analytics</h1>
          <p class="text-muted-foreground mt-1">Detailed metrics and performance data</p>
        </div>
        <div class="text-sm text-muted-foreground">
          Last updated: ${new Date().toLocaleString()}
        </div>
      </div>

      <!-- Server Health -->
      <div class="glass-card rounded-xl p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
          </svg>
          Server Health
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-muted rounded-lg p-4">
            <p class="text-sm text-muted-foreground mb-2">CPU Usage</p>
            <div class="flex items-end gap-2">
              <span class="text-3xl font-bold">${server.cpu.usage}</span>
              <span class="text-muted-foreground mb-1">%</span>
            </div>
            <div class="w-full bg-border rounded-full h-2 mt-2">
              <div class="bg-status-info h-2 rounded-full" style="width: ${Math.min(server.cpu.usage, 100)}%"></div>
            </div>
            <p class="text-xs text-muted-foreground mt-2">${server.cpu.cores} cores - ${server.cpu.model.split(' ').slice(0, 3).join(' ')}</p>
          </div>

          <div class="bg-muted rounded-lg p-4">
            <p class="text-sm text-muted-foreground mb-2">Memory Usage</p>
            <div class="flex items-end gap-2">
              <span class="text-3xl font-bold">${server.memory.usagePercent}</span>
              <span class="text-muted-foreground mb-1">%</span>
            </div>
            <div class="w-full bg-border rounded-full h-2 mt-2">
              <div class="bg-status-warning h-2 rounded-full" style="width: ${Math.min(server.memory.usagePercent, 100)}%"></div>
            </div>
            <p class="text-xs text-muted-foreground mt-2">${formatBytes(server.memory.used)} / ${formatBytes(server.memory.total)}</p>
          </div>

          <div class="bg-muted rounded-lg p-4">
            <p class="text-sm text-muted-foreground mb-2">System Uptime</p>
            <p class="text-3xl font-bold">${server.uptime.formatted}</p>
            <p class="text-xs text-muted-foreground mt-2">${server.platform}</p>
          </div>

          <div class="bg-muted rounded-lg p-4">
            <p class="text-sm text-muted-foreground mb-2">Load Average</p>
            <p class="text-3xl font-bold">${server.load[0].toFixed(2)}</p>
            <p class="text-xs text-muted-foreground mt-2">
              1m: ${server.load[0].toFixed(2)} | 5m: ${server.load[1].toFixed(2)} | 15m: ${server.load[2].toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <!-- User Analytics -->
      <div class="glass-card rounded-xl p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">User Analytics</h2>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Stats -->
          <div class="space-y-4">
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">Total Users</span>
              <span class="text-2xl font-bold">${users.total}</span>
            </div>
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">Active Users</span>
              <span class="text-2xl font-bold text-status-success">${users.active}</span>
            </div>
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">Admins</span>
              <span class="text-2xl font-bold text-status-warning">${users.admins}</span>
            </div>
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">New Today</span>
              <span class="text-2xl font-bold text-status-info">${users.newToday}</span>
            </div>
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">New This Week</span>
              <span class="text-2xl font-bold">${users.newThisWeek}</span>
            </div>
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">New This Month</span>
              <span class="text-2xl font-bold">${users.newThisMonth}</span>
            </div>
          </div>

          <!-- Daily Chart -->
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-3">Daily Registrations (30 days)</h3>
            <div class="h-64">
              <canvas id="usersDailyChart"></canvas>
            </div>
          </div>

          <!-- Monthly Chart -->
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-3">Monthly Registrations (12 months)</h3>
            <div class="h-64">
              <canvas id="usersMonthlyChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Session Analytics -->
      <div class="glass-card rounded-xl p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">Session Analytics</h2>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Stats -->
          <div class="space-y-4">
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">Total Sessions</span>
              <span class="text-2xl font-bold">${sessions.total}</span>
            </div>
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">Active Now</span>
              <span class="text-2xl font-bold text-status-success">${sessions.active}</span>
            </div>
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">Today's Sessions</span>
              <span class="text-2xl font-bold text-status-info">${sessions.todaySessions}</span>
            </div>
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">Avg Duration</span>
              <span class="text-2xl font-bold">${sessions.avgDuration}m</span>
            </div>
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">Error Rate</span>
              <span class="text-2xl font-bold ${sessions.errorRate > 5 ? 'text-status-error' : 'text-status-success'}">${sessions.errorRate}%</span>
            </div>
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">Peak Hour</span>
              <span class="text-2xl font-bold">${sessions.peakHour}:00</span>
            </div>
          </div>

          <!-- Daily Chart -->
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-3">Daily Sessions (30 days)</h3>
            <div class="h-64">
              <canvas id="sessionsDailyChart"></canvas>
            </div>
          </div>

          <!-- Status Distribution -->
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-3">Status Distribution</h3>
            <div class="h-64">
              <canvas id="sessionsStatusChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Instance Analytics -->
      <div class="glass-card rounded-xl p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">Instance Analytics</h2>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Stats -->
          <div class="space-y-4">
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">Total Instances</span>
              <span class="text-2xl font-bold">${instances.total}</span>
            </div>
            <div class="bg-muted rounded-lg p-4 flex justify-between items-center">
              <span class="text-muted-foreground">Avg per User</span>
              <span class="text-2xl font-bold">${instances.avgPerUser}</span>
            </div>
          </div>

          <!-- Provider Chart -->
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-3">By Provider</h3>
            <div class="h-64">
              <canvas id="instancesProviderChart"></canvas>
            </div>
          </div>

          <!-- Most Used -->
          <div>
            <h3 class="text-sm font-medium text-muted-foreground mb-3">Most Used Instances</h3>
            <div class="space-y-2">
              ${instances.mostUsedInstances.slice(0, 5).map((item, index) => `
                <div class="bg-muted rounded-lg p-3 flex justify-between items-center">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded bg-border flex items-center justify-center text-xs">${index + 1}</span>
                    <div>
                      <p class="text-sm font-medium">${item.instance?.name || 'Unknown'}</p>
                      <p class="text-xs text-muted-foreground">${item.instance?.host || ''}</p>
                    </div>
                  </div>
                  <span class="text-sm font-medium">${item.sessionCount} sessions</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Top Users -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="glass-card rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4">Top Users by Instances</h2>
          <div class="space-y-3">
            ${users.topUsersByInstances.map((item, index) => `
              <div class="flex items-center justify-between py-2 ${index < users.topUsersByInstances.length - 1 ? 'border-b border-border' : ''}">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">${index + 1}</span>
                  <div>
                    <p class="font-medium">${item.user?.firstName || ''} ${item.user?.lastName || ''}</p>
                    <p class="text-xs text-muted-foreground">${item.user?.email || 'Unknown'}</p>
                  </div>
                </div>
                <span class="font-medium">${item.instanceCount} instances</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="glass-card rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4">Top Users by Sessions</h2>
          <div class="space-y-3">
            ${users.topUsersBySessions.map((item, index) => `
              <div class="flex items-center justify-between py-2 ${index < users.topUsersBySessions.length - 1 ? 'border-b border-border' : ''}">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">${index + 1}</span>
                  <div>
                    <p class="font-medium">${item.user?.firstName || ''} ${item.user?.lastName || ''}</p>
                    <p class="text-xs text-muted-foreground">${item.user?.email || 'Unknown'}</p>
                  </div>
                </div>
                <span class="font-medium">${item.sessionCount} sessions</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const scripts = `
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script>
        Chart.defaults.color = '#a3a3a3';
        Chart.defaults.borderColor = '#333333';

        // Users Daily Chart
        const usersDailyData = ${usersByDayData};
        new Chart(document.getElementById('usersDailyChart'), {
          type: 'line',
          data: {
            labels: usersDailyData.map(d => d.date.slice(5)),
            datasets: [{
              label: 'Registrations',
              data: usersDailyData.map(d => d.count),
              borderColor: '#ffffff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              fill: true,
              tension: 0.4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: '#333333' } },
              x: { grid: { display: false }, ticks: { maxRotation: 45 } }
            }
          }
        });

        // Users Monthly Chart
        const usersMonthlyData = ${usersByMonthData};
        new Chart(document.getElementById('usersMonthlyChart'), {
          type: 'bar',
          data: {
            labels: usersMonthlyData.map(d => d.month),
            datasets: [{
              label: 'Registrations',
              data: usersMonthlyData.map(d => d.count),
              backgroundColor: '#3b82f6',
              borderRadius: 4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: '#333333' } },
              x: { grid: { display: false } }
            }
          }
        });

        // Sessions Daily Chart
        const sessionsDailyData = ${sessionsByDayData};
        new Chart(document.getElementById('sessionsDailyChart'), {
          type: 'line',
          data: {
            labels: sessionsDailyData.map(d => d.date.slice(5)),
            datasets: [{
              label: 'Sessions',
              data: sessionsDailyData.map(d => d.count),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: '#333333' } },
              x: { grid: { display: false }, ticks: { maxRotation: 45 } }
            }
          }
        });

        // Sessions Status Chart
        const sessionsStatusData = ${sessionsByStatusData};
        const statusColors = {
          connected: '#10b981',
          connecting: '#f59e0b',
          disconnected: '#a3a3a3',
          error: '#ef4444',
        };
        new Chart(document.getElementById('sessionsStatusChart'), {
          type: 'doughnut',
          data: {
            labels: sessionsStatusData.map(d => d.status),
            datasets: [{
              data: sessionsStatusData.map(d => d.count),
              backgroundColor: sessionsStatusData.map(d => statusColors[d.status] || '#666'),
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });

        // Instances Provider Chart
        const instancesProviderData = ${instancesByProviderData};
        new Chart(document.getElementById('instancesProviderChart'), {
          type: 'pie',
          data: {
            labels: instancesProviderData.map(d => d.provider.toUpperCase()),
            datasets: [{
              data: instancesProviderData.map(d => d.count),
              backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'],
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      </script>
    `;

    res.send(renderPage('Analytics', content, { isLoggedIn: true, currentPath: '/admin/analytics', scripts }));
  } catch (error) {
    logger.error('Analytics page error:', error);
    res.status(500).send(renderPage('Error', '<div class="text-status-error text-center py-12">Failed to load analytics</div>', { isLoggedIn: true }));
  }
};

export default { analyticsPage };
