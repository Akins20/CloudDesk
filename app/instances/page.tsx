'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { GridBackground, InstanceListPanel } from '@/components/dashboard';
import { Button } from '@/components/ui';
import { useInstanceStore } from '@/lib/stores';
import { ROUTES } from '@/lib/utils/constants';

export default function InstancesPage() {
  const router = useRouter();
  const { instances, fetchInstances } = useInstanceStore();

  useEffect(() => {
    fetchInstances({ limit: 100 });
  }, [fetchInstances]);

  return (
    <DashboardLayout>
      <div className="relative min-h-full">
        <GridBackground />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">All Instances</h2>
              <p className="text-sm text-muted-foreground">
                {instances?.length || 0} total
              </p>
            </div>
            <Button
              onClick={() => router.push(ROUTES.INSTANCE_NEW)}
              className="relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Plus className="w-4 h-4 mr-2" />
              Add Instance
            </Button>
          </div>

          <InstanceListPanel
            instances={instances || []}
            onRefresh={() => fetchInstances({ limit: 100 })}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
