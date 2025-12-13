'use client';

import { DashboardLayout } from '@/components/layout';
import { SessionList } from '@/components/sessions';

export default function SessionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sessions</h1>
          <p className="text-muted-foreground">
            View and manage your remote desktop sessions
          </p>
        </div>
        <SessionList />
      </div>
    </DashboardLayout>
  );
}
