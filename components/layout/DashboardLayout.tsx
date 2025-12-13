'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '@/components/ui';
import { useAuthStore, useSessionStore, useUIStore } from '@/lib/stores';
import { PageLoader } from '@/components/ui';
import { ROUTES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/helpers';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const { fetchActiveSessions, fetchStats } = useSessionStore();
  const { sidebarCollapsed } = useUIStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveSessions();
      fetchStats();
    }
  }, [isAuthenticated, fetchActiveSessions, fetchStats]);

  if (!isInitialized) {
    return <PageLoader message="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-4rem)] transition-all duration-200',
            sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'
          )}
        >
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
