'use client';

import { useRouter } from 'next/navigation';
import { Monitor, ExternalLink, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, StatusBadge, EmptyState } from '@/components/ui';
import { useSessionStore, toast } from '@/lib/stores';
import { ROUTES, SUCCESS_MESSAGES } from '@/lib/utils/constants';
import { formatRelativeTime, formatDuration } from '@/lib/utils/helpers';
import type { Session, Instance } from '@/lib/types';

export function ActiveSessions() {
  const router = useRouter();
  const { activeSessions, disconnect, isDisconnecting } = useSessionStore();

  const handleDisconnect = async (sessionId: string) => {
    try {
      await disconnect(sessionId);
      toast.success(SUCCESS_MESSAGES.DISCONNECTION_SUCCESS);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect';
      toast.error(message);
    }
  };

  const getInstanceName = (session: Session): string => {
    if (typeof session.instanceId === 'string') {
      return 'Instance';
    }
    return (session.instanceId as Instance)?.name || 'Unknown Instance';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {activeSessions.length === 0 ? (
          <EmptyState
            icon={<Monitor className="w-6 h-6" />}
            title="No active sessions"
            description="Connect to an instance to start a remote desktop session."
            action={
              <Button
                variant="outline"
                onClick={() => router.push(ROUTES.INSTANCES)}
              >
                View Instances
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-background">
                    <Monitor className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {getInstanceName(session)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={session.status} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        Started {formatRelativeTime(session.connectionStartedAt)}
                      </span>
                      {session.duration && (
                        <span className="text-xs text-muted-foreground">
                          Duration: {formatDuration(session.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => window.open(ROUTES.DESKTOP(session.id), '_blank')}
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
                    Disconnect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
