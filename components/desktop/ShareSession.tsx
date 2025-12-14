'use client';

import { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  Users,
  Eye,
  MousePointer2,
  X,
  Link,
  UserMinus,
  RefreshCw,
} from 'lucide-react';
import { Modal, Button, Select, Input, Badge } from '@/components/ui';
import { api } from '@/lib/api';
import { API_BASE_URL } from '@/lib/utils/constants';
import { toast } from '@/lib/stores';
import { cn } from '@/lib/utils/helpers';

interface ShareSessionProps {
  sessionId: string;
  isOwner: boolean;
}

interface Invite {
  inviteId: string;
  inviteToken: string;
  inviteUrl: string;
  permissions: 'view' | 'control';
  expiresAt?: string;
  maxUses: number;
  useCount: number;
  createdAt: string;
}

interface Viewer {
  odId: string;
  name: string;
  permissions: 'view' | 'control';
  joinedAt: string;
}

interface ViewersResponse {
  isOwner: boolean;
  isCollaborative: boolean;
  viewerCount: number;
  maxViewers: number;
  viewers: Viewer[];
}

export function ShareSession({ sessionId, isOwner }: ShareSessionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'invite' | 'viewers'>('invite');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Invite state
  const [invites, setInvites] = useState<Invite[]>([]);
  const [newInvitePermissions, setNewInvitePermissions] = useState<'view' | 'control'>('view');
  const [newInviteExpiry, setNewInviteExpiry] = useState('60'); // minutes
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);

  // Viewers state
  const [viewersData, setViewersData] = useState<ViewersResponse | null>(null);

  // Fetch invites and viewers when modal opens
  useEffect(() => {
    if (isOpen && isOwner) {
      fetchInvites();
      fetchViewers();
    }
  }, [isOpen, isOwner, sessionId]);

  const fetchInvites = async () => {
    try {
      const response = await api.get<Invite[]>(`/api/sessions/${sessionId}/invites`);
      if (response.success && response.data) {
        setInvites(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    }
  };

  const fetchViewers = async () => {
    try {
      const response = await api.get<ViewersResponse>(`/api/sessions/${sessionId}/viewers`);
      if (response.success && response.data) {
        setViewersData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch viewers:', error);
    }
  };

  const createInvite = async () => {
    setIsLoading(true);
    try {
      const response = await api.post<{
        inviteId: string;
        inviteToken: string;
        inviteUrl: string;
        permissions: string;
        expiresAt?: string;
        maxUses: number;
      }>(`/api/sessions/${sessionId}/invite`, {
        permissions: newInvitePermissions,
        expiresInMinutes: parseInt(newInviteExpiry) || 60,
        maxUses: 1,
      });

      if (response.success && response.data) {
        const fullUrl = `${window.location.origin}${response.data.inviteUrl}`;
        setCreatedInviteUrl(fullUrl);
        fetchInvites();
        toast.success('Invite link created!');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create invite';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    try {
      await api.delete(`/api/sessions/${sessionId}/invite/${inviteId}`);
      setInvites(invites.filter((i) => i.inviteId !== inviteId));
      toast.success('Invite revoked');
    } catch (error) {
      toast.error('Failed to revoke invite');
    }
  };

  const kickViewer = async (viewerId: string) => {
    try {
      await api.delete(`/api/sessions/${sessionId}/viewers/${viewerId}`);
      fetchViewers();
      toast.success('Viewer removed');
    } catch (error) {
      toast.error('Failed to remove viewer');
    }
  };

  const updateViewerPermissions = async (viewerId: string, permissions: 'view' | 'control') => {
    try {
      await api.patch(`/api/sessions/${sessionId}/viewers/${viewerId}`, { permissions });
      fetchViewers();
      toast.success('Permissions updated');
    } catch (error) {
      toast.error('Failed to update permissions');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const permissionOptions = [
    { value: 'view', label: 'View only' },
    { value: 'control', label: 'View + Control' },
  ];

  const expiryOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '1440', label: '24 hours' },
  ];

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        title="Share Session"
        className="relative"
      >
        <Share2 className="w-4 h-4" />
        {viewersData && viewersData.viewerCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-status-success text-white text-xs rounded-full flex items-center justify-center">
            {viewersData.viewerCount}
          </span>
        )}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setCreatedInviteUrl(null);
        }}
        title="Share Session"
        size="md"
      >
        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setActiveTab('invite')}
            className={cn(
              'flex-1 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'invite'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Link className="w-4 h-4 inline mr-2" />
            Invite
          </button>
          <button
            onClick={() => setActiveTab('viewers')}
            className={cn(
              'flex-1 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'viewers'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Viewers ({viewersData?.viewerCount || 0})
          </button>
        </div>

        {activeTab === 'invite' && (
          <div className="space-y-4">
            {/* Create new invite */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <h4 className="text-sm font-medium text-foreground">Create Invite Link</h4>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Permissions"
                  options={permissionOptions}
                  value={newInvitePermissions}
                  onChange={(e) => setNewInvitePermissions(e.target.value as 'view' | 'control')}
                />
                <Select
                  label="Expires in"
                  options={expiryOptions}
                  value={newInviteExpiry}
                  onChange={(e) => setNewInviteExpiry(e.target.value)}
                />
              </div>

              <Button
                onClick={createInvite}
                isLoading={isLoading}
                className="w-full"
              >
                <Link className="w-4 h-4 mr-2" />
                Generate Link
              </Button>
            </div>

            {/* Created invite URL */}
            {createdInviteUrl && (
              <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-lg">
                <p className="text-sm text-foreground mb-2">Share this link:</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={createdInviteUrl}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(createdInviteUrl)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Active invites */}
            {invites.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Active Invites</h4>
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite.inviteId}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {invite.permissions === 'control' ? (
                          <MousePointer2 className="w-4 h-4 text-status-warning" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-foreground">
                          {invite.permissions === 'control' ? 'Control' : 'View only'}
                        </span>
                        <Badge variant="default" className="text-xs">
                          {invite.useCount}/{invite.maxUses} used
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${window.location.origin}${invite.inviteUrl}`)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeInvite(invite.inviteId)}
                          className="text-status-error hover:bg-status-error/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'viewers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {viewersData?.viewerCount || 0} of {viewersData?.maxViewers || 10} viewers
              </p>
              <Button variant="ghost" size="sm" onClick={fetchViewers}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {viewersData?.viewers && viewersData.viewers.length > 0 ? (
              <div className="space-y-2">
                {viewersData.viewers.map((viewer) => (
                  <div
                    key={viewer.odId}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{viewer.name}</p>
                        <div className="flex items-center gap-2">
                          {viewer.permissions === 'control' ? (
                            <Badge variant="warning" className="text-xs">
                              <MousePointer2 className="w-3 h-3 mr-1" />
                              Control
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              View only
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        options={permissionOptions}
                        value={viewer.permissions}
                        onChange={(e) => updateViewerPermissions(viewer.odId, e.target.value as 'view' | 'control')}
                        className="w-32 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => kickViewer(viewer.odId)}
                        className="text-status-error hover:bg-status-error/10"
                        title="Remove viewer"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No viewers connected</p>
                <p className="text-xs mt-1">Share an invite link to let others join</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
