/**
 * Admin Dashboard HTML Templates
 * Shared layouts, components, and styling
 */

// Tailwind config for consistent theming
const tailwindConfig = `
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          background: '#000000',
          foreground: '#ffffff',
          muted: '#1c1c1c',
          'muted-foreground': '#a3a3a3',
          card: '#0a0a0a',
          border: '#333333',
          'status-success': '#10b981',
          'status-error': '#ef4444',
          'status-warning': '#f59e0b',
          'status-info': '#3b82f6',
        }
      }
    }
  }
`;

// Shared styles
const sharedStyles = `
  body { background: #000; color: #fff; font-family: system-ui, -apple-system, sans-serif; }
  .glass { background: rgba(10,10,10,0.8); backdrop-filter: blur(12px); }
  .glass-card { background: rgba(10,10,10,0.8); backdrop-filter: blur(12px); border: 1px solid rgba(51,51,51,0.5); }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: #1c1c1c; border-radius: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(163,163,163,0.5); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(163,163,163,0.7); }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .btn { @apply px-4 py-2 rounded-lg font-medium transition-all duration-200; }
  .btn-primary { @apply bg-white text-black hover:bg-gray-200; }
  .btn-secondary { @apply bg-muted text-muted-foreground hover:bg-border; }
  .input { @apply w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all; }
  .select { @apply px-4 py-2.5 bg-muted border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer; }
  .table-header { @apply px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider; }
  .table-cell { @apply px-6 py-4 text-sm; }
`;

// Navigation component
const navigation = (currentPath: string) => `
  <nav class="glass border-b border-border sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center space-x-8">
          <a href="/admin" class="text-xl font-bold text-white flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            CloudDesk
          </a>
          <div class="hidden md:flex space-x-1">
            ${navLink('/admin', 'Dashboard', currentPath, 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6')}
            ${navLink('/admin/users', 'Users', currentPath, 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z')}
            ${navLink('/admin/instances', 'Instances', currentPath, 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01')}
            ${navLink('/admin/sessions', 'Sessions', currentPath, 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122')}
            ${navLink('/admin/analytics', 'Analytics', currentPath, 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z')}
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span class="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
            System Online
          </div>
          <a href="/admin/logout" class="flex items-center gap-2 text-status-error hover:bg-status-error/10 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Logout
          </a>
        </div>
      </div>
    </div>
  </nav>
`;

// Navigation link helper
const navLink = (href: string, label: string, currentPath: string, iconPath: string) => {
  const isActive = currentPath === href || (href !== '/admin' && currentPath.startsWith(href));
  return `
    <a href="${href}" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
      </svg>
      ${label}
    </a>
  `;
};

/**
 * Render a full page with layout
 */
