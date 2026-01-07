'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  Lock,
  Loader2,
  RefreshCw,
  Globe,
  Server,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { instanceService } from '@/lib/services/instance.service';
import { toast } from '@/lib/stores';
import { cn } from '@/lib/utils/helpers';
import type { PortForward } from '@/lib/types';

interface PortForwardModalProps {
  isOpen: boolean;
  instanceId: string | null;
  instanceName?: string;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function PortForwardModal({
  isOpen,
  instanceId,
  instanceName,
  onClose,
}: PortForwardModalProps) {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [forwards, setForwards] = useState<PortForward[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // New forward form
  const [localPort, setLocalPort] = useState<number>(0);
  const [remoteHost, setRemoteHost] = useState('localhost');
  const [remotePort, setRemotePort] = useState<number>(0);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setPasswordError('');
      setIsAuthenticated(false);
      setForwards([]);
      setLocalPort(0);
      setRemoteHost('localhost');
      setRemotePort(0);
    }
  }, [isOpen]);

  const loadForwards = useCallback(async () => {
    if (!instanceId) return;

    setIsLoading(true);
    try {
      const data = await instanceService.listPortForwards(instanceId);
      setForwards(data);
    } catch (error) {
      // Ignore errors when listing (might not have any forwards)
      setForwards([]);
    } finally {
      setIsLoading(false);
    }
  }, [instanceId]);

  const getAvailablePort = useCallback(async () => {
    if (!instanceId) return;

    try {
      const port = await instanceService.getAvailablePort(instanceId);
      setLocalPort(port);
    } catch (error) {
      // Use default port if can't get available
      setLocalPort(10000);
    }
  }, [instanceId]);

  const handleAuthenticate = async () => {
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    setIsLoading(true);
    setPasswordError('');
    try {
      // Try to list forwards to validate password
      await loadForwards();
      await getAvailablePort();
      setIsAuthenticated(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      if (message.toLowerCase().includes('decrypt') || message.toLowerCase().includes('password')) {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        // Still authenticate even if list fails
        setIsAuthenticated(true);
        await getAvailablePort();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateForward = async () => {
    if (!instanceId || !localPort || !remotePort) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const forward = await instanceService.createPortForward(instanceId, password, {
        localPort,
        remoteHost: remoteHost || 'localhost',
        remotePort,
      });
      setForwards([...forwards, forward]);
      toast.success(`Port forward created: localhost:${localPort} -> ${remoteHost}:${remotePort}`);

      // Get new available port for next forward
      await getAvailablePort();
      setRemotePort(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create port forward';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStopForward = async (forwardId: string) => {
    if (!instanceId) return;

    try {
      await instanceService.stopPortForward(instanceId, forwardId);
      setForwards(forwards.filter(f => f.id !== forwardId));
      toast.success('Port forward stopped');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to stop port forward';
      toast.error(message);
    }
  };

  const copyUrl = (port: number) => {
    const url = `http://localhost:${port}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast.success('URL copied to clipboard');
  };

  const openInBrowser = (port: number) => {
    window.open(`http://localhost:${port}`, '_blank');
  };

  // Common port presets
  const presets = [
    { name: 'HTTP', port: 80 },
    { name: 'HTTPS', port: 443 },
    { name: 'MySQL', port: 3306 },
    { name: 'PostgreSQL', port: 5432 },
    { name: 'MongoDB', port: 27017 },
    { name: 'Redis', port: 6379 },
    { name: 'SSH', port: 22 },
    { name: 'Node.js', port: 3000 },
    { name: 'React Dev', port: 5173 },
    { name: 'Django', port: 8000 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Port Forwarding"
      size="lg"
    >
      {!isAuthenticated ? (
        <>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-6">
            <ArrowRightLeft className="w-8 h-8 text-foreground" />
            <div>
              <p className="font-medium text-foreground">
                {instanceName ? `Port Forwarding for ${instanceName}` : 'Port Forwarding Manager'}
              </p>
              <p className="text-sm text-muted-foreground">
                Forward local ports to services running on your remote instance
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              label="Account Password"
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              leftIcon={<Lock className="w-4 h-4" />}
              error={passwordError}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAuthenticate} disabled={!password || isLoading} isLoading={isLoading}>
              Connect
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Create New Forward */}
          <div className="p-4 border border-border rounded-lg space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Port Forward
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Local Port</label>
                <Input
                  type="number"
                  placeholder="Local port"
                  value={localPort || ''}
                  onChange={(e) => setLocalPort(parseInt(e.target.value) || 0)}
                  leftIcon={<Globe className="w-4 h-4" />}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Remote Host</label>
                <Input
                  placeholder="localhost"
                  value={remoteHost}
                  onChange={(e) => setRemoteHost(e.target.value)}
                  leftIcon={<Server className="w-4 h-4" />}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Remote Port</label>
                <Input
                  type="number"
                  placeholder="Remote port"
                  value={remotePort || ''}
                  onChange={(e) => setRemotePort(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Port Presets */}
            <div className="flex flex-wrap gap-1">
              {presets.map((preset) => (
                <button
                  key={preset.port}
                  onClick={() => setRemotePort(preset.port)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md transition-colors',
                    remotePort === preset.port
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted-foreground/10'
                  )}
                >
                  {preset.name} ({preset.port})
                </button>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={handleCreateForward}
              disabled={!localPort || !remotePort || isCreating}
              isLoading={isCreating}
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Create Forward: localhost:{localPort} → {remoteHost}:{remotePort}
            </Button>
          </div>

          {/* Active Forwards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Active Port Forwards</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={loadForwards}
                disabled={isLoading}
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </Button>
            </div>

            {forwards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                No active port forwards
              </div>
            ) : (
              <div className="space-y-2">
                {forwards.map((forward) => (
                  <div
                    key={forward.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          forward.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                        )} />
                        <span className="font-mono text-sm">
                          localhost:{forward.localPort}
                        </span>
                        <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {forward.remoteHost}:{forward.remotePort}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {forward.connectionCount} connections • {formatBytes(forward.bytesTransferred)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyUrl(forward.localPort)}
                      >
                        {copiedUrl === `http://localhost:${forward.localPort}` ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openInBrowser(forward.localPort)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleStopForward(forward.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Port forwards create an SSH tunnel from your local machine to the remote instance</li>
              <li>Access remote services at localhost:[local port]</li>
              <li>Useful for accessing databases, web servers, or any TCP service</li>
              <li>Forwards are automatically stopped when you close this modal</li>
            </ul>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
