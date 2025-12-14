'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, CheckCircle, Loader2, XCircle, Lock, Shield } from 'lucide-react';
import { Modal, Button, Select, Input } from '@/components/ui';
import { useSessionStore, toast } from '@/lib/stores';
import { ROUTES, DESKTOP_ENVIRONMENTS, SUCCESS_MESSAGES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/helpers';
import type { DesktopEnvironment, ConnectionStep } from '@/lib/types';

interface ConnectModalProps {
  isOpen: boolean;
  instanceId: string | null;
  initialDesktopEnvironment?: DesktopEnvironment;
  onClose: () => void;
}

export function ConnectModal({
  isOpen,
  instanceId,
  initialDesktopEnvironment = 'xfce',
  onClose,
}: ConnectModalProps) {
  const router = useRouter();
  const { connect, connectionProgress, isConnecting, resetConnectionProgress } = useSessionStore();
  const [desktopEnvironment, setDesktopEnvironment] = useState<DesktopEnvironment>(initialDesktopEnvironment);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsStarted(false);
      setPassword('');
      setPasswordError('');
      resetConnectionProgress();
    }
  }, [isOpen, resetConnectionProgress]);

  const handleConnect = async () => {
    if (!instanceId) return;

    if (!password) {
      setPasswordError('Password is required to decrypt credentials');
      return;
    }

    setIsStarted(true);
    setPasswordError('');
    try {
      const sessionInfo = await connect({
        instanceId,
        desktopEnvironment,
        password,
      });
      toast.success(SUCCESS_MESSAGES.CONNECTION_SUCCESS);
      onClose();
      router.push(ROUTES.DESKTOP(sessionInfo.sessionId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      if (message.toLowerCase().includes('decrypt') || message.toLowerCase().includes('password')) {
        setPasswordError('Incorrect password. Please try again.');
        setIsStarted(false);
      } else {
        toast.error(message);
      }
    }
  };

  const desktopOptions = Object.entries(DESKTOP_ENVIRONMENTS).map(([value, info]) => ({
    value,
    label: info.label,
  }));

  const getStepIcon = (step: ConnectionStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-status-success" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-foreground animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-status-error" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-border" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect to Instance"
      size="md"
      closeOnOverlayClick={!isConnecting}
    >
      {!isStarted ? (
        <>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg mb-6">
            <Monitor className="w-8 h-8 text-foreground" />
            <div>
              <p className="font-medium text-foreground">Remote Desktop Connection</p>
              <p className="text-sm text-muted-foreground">
                Enter your password and select desktop environment
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-status-info/5 border border-status-info/20">
              <Shield className="w-5 h-5 text-status-info flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Your credentials are encrypted with your account password. Enter your password to decrypt and connect securely.
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

            <Select
              label="Desktop Environment"
              options={desktopOptions}
              value={desktopEnvironment}
              onChange={(e) => setDesktopEnvironment(e.target.value as DesktopEnvironment)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={!password}>
              Connect
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {connectionProgress.steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors',
                  step.status === 'in-progress' && 'bg-muted',
                  step.status === 'completed' && 'bg-status-success/5',
                  step.status === 'error' && 'bg-status-error/5'
                )}
              >
                {getStepIcon(step)}
                <span
                  className={cn(
                    'text-sm',
                    step.status === 'pending' && 'text-muted-foreground',
                    step.status === 'in-progress' && 'text-foreground font-medium',
                    step.status === 'completed' && 'text-status-success',
                    step.status === 'error' && 'text-status-error'
                  )}
                >
                  {step.message}
                </span>
              </div>
            ))}
          </div>

          {connectionProgress.error && (
            <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-lg mb-6">
              <p className="text-sm text-status-error">{connectionProgress.error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isConnecting}
            >
              {connectionProgress.error ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
