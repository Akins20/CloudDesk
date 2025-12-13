'use client';

import { DashboardLayout } from '@/components/layout';
import { InstanceList } from '@/components/instances';

export default function InstancesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Instances</h1>
          <p className="text-muted-foreground">Manage your cloud instances and remote connections</p>
        </div>
        <InstanceList />
      </div>
    </DashboardLayout>
  );
}
