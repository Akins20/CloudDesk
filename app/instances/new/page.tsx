'use client';

import { DashboardLayout } from '@/components/layout';
import { InstanceForm } from '@/components/instances';

export default function NewInstancePage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <InstanceForm mode="create" />
      </div>
    </DashboardLayout>
  );
}
