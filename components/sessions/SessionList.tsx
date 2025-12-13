'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ExternalLink, XCircle, Server } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  StatusBadge,
  EmptyState,
  PageLoader,
} from '@/components/ui';
import { useSessionStore, toast } from '@/lib/stores';
import { ROUTES, SUCCESS_MESSAGES } from '@/lib/utils/constants';
import { formatRelativeTime, formatDuration, formatDateTime } from '@/lib/utils/helpers';
import type { Session, Instance } from '@/lib/types';

export function SessionList() {
  const router = useRouter();
  const { sessions, isLoading, pagination, fetchSessions, disconnect, isDisconnecting } =
    useSessionStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session History</CardTitle>
      </CardHeader>
      <CardContent>
        {sessionList.length === 0 ? (
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
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Instance
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Started
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Duration
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessionList.map((session) => {
                    const instanceInfo = getInstanceInfo(session);
                    return (
                      <tr
                        key={session.id}
                        className="border-b border-border last:border-0 hover:bg-muted/50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <Server className="w-4 h-4 text-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {instanceInfo.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {instanceInfo.host}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={session.status} />
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-foreground">
                            {formatDateTime(session.connectionStartedAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(session.connectionStartedAt)}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-foreground">
                            {formatDuration(session.duration)}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-2">
                            {session.isActive ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<ExternalLink className="w-4 h-4" />}
                                  onClick={() => router.push(ROUTES.DESKTOP(session.id))}
                                >
                                  Open
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-status-error hover:bg-status-error/10"
                                  leftIcon={<XCircle className="w-4 h-4" />}
                                  onClick={() => handleDisconnect(session.id)}
                                  isLoading={isDisconnecting}
                                >
                                  End
                                </Button>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Ended {formatRelativeTime(session.connectionEndedAt)}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
