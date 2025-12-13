'use client';

import { useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
  GridBackground,
  StatusDashboard,
  InstanceListPanel,
  QuickActionsPanel,
  ActiveSessionIndicator,
} from '@/components/dashboard';
import { useInstanceStore, useSessionStore } from '@/lib/stores';
import { formatDuration } from '@/lib/utils/helpers';

export default function DashboardPage() {
  const { instances, fetchInstances } = useInstanceStore();
  const { stats, activeSessions, fetchStats, fetchActiveSessions } = useSessionStore();

  // Fetch data on mount and set up polling
  useEffect(() => {
    fetchInstances({ limit: 100 });
    fetchStats();
    fetchActiveSessions();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchInstances({ limit: 100 });
      fetchStats();
      fetchActiveSessions();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchInstances, fetchStats, fetchActiveSessions]);

  const instanceList = useMemo(() => instances || [], [instances]);
  const activeInstanceCount = useMemo(
    () => instanceList.filter((i) => i.status === 'active').length,
    [instanceList]
  );

  // Get recently connected instances (sorted by lastConnectedAt)
  const recentInstances = useMemo(() => {
    return [...instanceList]
      .filter((i) => i.lastConnectedAt)
      .sort((a, b) => {
        const dateA = new Date(a.lastConnectedAt || 0).getTime();
        const dateB = new Date(b.lastConnectedAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [instanceList]);

  // Format active sessions for the indicator
  const formattedActiveSessions = useMemo(() => {
    return (activeSessions || []).map((session) => {
      const instanceId = typeof session.instanceId === 'string'
        ? session.instanceId
        : session.instanceId?.id;
      return {
        id: session.id,
        instanceId: instanceId || '',
        instanceName:
          instanceList.find((i) => i.id === instanceId)?.name || 'Unknown Instance',
        startTime: session.connectionStartedAt || session.createdAt,
        status: session.status,
      };
    });
  }, [activeSessions, instanceList]);

  return (
    <DashboardLayout>
      <div className="relative min-h-full">
        {/* Grid background effect */}
        <GridBackground />

        {/* Main content */}
        <div className="relative z-10 space-y-6">
          {/* Status Dashboard */}
          <StatusDashboard
            totalInstances={instanceList.length}
            activeInstances={activeInstanceCount}
            activeSessions={stats?.activeSessions || (activeSessions?.length ?? 0)}
            totalSessions={stats?.totalSessions || 0}
            totalDuration={formatDuration(stats?.totalDuration || 0)}
            instances={instanceList}
          />

          {/* Main panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Instance List - 8 columns */}
            <div className="lg:col-span-8 min-h-[500px]">
              <InstanceListPanel
                instances={instanceList}
                onRefresh={() => fetchInstances({ limit: 100 })}
              />
            </div>

            {/* Right sidebar - 4 columns */}
            <div className="lg:col-span-4 space-y-6">
              {/* Active Sessions */}
              <ActiveSessionIndicator sessions={formattedActiveSessions} />

              {/* Quick Actions */}
              <QuickActionsPanel recentInstances={recentInstances} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
