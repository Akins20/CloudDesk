'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Server, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, StatusBadge, EmptyState } from '@/components/ui';
import { useInstanceStore } from '@/lib/stores';
import { ROUTES, CLOUD_PROVIDERS } from '@/lib/utils/constants';
import { formatRelativeTime } from '@/lib/utils/helpers';

export function RecentInstances() {
  const router = useRouter();
  const { instances, fetchInstances, isLoading } = useInstanceStore();

  useEffect(() => {
    fetchInstances({ limit: 5 });
  }, [fetchInstances]);

  const recentInstances = instances && instances.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Instances</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={() => router.push(ROUTES.INSTANCES)}
        >
          View all
        </Button>
      </CardHeader>
      <CardContent>
        {recentInstances && recentInstances?.length === 0 ? (
          <EmptyState
            icon={<Server className="w-6 h-6" />}
            title="No instances yet"
            description="Add your first cloud instance to get started."
            action={
              <Button onClick={() => router.push(ROUTES.INSTANCE_NEW)}>
                Add Instance
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {recentInstances && recentInstances?.map((instance) => (
              <div
                key={instance.id}
                className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                onClick={() => router.push(ROUTES.INSTANCE_EDIT(instance.id))}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Server className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {instance.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {CLOUD_PROVIDERS[instance.provider]?.label || instance.provider} &middot;{' '}
                      {formatRelativeTime(instance.lastConnectedAt)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={instance.status} size="sm" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
