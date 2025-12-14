'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Monitor, Users, Eye, MousePointer2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/utils/constants';
import { toast } from '@/lib/stores';
import { cn } from '@/lib/utils/helpers';

interface InviteInfo {
  sessionId: string;
  instanceName: string;
  permissions: 'view' | 'control';
  viewerCount: number;
  maxViewers: number;
  expiresAt?: string;
}

interface JoinResult {
  sessionId: string;
  websocketUrl: string;
  permissions: 'view' | 'control';
  message: string;
}

export default function JoinSessionPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInviteInfo();
    }
  }, [token]);

  const fetchInviteInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<InviteInfo>(`/api/sessions/invite-info/${token}`);
      if (response.success && response.data) {
        setInviteInfo(response.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid or expired invite';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!token) return;

    setIsJoining(true);
    try {
      const response = await api.post<JoinResult>(`/api/sessions/join/${token}`);
      if (response.success && response.data) {
        toast.success(response.data.message);
        // Open the desktop viewer
        window.open(ROUTES.DESKTOP(response.data.sessionId), '_blank');
        // Redirect back to dashboard in this tab
        router.push(ROUTES.DASHBOARD);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join session';
      toast.error(message);
      setError(message);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading invite details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-status-error" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Unable to Join Session
            </h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push(ROUTES.DASHBOARD)}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={fetchInviteInfo}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteInfo) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-foreground" />
          </div>
          <CardTitle className="text-xl">Join Remote Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Info */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Instance</span>
              <span className="text-sm font-medium text-foreground">
                {inviteInfo.instanceName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Access</span>
              <Badge
                variant={inviteInfo.permissions === 'control' ? 'warning' : 'default'}
                className="flex items-center gap-1"
              >
                {inviteInfo.permissions === 'control' ? (
                  <>
                    <MousePointer2 className="w-3 h-3" />
                    View + Control
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    View Only
                  </>
                )}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Viewers</span>
              <span className="text-sm text-foreground flex items-center gap-1">
                <Users className="w-4 h-4" />
                {inviteInfo.viewerCount} / {inviteInfo.maxViewers}
              </span>
            </div>
            {inviteInfo.expiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires</span>
                <span className="text-sm text-foreground">
                  {new Date(inviteInfo.expiresAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Permission Notice */}
          <div
            className={cn(
              'p-3 rounded-lg text-sm',
              inviteInfo.permissions === 'control'
                ? 'bg-status-warning/10 border border-status-warning/30 text-status-warning'
                : 'bg-status-info/10 border border-status-info/30 text-status-info'
            )}
          >
            {inviteInfo.permissions === 'control' ? (
              <p>You will be able to view and control this remote desktop.</p>
            ) : (
              <p>You will be able to view this remote desktop, but cannot control it.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleJoin}
              isLoading={isJoining}
              disabled={inviteInfo.viewerCount >= inviteInfo.maxViewers}
              className="w-full"
            >
              {inviteInfo.viewerCount >= inviteInfo.maxViewers
                ? 'Session Full'
                : 'Join Session'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(ROUTES.DASHBOARD)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          {inviteInfo.viewerCount >= inviteInfo.maxViewers && (
            <p className="text-xs text-status-error text-center">
              This session has reached its maximum number of viewers.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
