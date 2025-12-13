'use client';

import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { GridBackground } from '@/components/dashboard';
import { SessionList } from '@/components/sessions';
import { useSessionStore } from '@/lib/stores';

export default function SessionsPage() {
  const { fetchSessions } = useSessionStore();

  useEffect(() => {
    fetchSessions({ limit: 50 });
  }, [fetchSessions]);

  return (
    <DashboardLayout>
      <div className="relative min-h-full">
        <GridBackground />

        <div className="relative z-10 space-y-6">
          <SessionList />
        </div>
      </div>
    </DashboardLayout>
  );
}
