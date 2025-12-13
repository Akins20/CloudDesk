'use client';

import { useRouter } from 'next/navigation';
import { Plus, Play, Clock, Server } from 'lucide-react';
import { Button } from '@/components/ui';
import { Instance } from '@/lib/types';
import { useSessionStore, toast } from '@/lib/stores';
import { formatRelativeTime } from '@/lib/utils/helpers';
import { ROUTES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/utils/constants';
import { useState } from 'react';

interface QuickActionsPanelProps {
  recentInstances: Instance[];
}

export function QuickActionsPanel({ recentInstances }: QuickActionsPanelProps) {
  const router = useRouter();
  const { connect } = useSessionStore();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleConnect = async (instanceId: string) => {
    setConnectingId(instanceId);
    try {
      const session = await connect({ instanceId });
      toast.success(SUCCESS_MESSAGES.CONNECTION_SUCCESS);
      router.push(`${ROUTES.DESKTOP}/${session.sessionId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.CONNECTION_FAILED;
      toast.error(message);
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <div className="rounded-xl bg-card/50 border border-border/50 animate-panel-breathe overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
          Quick Actions
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Add Instance Button */}
        <Button
          onClick={() => router.push(ROUTES.INSTANCE_NEW)}
          className="w-full relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Plus className="w-4 h-4 mr-2" />
          Add New Instance
        </Button>

        {/* Recent Connections */}
        {recentInstances.length > 0 && (
          <div>
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Recent Connections
            </h3>
            <div className="space-y-2">
              {recentInstances.slice(0, 5).map((instance) => (
                <div
                  key={instance.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
                >
                  {/* Status indicator */}
                  <div className="relative">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        instance.status === 'active'
                          ? 'bg-status-success shadow-[0_0_6px_hsl(var(--status-success)/0.5)]'
                          : 'bg-muted-foreground/50'
                      }`}
                    />
                  </div>

                  {/* Instance info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{instance.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(instance.lastConnectedAt)}
                    </p>
                  </div>

                  {/* Quick connect button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleConnect(instance.id)}
                    disabled={connectingId === instance.id}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                      instance.status === 'active'
                        ? 'text-status-success hover:bg-status-success/10'
                        : ''
                    }`}
                  >
                    <Play
                      className={`w-4 h-4 ${connectingId === instance.id ? 'animate-pulse' : ''}`}
                    />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentInstances.length === 0 && (
          <div className="text-center py-4">
            <Server className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No recent connections</p>
          </div>
        )}
      </div>
    </div>
  );
}
