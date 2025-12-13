'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-foreground/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-foreground/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-foreground/5 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo and header */}
        <Link href={ROUTES.HOME} className="mb-8 text-center group">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-foreground mb-4 group-hover:scale-105 transition-transform">
            <span className="text-background font-bold text-2xl">CD</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">CloudDesk</h1>
          <p className="text-muted-foreground mt-1">Remote Desktop Management</p>
        </Link>

        {/* Form container */}
        <div className="w-full max-w-md">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} CloudDesk. All rights reserved.
        </p>
      </div>

      <ToastContainer />
    </div>
  );
}
