'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Server,
  Play,
  Settings,
  Trash2,
  MoreVertical,
  Cloud,
  Key,
  Lock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Card, StatusBadge, Badge, Button, ConfirmModal } from '@/components/ui';
import { useInstanceStore, useSessionStore, toast } from '@/lib/stores';
import { ROUTES, CLOUD_PROVIDERS, SUCCESS_MESSAGES } from '@/lib/utils/constants';
import { formatRelativeTime, cn } from '@/lib/utils/helpers';
import type { Instance, DesktopEnvironment } from '@/lib/types';

interface InstanceCardProps {
  instance: Instance;
  onConnect?: (instanceId: string, desktopEnvironment: DesktopEnvironment) => void;
}

export function InstanceCard({ instance, onConnect }: InstanceCardProps) {
  const router = useRouter();
  const { deleteInstance, isDeleting } = useInstanceStore();
  const { activeSessions } = useSessionStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const activeSession = activeSessions.find(
    (s) => typeof s.instanceId === 'string'
      ? s.instanceId === instance.id
      : s.instanceId?.id === instance.id
  );

  const handleDelete = async () => {
    try {
      await deleteInstance(instance.id);
      toast.success(SUCCESS_MESSAGES.INSTANCE_DELETED);
      setShowDeleteModal(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete instance';
      toast.error(message);
    }
  };

  const handleConnect = () => {
    if (onConnect) {
      onConnect(instance.id, instance.desktopEnvironment || 'xfce');
    }
  };

  const providerInfo = CLOUD_PROVIDERS[instance.provider] || { label: instance.provider, icon: 'cloud' };

  return (
    <>
      <Card hover className="relative group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Server className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{instance.name}</h3>
              <p className="text-sm text-muted-foreground">{instance.host}</p>
            </div>
          </div>

          <Menu as="div" className="relative">
            <Menu.Button className="p-1 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
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
              <Menu.Items className="absolute right-0 mt-1 w-40 origin-top-right rounded-lg bg-card border border-border shadow-lg focus:outline-none overflow-hidden z-10">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => router.push(ROUTES.INSTANCE_EDIT(instance.id))}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                          active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        <Settings className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                          active ? 'bg-status-error/10 text-status-error' : 'text-muted-foreground'
                        )}
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
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <StatusBadge status={instance.status} />
          <Badge>
            <Cloud className="w-3 h-3 mr-1" />
            {providerInfo.label}
          </Badge>
          <Badge>
            {instance.authType === 'key' ? (
              <Key className="w-3 h-3 mr-1" />
            ) : (
              <Lock className="w-3 h-3 mr-1" />
            )}
            {instance.authType === 'key' ? 'SSH Key' : 'Password'}
          </Badge>
          {instance.isVncInstalled ? (
            <Badge variant="success">
              <Wifi className="w-3 h-3 mr-1" />
              VNC Ready
            </Badge>
          ) : (
            <Badge variant="warning">
              <WifiOff className="w-3 h-3 mr-1" />
              VNC Not Installed
            </Badge>
          )}
        </div>

        {instance.tags && instance.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {instance.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Last connected {formatRelativeTime(instance.lastConnectedAt)}
          </p>
          {activeSession ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push(ROUTES.DESKTOP(activeSession.id))}
            >
              Open Desktop
            </Button>
          ) : (
            <Button
              size="sm"
              leftIcon={<Play className="w-4 h-4" />}
              onClick={handleConnect}
              disabled={!instance.isVncInstalled}
            >
              Connect
            </Button>
          )}
        </div>
      </Card>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Instance"
        message={`Are you sure you want to delete "${instance.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
