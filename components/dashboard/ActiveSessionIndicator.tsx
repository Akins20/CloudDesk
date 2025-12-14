'use client';

import { useRouter } from 'next/navigation';
import { Monitor, ExternalLink, XCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { SessionTimer } from './SessionTimer';
import { useSessionStore, toast } from '@/lib/stores';
import { ROUTES, SUCCESS_MESSAGES } from '@/lib/utils/constants';

interface ActiveSession {
  id: string;
  instanceId: string;
  instanceName: string;
  startTime: string;
  status: string;
}

interface ActiveSessionIndicatorProps {
  sessions: ActiveSession[];
}

export function ActiveSessionIndicator({ sessions }: ActiveSessionIndicatorProps) {
  const router = useRouter();
  const { disconnect } = useSessionStore();

  const handleDisconnect = async (sessionId: string) => {
    try {
      await disconnect(sessionId);
      toast.success(SUCCESS_MESSAGES.DISCONNECTION_SUCCESS);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect';
      toast.error(message);
    }
  };

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-card/50 border border-status-success/30 animate-panel-breathe overflow-hidden">
      {/* Header with glow */}
      <div className="p-4 border-b border-status-success/20 bg-status-success/5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <div className="absolute inset-0 rounded-full bg-status-success animate-connection-ring" />
          </div>
          <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
            Active Sessions
          </h2>
          <span className="text-xs text-status-success ml-auto">{sessions.length} active</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="p-3 rounded-lg bg-muted/20 border border-status-success/20"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-status-success" />
                <span className="text-sm font-medium text-foreground">
                  {session.instanceName}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(ROUTES.DESKTOP(session.id), '_blank')}
                  className="text-status-success hover:bg-status-success/10"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(session.id)}
                  className="text-status-error hover:bg-status-error/10"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <SessionTimer startTime={session.startTime} />
          </div>
        ))}
      </div>
    </div>
  );
}
