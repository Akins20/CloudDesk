/**
 * Admin Dashboard Controller
 * Main dashboard with analytics and server metrics
 */

import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { renderPage, statCard } from '../templates';
import { getDashboardStats, formatBytes, getUserAnalytics, getSessionAnalytics } from '../services/analytics';

/**
 * Render dashboard page
 */
export const dashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [stats, userAnalytics, sessionAnalytics] = await Promise.all([
      getDashboardStats(),
      getUserAnalytics(),
      getSessionAnalytics(),
    ]);

    // Prepare chart data
    const registrationChartData = JSON.stringify(userAnalytics.registrationsByDay.slice(-14));
    const sessionChartData = JSON.stringify(sessionAnalytics.sessionsByDay.slice(-14));
    const sessionByHourData = JSON.stringify(sessionAnalytics.sessionsByHour);

    const content = `
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold">Dashboard</h1>
          <p class="text-muted-foreground mt-1">Welcome back. Here's what's happening.</p>
        </div>
        <div class="text-sm text-muted-foreground">
          Last updated: ${new Date().toLocaleString()}
        </div>
      </div>

      <!-- Main Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        ${statCard('Total Users', stats.users.total, 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', { value: stats.users.trend, label: 'vs yesterday' })}
        ${statCard('Active Sessions', stats.sessions.active, 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122', undefined, 'status-success')}
        ${statCard('Total Instances', stats.instances.total, 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01')}
        ${statCard('Error Rate', stats.sessions.errorRate + '%', 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', undefined, stats.sessions.errorRate > 5 ? 'status-error' : 'status-success')}
      </div>

      <!-- Server Metrics -->
      <div class="glass-card rounded-xl p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-status-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
          </svg>
          Server Performance
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- CPU -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">CPU Usage</span>
              <span class="text-sm font-medium">${stats.server.cpu.usage}%</span>
            </div>
            <div class="w-full bg-border rounded-full h-2">
              <div class="bg-status-info h-2 rounded-full transition-all" style="width: ${Math.min(stats.server.cpu.usage, 100)}%"></div>
            </div>
            <p class="text-xs text-muted-foreground mt-2">${stats.server.cpu.cores} cores</p>
          </div>

          <!-- Memory -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">Memory Usage</span>
              <span class="text-sm font-medium">${stats.server.memory.usagePercent}%</span>
            </div>
            <div class="w-full bg-border rounded-full h-2">
              <div class="bg-status-warning h-2 rounded-full transition-all" style="width: ${Math.min(stats.server.memory.usagePercent, 100)}%"></div>
            </div>
            <p class="text-xs text-muted-foreground mt-2">${formatBytes(stats.server.memory.used)} / ${formatBytes(stats.server.memory.total)}</p>
          </div>

          <!-- Uptime -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">System Uptime</span>
              <span class="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
            </div>
            <p class="text-2xl font-bold">${stats.server.uptime.formatted}</p>
            <p class="text-xs text-muted-foreground mt-2">Node ${stats.server.nodeVersion}</p>
          </div>

          <!-- Load Average -->
          <div class="bg-muted rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">Load Average</span>
            </div>
            <p class="text-2xl font-bold">${stats.server.load[0].toFixed(2)}</p>
            <p class="text-xs text-muted-foreground mt-2">1m: ${stats.server.load[0].toFixed(2)} | 5m: ${stats.server.load[1].toFixed(2)} | 15m: ${stats.server.load[2].toFixed(2)}</p>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- User Registrations Chart -->
        <div class="glass-card rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4">User Registrations (14 days)</h2>
          <div class="h-48">
            <canvas id="registrationChart"></canvas>
          </div>
          <div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div class="text-center">
              <p class="text-2xl font-bold">${userAnalytics.newToday}</p>
              <p class="text-xs text-muted-foreground">Today</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold">${userAnalytics.newThisWeek}</p>
              <p class="text-xs text-muted-foreground">This Week</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold">${userAnalytics.newThisMonth}</p>
              <p class="text-xs text-muted-foreground">This Month</p>
            </div>
          </div>
        </div>

        <!-- Sessions Chart -->
        <div class="glass-card rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4">Session Activity (14 days)</h2>
          <div class="h-48">
            <canvas id="sessionChart"></canvas>
          </div>
          <div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div class="text-center">
              <p class="text-2xl font-bold text-status-success">${sessionAnalytics.connected}</p>
              <p class="text-xs text-muted-foreground">Connected</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold">${sessionAnalytics.todaySessions}</p>
              <p class="text-xs text-muted-foreground">Today</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold">${sessionAnalytics.avgDuration}m</p>
              <p class="text-xs text-muted-foreground">Avg Duration</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity by Hour & Top Users -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Activity by Hour -->
        <div class="glass-card rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4">Peak Hours (7 days)</h2>
          <div class="h-48">
            <canvas id="hourlyChart"></canvas>
          </div>
          <p class="text-sm text-muted-foreground mt-4 text-center">
            Peak activity at <span class="text-white font-medium">${sessionAnalytics.peakHour}:00</span>
          </p>
        </div>

        <!-- Top Users -->
        <div class="glass-card rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4">Most Active Users</h2>
          <div class="space-y-3">
            ${userAnalytics.topUsersBySessions.slice(0, 5).map((item, index) => `
              <div class="flex items-center justify-between py-2 ${index < 4 ? 'border-b border-border' : ''}">
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">${index + 1}</span>
                  <div>
                    <p class="font-medium">${item.user?.firstName || ''} ${item.user?.lastName || ''}</p>
                    <p class="text-xs text-muted-foreground">${item.user?.email || 'Unknown'}</p>
                  </div>
                </div>
                <span class="text-sm font-medium">${item.sessionCount} sessions</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/admin/users" class="glass-card rounded-xl p-6 hover:bg-white/5 transition-colors group">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold group-hover:text-white transition-colors">Manage Users</h3>
              <p class="text-sm text-muted-foreground mt-1">${stats.users.total} total users</p>
            </div>
            <svg class="w-6 h-6 text-muted-foreground group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </a>

        <a href="/admin/instances" class="glass-card rounded-xl p-6 hover:bg-white/5 transition-colors group">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold group-hover:text-white transition-colors">View Instances</h3>
              <p class="text-sm text-muted-foreground mt-1">${stats.instances.total} total instances</p>
            </div>
            <svg class="w-6 h-6 text-muted-foreground group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </a>

        <a href="/admin/sessions" class="glass-card rounded-xl p-6 hover:bg-white/5 transition-colors group">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold group-hover:text-white transition-colors">Monitor Sessions</h3>
              <p class="text-sm text-muted-foreground mt-1">${stats.sessions.active} active now</p>
            </div>
            <svg class="w-6 h-6 text-muted-foreground group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </a>
      </div>
    `;

    const scripts = `
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script>
        // Chart.js configuration
        Chart.defaults.color = '#a3a3a3';
        Chart.defaults.borderColor = '#333333';

        // Registration Chart
        const regData = ${registrationChartData};
        new Chart(document.getElementById('registrationChart'), {
          type: 'line',
          data: {
            labels: regData.map(d => d.date.slice(5)),
            datasets: [{
              label: 'Registrations',
              data: regData.map(d => d.count),
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
              x: { grid: { display: false } }
            }
          }
        });

        // Session Chart
        const sessData = ${sessionChartData};
        new Chart(document.getElementById('sessionChart'), {
          type: 'bar',
          data: {
            labels: sessData.map(d => d.date.slice(5)),
            datasets: [{
              label: 'Sessions',
              data: sessData.map(d => d.count),
              backgroundColor: '#10b981',
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

        // Hourly Chart
        const hourData = ${sessionByHourData};
        const hours = Array.from({length: 24}, (_, i) => i);
        const hourCounts = hours.map(h => {
          const found = hourData.find(d => d.hour === h);
          return found ? found.count : 0;
        });
        new Chart(document.getElementById('hourlyChart'), {
          type: 'bar',
          data: {
            labels: hours.map(h => h + ':00'),
            datasets: [{
              label: 'Sessions',
              data: hourCounts,
              backgroundColor: '#3b82f6',
              borderRadius: 2,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: '#333333' } },
              x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } }
            }
          }
        });
      </script>
    `;

    res.send(renderPage('Dashboard', content, { isLoggedIn: true, currentPath: '/admin', scripts }));
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).send(renderPage('Error', '<div class="text-status-error text-center py-12">Failed to load dashboard</div>', { isLoggedIn: true }));
  }
};

export default { dashboard };