export const renderPage = (
  title: string,
  content: string,
  options: { isLoggedIn?: boolean; currentPath?: string; scripts?: string } = {}
): string => {
  const { isLoggedIn = false, currentPath = '/admin', scripts = '' } = options;

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - CloudDesk Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>${tailwindConfig}</script>
  <style>${sharedStyles}</style>
</head>
<body class="min-h-screen bg-background text-foreground">
  ${isLoggedIn ? navigation(currentPath) : ''}

  <main class="${isLoggedIn ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : ''}">
    ${content}
  </main>

  ${isLoggedIn ? `
  <footer class="border-t border-border mt-auto py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p class="text-center text-muted-foreground text-sm">CloudDesk Admin Dashboard &copy; ${new Date().getFullYear()}</p>
    </div>
  </footer>
  ` : ''}

  ${scripts}
</body>
</html>`;
};

/**
 * Stat card component
 */
export const statCard = (
  label: string,
  value: string | number,
  icon: string,
  trend?: { value: number; label: string },
  color: string = 'white'
): string => `
  <div class="glass-card rounded-xl p-6">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-muted-foreground text-sm mb-1">${label}</p>
        <p class="text-3xl font-bold text-${color}">${value}</p>
        ${trend ? `
          <p class="text-xs mt-2 ${trend.value >= 0 ? 'text-status-success' : 'text-status-error'}">
            ${trend.value >= 0 ? '+' : ''}${trend.value}% ${trend.label}
          </p>
        ` : ''}
      </div>
      <div class="p-3 bg-${color}/10 rounded-lg">
        <svg class="w-6 h-6 text-${color}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icon}"></path>
        </svg>
      </div>
    </div>
  </div>
`;

/**
 * Filter bar component
 */
export const filterBar = (filters: Array<{
  name: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: Array<{ value: string; label: string }>;
  value?: string;
  placeholder?: string;
}>): string => `
  <div class="glass-card rounded-xl p-4 mb-6">
    <form method="GET" class="flex flex-wrap gap-4 items-end">
      ${filters.map(filter => {
        if (filter.type === 'select') {
          return `
            <div class="flex-1 min-w-[150px]">
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">${filter.label}</label>
              <select name="${filter.name}" class="select w-full">
                ${filter.options?.map(opt => `
                  <option value="${opt.value}" ${filter.value === opt.value ? 'selected' : ''}>${opt.label}</option>
                `).join('')}
              </select>
            </div>
          `;
        } else if (filter.type === 'date') {
          return `
            <div class="flex-1 min-w-[150px]">
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">${filter.label}</label>
              <input type="date" name="${filter.name}" value="${filter.value || ''}" class="input">
            </div>
          `;
        } else {
          return `
            <div class="flex-1 min-w-[200px]">
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">${filter.label}</label>
              <input type="text" name="${filter.name}" value="${filter.value || ''}" placeholder="${filter.placeholder || ''}" class="input">
            </div>
          `;
        }
      }).join('')}
      <div class="flex gap-2">
        <button type="submit" class="btn btn-primary">
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Filter
        </button>
        <a href="?" class="btn btn-secondary">Clear</a>
      </div>
    </form>
  </div>
`;

/**
 * Pagination component
 */
export const pagination = (currentPage: number, totalPages: number, baseUrl: string): string => {
  if (totalPages <= 1) return '';

  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return `
    <div class="flex justify-center items-center gap-2 mt-6">
      ${currentPage > 1 ? `
        <a href="${baseUrl}page=${currentPage - 1}" class="btn btn-secondary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </a>
      ` : ''}
      ${pages.map(page => {
        if (page === '...') return '<span class="px-3 py-2 text-muted-foreground">...</span>';
        const isActive = page === currentPage;
        return `<a href="${baseUrl}page=${page}" class="px-3 py-2 rounded-lg ${isActive ? 'bg-white text-black' : 'bg-muted text-muted-foreground hover:bg-border'}">${page}</a>`;
      }).join('')}
      ${currentPage < totalPages ? `
        <a href="${baseUrl}page=${currentPage + 1}" class="btn btn-secondary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      ` : ''}
    </div>
  `;
};

/**
 * Status badge component
 */
export const statusBadge = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'status-success',
    connected: 'status-success',
    connecting: 'status-warning',
    inactive: 'muted-foreground',
    disconnected: 'muted-foreground',
    error: 'status-error',
    admin: 'status-warning',
    user: 'muted-foreground',
  };
  const color = colors[status.toLowerCase()] || 'muted-foreground';
  const showPulse = ['active', 'connected', 'connecting'].includes(status.toLowerCase());

  return `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-${color}/10 text-${color}">
      <span class="w-1.5 h-1.5 rounded-full bg-${color} ${showPulse ? 'animate-pulse' : ''}"></span>
      ${status}
    </span>
  `;
};

/**
 * Empty state component
 */
export const emptyState = (message: string, icon: string = 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'): string => `
  <div class="text-center py-12">
    <svg class="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icon}"></path>
    </svg>
    <p class="text-muted-foreground">${message}</p>
  </div>
`;

export default {
  renderPage,
  statCard,
  filterBar,
  pagination,
  statusBadge,
  emptyState,
};
