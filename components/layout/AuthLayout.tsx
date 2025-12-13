'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { ROUTES } from '@/lib/utils/constants';
import { PageLoader, ToastContainer } from '@/components/ui';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) {
    return <PageLoader message="Loading..." />;
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-foreground mb-4">
            <span className="text-background font-bold text-xl">CD</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">CloudDesk</h1>
          <p className="text-muted-foreground mt-1">Remote Desktop Management</p>
        </div>
        {children}
      </div>
      <ToastContainer />
    </div>
  );
}
