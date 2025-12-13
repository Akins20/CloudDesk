'use client';

import { Monitor, Globe, Calendar, Clock, Tag, Server, User } from 'lucide-react';
import { Instance } from '@/lib/types';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/helpers';

interface InstanceExpandedDetailsProps {
  instance: Instance;
}

export function InstanceExpandedDetails({ instance }: InstanceExpandedDetailsProps) {
  return (
    <div className="p-4 bg-muted/20 border-l-2 border-status-success/50">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-start gap-2">
          <Globe className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Host</p>
            <p className="text-sm text-foreground font-mono">{instance.host}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Server className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Port</p>
            <p className="text-sm text-foreground font-mono">{instance.port}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Monitor className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Provider</p>
            <p className="text-sm text-foreground capitalize">{instance.provider}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <User className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Username</p>
            <p className="text-sm text-foreground font-mono">{instance.username}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-sm text-foreground">{formatDateTime(instance.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Last Connected</p>
            <p className="text-sm text-foreground">{formatRelativeTime(instance.lastConnectedAt)}</p>
          </div>
        </div>

        {instance.tags && instance.tags.length > 0 && (
          <div className="col-span-2 flex items-start gap-2">
            <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {instance.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-xs rounded bg-muted text-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
