'use client';

import { useEffect } from 'react';
import { Server, Activity, Clock, Wifi, History } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { StatsCard, ActiveSessions, RecentInstances } from '@/components/dashboard';
import { useAuthStore, useInstanceStore, useSessionStore } from '@/lib/stores';
import { formatDuration } from '@/lib/utils/helpers';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { instances, fetchInstances } = useInstanceStore();
  const { stats, activeSessions, fetchStats, fetchActiveSessions } = useSessionStore();

  useEffect(() => {
    fetchInstances({ limit: 100 });
    fetchStats();
    fetchActiveSessions();
  }, [fetchInstances, fetchStats, fetchActiveSessions]);

  const instanceList = instances || [];
  const activeInstanceCount = instanceList.filter((i) => i.status === 'active').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your cloud desktop activity
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total Instances"
            value={instanceList.length}
            icon={<Server className="w-5 h-5 text-foreground" />}
          />
          <StatsCard
            title="Active Instances"
            value={activeInstanceCount}
            icon={<Wifi className="w-5 h-5 text-foreground" />}
          />
          <StatsCard
            title="Active Sessions"
            value={stats?.activeSessions || (activeSessions?.length ?? 0)}
            icon={<Activity className="w-5 h-5 text-foreground" />}
          />
          <StatsCard
            title="Total Sessions"
            value={stats?.totalSessions || 0}
            icon={<History className="w-5 h-5 text-foreground" />}
          />
          <StatsCard
            title="Total Session Time"
            value={formatDuration(stats?.totalDuration || 0)}
            icon={<Clock className="w-5 h-5 text-foreground" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActiveSessions />
          <RecentInstances />
        </div>
      </div>
    </DashboardLayout>
  );
}
