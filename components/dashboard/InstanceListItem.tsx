'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Play, Settings, Trash2, X, Save, Lock, Shield, Activity, Package, Folder, MoreVertical } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Instance, UpdateInstanceData } from '@/lib/types';
import { Button, Input, Modal } from '@/components/ui';
import { InstanceExpandedDetails } from './InstanceExpandedDetails';
import { PreflightCheckModal, SoftwareTemplatesModal, FileBrowserModal } from '@/components/instances';
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [connectPassword, setConnectPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreflightModal, setShowPreflightModal] = useState(false);
  const [showSoftwareModal, setShowSoftwareModal] = useState(false);
  const [showFileBrowserModal, setShowFileBrowserModal] = useState(false);
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

  const handleConnectClick = () => {
    setConnectPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleConnect = async () => {
    if (!connectPassword) {
      setPasswordError('Password is required to decrypt credentials');
      return;
    }

    setIsConnecting(true);
    setPasswordError('');
    try {
      const session = await connect({
        instanceId: instance.id,
        password: connectPassword,
      });
      toast.success(SUCCESS_MESSAGES.CONNECTION_SUCCESS);
      setShowPasswordModal(false);
      setConnectPassword('');
      window.open(ROUTES.DESKTOP(session.sessionId), '_blank');
    } catch (error) {
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.CONNECTION_FAILED;
      if (message.toLowerCase().includes('decrypt') || message.toLowerCase().includes('password')) {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        toast.error(message);
        setShowPasswordModal(false);
      }
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
                handleConnectClick();
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

            {/* Dropdown menu for additional actions */}
            <Menu as="div" className="relative">
              <Menu.Button
                as="div"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-1 w-48 origin-top-right rounded-lg bg-card border border-border shadow-lg focus:outline-none overflow-hidden z-50">
                  <div className="p-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPreflightModal(true);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                            active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          <Activity className="w-4 h-4" />
                          System Check
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSoftwareModal(true);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                            active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          <Package className="w-4 h-4" />
                          Dev Tools
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFileBrowserModal(true);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                            active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          <Folder className="w-4 h-4" />
                          File Browser
                        </button>
                      )}
                    </Menu.Item>
                    <div className="my-1 border-t border-border" />
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                            active ? 'bg-status-error/10 text-status-error' : 'text-muted-foreground'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

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

      {/* Password Modal for Connect */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setConnectPassword('');
          setPasswordError('');
        }}
        title="Enter Password to Connect"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <Shield className="w-5 h-5 text-status-info flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Secure Connection</p>
              <p className="mt-1">
                Your credentials are encrypted with your account password. Enter your password to decrypt and connect.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Account Password
            </label>
            <Input
              type="password"
              placeholder="Enter your account password"
              value={connectPassword}
              onChange={(e) => {
                setConnectPassword(e.target.value);
                setPasswordError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
              leftIcon={<Lock className="w-4 h-4" />}
              error={passwordError}
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowPasswordModal(false);
                setConnectPassword('');
                setPasswordError('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !connectPassword}
              className="flex-1"
            >
              {isConnecting ? (
                <>Connecting...</>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preflight Check Modal */}
      <PreflightCheckModal
        isOpen={showPreflightModal}
        instanceId={instance.id}
        instanceName={instance.name}
        onClose={() => setShowPreflightModal(false)}
      />

      {/* Software Templates Modal */}
      <SoftwareTemplatesModal
        isOpen={showSoftwareModal}
        instanceId={instance.id}
        instanceName={instance.name}
        onClose={() => setShowSoftwareModal(false)}
      />

      {/* File Browser Modal */}
      <FileBrowserModal
        isOpen={showFileBrowserModal}
        instanceId={instance.id}
        instanceName={instance.name}
        onClose={() => setShowFileBrowserModal(false)}
      />
    </>
  );
}
