'use client';

import { User, Mail, Calendar, Shield } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { formatDateTime } from '@/lib/utils/helpers';

export function ProfileCard() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="rounded-xl bg-card/50 border border-border/50 animate-panel-breathe overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
          Profile Information
        </h3>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center ring-2 ring-border">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {user.firstName} {user.lastName}
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              user.role === 'admin'
                ? 'bg-status-info/10 text-status-info'
                : 'bg-muted text-muted-foreground'
            }`}>
              {user.role === 'admin' ? 'Administrator' : 'User'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
              <p className="text-sm text-foreground font-medium">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Member Since</p>
              <p className="text-sm text-foreground font-medium">{formatDateTime(user.createdAt)}</p>
            </div>
          </div>

          {user.lastLoginAt && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Login</p>
                <p className="text-sm text-foreground font-medium">{formatDateTime(user.lastLoginAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
