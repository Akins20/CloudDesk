'use client';

import { useRouter } from 'next/navigation';
import { Activity, ExternalLink, XCircle, Server, Clock, Calendar } from 'lucide-react';
import { Button, StatusBadge, EmptyState, PageLoader } from '@/components/ui';
import { useSessionStore, toast } from '@/lib/stores';
import { ROUTES, SUCCESS_MESSAGES } from '@/lib/utils/constants';
import { formatRelativeTime, formatDuration, formatDateTime } from '@/lib/utils/helpers';
import type { Session, Instance } from '@/lib/types';

export function SessionList() {
  const router = useRouter();
  const { sessions, isLoading, pagination, fetchSessions, disconnect, isDisconnecting } =
    useSessionStore();

  const handleDisconnect = async (sessionId: string) => {
    try {
      await disconnect(sessionId);
      toast.success(SUCCESS_MESSAGES.DISCONNECTION_SUCCESS);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect';
      toast.error(message);
    }
  };

  const handlePageChange = (page: number) => {
    fetchSessions({ page });
  };

  const getInstanceInfo = (session: Session): { name: string; host: string } => {
    if (typeof session.instanceId === 'string') {
      return { name: 'Instance', host: 'N/A' };
    }
    const instance = session.instanceId as Instance;
    return {
      name: instance?.name || 'Unknown',
      host: instance?.host || 'N/A',
    };
  };

  if (isLoading && (!sessions || sessions.length === 0)) {
    return <PageLoader message="Loading sessions..." />;
  }

  const sessionList = sessions || [];
  const activeSessions = sessionList.filter((s) => s.isActive);
  const inactiveSessions = sessionList.filter((s) => !s.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Session History</h2>
          <p className="text-sm text-muted-foreground">
            {activeSessions.length} active · {sessionList.length} total
          </p>
        </div>
      </div>

      {sessionList.length === 0 ? (
        <div className="rounded-xl bg-card/50 border border-border/50 p-12">
          <EmptyState
            icon={<Activity className="w-8 h-8" />}
            title="No sessions yet"
            description="Your session history will appear here once you connect to an instance."
            action={
              <Button onClick={() => router.push(ROUTES.INSTANCES)}>
                View Instances
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* Active Sessions */}
          {activeSessions.length > 0 && (
            <div className="rounded-xl bg-card/50 border border-status-success/30 animate-panel-breathe overflow-hidden">
              <div className="p-4 border-b border-status-success/20 bg-status-success/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-status-success animate-connection-ring" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                    Active Sessions
                  </h3>
                  <span className="text-xs text-status-success">{activeSessions.length} active</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Instance
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Started
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSessions.map((session) => {
                      const instanceInfo = getInstanceInfo(session);
                      return (
                        <tr
                          key={session.id}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-muted/50">
                                <Server className="w-4 h-4 text-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-sm">
                                  {instanceInfo.name}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {instanceInfo.host}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge status={session.status} />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground">
                                {formatRelativeTime(session.connectionStartedAt)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground font-mono">
                                {formatDuration(session.duration)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(ROUTES.DESKTOP(session.id))}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Open
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-status-error hover:bg-status-error/10"
                                onClick={() => handleDisconnect(session.id)}
                                disabled={isDisconnecting}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                End
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Past Sessions */}
          {inactiveSessions.length > 0 && (
            <div className="rounded-xl bg-card/50 border border-border/50 animate-panel-breathe overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                  Past Sessions
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Instance
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Started
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Ended
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveSessions.map((session) => {
                      const instanceInfo = getInstanceInfo(session);
                      return (
                        <tr
                          key={session.id}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-muted/50">
                                <Server className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground text-sm">
                                  {instanceInfo.name}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {instanceInfo.host}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge status={session.status} />
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(session.connectionStartedAt)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs text-foreground font-mono">
                              {formatDuration(session.duration)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(session.connectionEndedAt)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
