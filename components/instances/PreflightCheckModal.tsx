'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Lock,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  Monitor,
  Terminal,
  Info,
} from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { instanceService } from '@/lib/services/instance.service';
import { toast } from '@/lib/stores';
import { cn } from '@/lib/utils/helpers';
import type { PreflightResult } from '@/lib/types';

interface PreflightCheckModalProps {
  isOpen: boolean;
  instanceId: string | null;
  instanceName?: string;
  onClose: () => void;
}

export function PreflightCheckModal({
  isOpen,
  instanceId,
  instanceName,
  onClose,
}: PreflightCheckModalProps) {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PreflightResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setPasswordError('');
      setResult(null);
    }
  }, [isOpen]);

  const handleRunCheck = async () => {
    if (!instanceId) return;

    if (!password) {
      setPasswordError('Password is required to decrypt credentials');
      return;
    }

    setIsLoading(true);
    setPasswordError('');
    try {
      const checkResult = await instanceService.runPreflightCheck(instanceId, password);
      setResult(checkResult);
      if (checkResult.success) {
        toast.success('Pre-flight check passed!');
      } else {
        toast.error('Pre-flight check found issues');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check failed';
      if (message.toLowerCase().includes('decrypt') || message.toLowerCase().includes('password')) {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = ({ success }: { success: boolean }) =>
    success ? (
      <CheckCircle className="w-4 h-4 text-status-success" />
    ) : (
      <XCircle className="w-4 h-4 text-status-error" />
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pre-flight System Check"
      size="lg"
    >
      {!result ? (
        <>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-6">
            <Activity className="w-8 h-8 text-foreground" />
            <div>
              <p className="font-medium text-foreground">
                {instanceName ? `Check ${instanceName}` : 'System Diagnostics'}
              </p>
              <p className="text-sm text-muted-foreground">
                Run comprehensive checks before connecting
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-status-info/5 border border-status-info/20">
              <Info className="w-5 h-5 text-status-info flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                This will check SSH connectivity, OS compatibility, system resources, VNC status, and network connectivity.
              </p>
            </div>

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
            <Button onClick={handleRunCheck} disabled={!password || isLoading} isLoading={isLoading}>
              Run Check
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Overall Status */}
          <div
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg mb-6',
              result.success ? 'bg-status-success/10' : 'bg-status-error/10'
            )}
          >
            {result.success ? (
              <CheckCircle className="w-8 h-8 text-status-success" />
            ) : (
              <XCircle className="w-8 h-8 text-status-error" />
            )}
            <div>
              <p className="font-medium text-foreground">
                {result.success ? 'All Checks Passed' : 'Issues Found'}
              </p>
              <p className="text-sm text-muted-foreground">
                {result.success
                  ? 'Instance is ready for connection'
                  : `${result.errors.length} error(s), ${result.warnings.length} warning(s)`}
              </p>
            </div>
          </div>

          {/* OS Info */}
          {result.osInfo && (
            <div className="p-4 bg-muted rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4" />
                <span className="font-medium text-sm">Operating System</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Distribution:</div>
                <div>{result.osInfo.distroName}</div>
                <div className="text-muted-foreground">Version:</div>
                <div>{result.osInfo.version}</div>
                <div className="text-muted-foreground">Package Manager:</div>
                <div>{result.osInfo.packageManager}</div>
                <div className="text-muted-foreground">Architecture:</div>
                <div>{result.osInfo.architecture}</div>
              </div>
            </div>
          )}

          {/* System Resources */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="w-4 h-4" />
                <span className="text-xs text-muted-foreground">Disk</span>
              </div>
              <p className="font-medium">{result.systemResources.diskSpaceGB} GB</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MemoryStick className="w-4 h-4" />
                <span className="text-xs text-muted-foreground">Memory</span>
              </div>
              <p className="font-medium">{result.systemResources.memoryMB} MB</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-4 h-4" />
                <span className="text-xs text-muted-foreground">CPU Cores</span>
              </div>
              <p className="font-medium">{result.systemResources.cpuCores}</p>
            </div>
          </div>

          {/* Status Checks */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span className="text-sm">VNC Server</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon success={result.vncStatus.installed} />
                <span className="text-xs text-muted-foreground">
                  {result.vncStatus.installed
                    ? result.vncStatus.running
                      ? 'Running'
                      : 'Installed'
                    : 'Not installed'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span className="text-sm">Desktop (XFCE/LXDE)</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon success={result.desktopStatus.xfceInstalled || result.desktopStatus.lxdeInstalled} />
                <span className="text-xs text-muted-foreground">
                  {result.desktopStatus.xfceInstalled
                    ? 'XFCE'
                    : result.desktopStatus.lxdeInstalled
                    ? 'LXDE'
                    : 'Not installed'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="text-sm">Sudo Access</span>
              </div>
              <StatusIcon success={result.sudoAvailable} />
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Internet Access</span>
              </div>
              <StatusIcon success={result.networkStatus.internetAccess} />
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <span className="text-sm">DNS Resolution</span>
              </div>
              <StatusIcon success={result.networkStatus.dnsWorking} />
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-status-error" />
                <span className="font-medium text-sm text-status-error">Errors</span>
              </div>
              <ul className="space-y-1">
                {result.errors.map((error, i) => (
                  <li key={i} className="text-xs text-status-error">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="p-3 bg-status-warning/10 border border-status-warning/20 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-status-warning" />
                <span className="font-medium text-sm text-status-warning">Warnings</span>
              </div>
              <ul className="space-y-1">
                {result.warnings.map((warning, i) => (
                  <li key={i} className="text-xs text-status-warning">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="p-3 bg-status-info/10 border border-status-info/20 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-status-info" />
                <span className="font-medium text-sm text-status-info">Recommendations</span>
              </div>
              <ul className="space-y-1">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setResult(null)}>
              Run Again
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </>
      )}
    </Modal>
  );
}
