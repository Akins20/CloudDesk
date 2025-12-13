'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Play, Settings, Trash2, X, Save } from 'lucide-react';
import { Instance, UpdateInstanceData } from '@/lib/types';
import { Button, Input, Modal } from '@/components/ui';
import { InstanceExpandedDetails } from './InstanceExpandedDetails';
import { useSessionStore, useInstanceStore, toast } from '@/lib/stores';
import { formatRelativeTime } from '@/lib/utils/helpers';
import { ROUTES, SUCCESS_MESSAGES, ERROR_MESSAGES, CLOUD_PROVIDERS, AUTH_TYPES } from '@/lib/utils/constants';

interface InstanceListItemProps {
  instance: Instance;
  onDelete?: () => void;
}

const statusConfig = {
  active: {
    color: 'bg-status-success',
    glow: 'shadow-[0_0_8px_hsl(var(--status-success)/0.5)]',
    label: 'Active',
  },
  inactive: {
    color: 'bg-muted-foreground/50',
    glow: '',
    label: 'Inactive',
  },
  error: {
    color: 'bg-status-error',
    glow: 'shadow-[0_0_8px_hsl(var(--status-error)/0.5)]',
    label: 'Error',
  },
};

export function InstanceListItem({ instance, onDelete }: InstanceListItemProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { connect } = useSessionStore();
  const { deleteInstance, updateInstance } = useInstanceStore();

  // Form state for editing
  const [formData, setFormData] = useState({
    name: instance.name,
    host: instance.host,
    port: instance.port,
    username: instance.username,
    provider: instance.provider,
    authType: instance.authType,
    credential: '',
    tags: instance.tags?.join(', ') || '',
  });

  const status = statusConfig[instance.status as keyof typeof statusConfig] || statusConfig.inactive;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const session = await connect({ instanceId: instance.id });
      toast.success(SUCCESS_MESSAGES.CONNECTION_SUCCESS);
      router.push(`${ROUTES.DESKTOP}/${session.sessionId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.CONNECTION_FAILED;
      toast.error(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInstance(instance.id);
      toast.success(SUCCESS_MESSAGES.INSTANCE_DELETED);
      onDelete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.DELETE_FAILED;
      toast.error(message);
    }
  };

  const handleOpenConfig = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({
      name: instance.name,
      host: instance.host,
      port: instance.port,
      username: instance.username,
      provider: instance.provider,
      authType: instance.authType,
      credential: '',
      tags: instance.tags?.join(', ') || '',
    });
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const updateData: UpdateInstanceData = {
        name: formData.name,
        host: formData.host,
        port: formData.port,
        username: formData.username,
        provider: formData.provider,
        authType: formData.authType,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      if (formData.credential) {
        updateData.credential = formData.credential;
      }

      await updateInstance(instance.id, updateData);
      toast.success(SUCCESS_MESSAGES.INSTANCE_UPDATED);
      setShowConfigModal(false);
      onDelete?.(); // Refresh the list
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update instance';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="border border-border/50 rounded-lg overflow-hidden transition-all duration-200 hover:border-border">
        {/* Main row */}
        <div
          className="grid grid-cols-12 gap-4 items-center p-3 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Status */}
          <div className="col-span-1 flex justify-center">
            <div className="relative">
              <div
                className={`w-2.5 h-2.5 rounded-full ${status.color} ${status.glow} ${
                  instance.status === 'active' ? 'animate-pulse' : ''
                }`}
              />
              {instance.status === 'active' && (
                <div className="absolute inset-0 rounded-full bg-status-success animate-connection-ring" />
              )}
            </div>
          </div>

          {/* Name & Host */}
          <div className="col-span-4 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{instance.name}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {instance.host}:{instance.port}
            </p>
          </div>

          {/* Provider */}
          <div className="col-span-2 hidden md:block">
            <span className="text-xs text-muted-foreground capitalize px-2 py-1 rounded bg-muted/50">
              {instance.provider}
            </span>
          </div>

          {/* Last Connected */}
          <div className="col-span-2 hidden lg:block">
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(instance.lastConnectedAt)}
            </p>
          </div>

          {/* Actions */}
          <div className="col-span-3 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleConnect();
              }}
              disabled={isConnecting}
              className={`${
                instance.status === 'active'
                  ? 'text-status-success hover:bg-status-success/10 animate-glow-pulse'
                  : ''
              }`}
            >
              <Play className={`w-4 h-4 ${isConnecting ? 'animate-pulse' : ''}`} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenConfig}
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-status-error hover:bg-status-error/10"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && <InstanceExpandedDetails instance={instance} />}
      </div>

      {/* Config Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Instance Configuration"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Instance name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Host</label>
              <Input
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="IP or hostname"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Port</label>
              <Input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 22 })}
                placeholder="22"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Username</label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="SSH username"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Provider</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as 'ec2' | 'oci' })}
                className="w-full h-10 px-3 rounded-md bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(CLOUD_PROVIDERS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Auth Type</label>
              <select
                value={formData.authType}
                onChange={(e) => setFormData({ ...formData, authType: e.target.value as 'key' | 'password' })}
                className="w-full h-10 px-3 rounded-md bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(AUTH_TYPES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">
              {formData.authType === 'key' ? 'SSH Private Key' : 'Password'} (leave empty to keep current)
            </label>
            {formData.authType === 'key' ? (
              <textarea
                value={formData.credential}
                onChange={(e) => setFormData({ ...formData, credential: e.target.value })}
                placeholder="-----BEGIN RSA PRIVATE KEY-----"
                className="w-full h-24 px-3 py-2 rounded-md bg-muted border border-border text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            ) : (
              <Input
                type="password"
                value={formData.credential}
                onChange={(e) => setFormData({ ...formData, credential: e.target.value })}
                placeholder="Leave empty to keep current"
              />
            )}
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Tags (comma-separated)</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="production, web-server"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={isSaving}>
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
