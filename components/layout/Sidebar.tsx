'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Server, Activity, Settings, ChevronLeft, X } from 'lucide-react';
import { useUIStore, useSessionStore } from '@/lib/stores';
import { ROUTES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/helpers';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useUIStore();
  const { activeSessions } = useSessionStore();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: ROUTES.DASHBOARD,
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Instances',
      href: ROUTES.INSTANCES,
      icon: <Server className="w-5 h-5" />,
    },
    {
      label: 'Sessions',
      href: ROUTES.SESSIONS,
      icon: <Activity className="w-5 h-5" />,
      badge: activeSessions.length > 0 ? activeSessions.length : undefined,
    },
    {
      label: 'Settings',
      href: ROUTES.SETTINGS,
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === ROUTES.DASHBOARD) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200',
          sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        onClick={() => setSidebarCollapsed(true)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-card border-r border-border z-50 transition-all duration-200',
          'lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]',
          sidebarCollapsed ? 'w-0 lg:w-20 -translate-x-full lg:translate-x-0' : 'w-64'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Mobile header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-background font-bold text-sm">CD</span>
              </div>
              <span className="font-semibold text-foreground">CloudDesk</span>
            </div>
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarCollapsed(true)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'hover:bg-muted',
                  isActive(item.href)
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                  sidebarCollapsed && 'lg:justify-center lg:px-0'
                )}
              >
                {item.icon}
                <span className={cn('flex-1', sidebarCollapsed && 'lg:hidden')}>
                  {item.label}
                </span>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      isActive(item.href)
                        ? 'bg-background text-foreground'
                        : 'bg-status-success text-white',
                      sidebarCollapsed && 'lg:hidden'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Collapse button (desktop only) */}
          <div className="hidden lg:block p-4 border-t border-border">
            <button
              onClick={toggleSidebar}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200',
                sidebarCollapsed && 'justify-center px-0'
              )}
            >
              <ChevronLeft
                className={cn(
                  'w-5 h-5 transition-transform duration-200',
                  sidebarCollapsed && 'rotate-180'
                )}
              />
              <span className={cn(sidebarCollapsed && 'hidden')}>Collapse</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
