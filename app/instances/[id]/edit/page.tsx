'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { InstanceForm } from '@/components/instances';
import { PageLoader } from '@/components/ui';
import { useInstanceStore } from '@/lib/stores';
import { ROUTES } from '@/lib/utils/constants';

export default function EditInstancePage() {
  const params = useParams();
  const router = useRouter();
  const { currentInstance, fetchInstance, isLoading } = useInstanceStore();

  const instanceId = params.id as string;

  useEffect(() => {
    if (instanceId) {
      fetchInstance(instanceId).catch(() => {
        router.push(ROUTES.INSTANCES);
      });
    }
  }, [instanceId, fetchInstance, router]);

  if (isLoading || !currentInstance) {
    return (
      <DashboardLayout>
        <PageLoader message="Loading instance..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <InstanceForm mode="edit" instance={currentInstance} />
      </div>
    </DashboardLayout>
  );
}
