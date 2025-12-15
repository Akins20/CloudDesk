import { DesktopEnvironment, Instance } from './instance.types';

export type SessionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface Session {
  id: string;
  userId: string;
  instanceId: string | Instance;
  vncDisplayNumber: number;
  vncPort: number;
  sshTunnelLocalPort: number;
  websocketPort: number;
  status: SessionStatus;
  errorMessage?: string;
  connectionStartedAt?: string;
  connectionEndedAt?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  duration: number | null;
  isOwner?: boolean;
  permissions?: 'view' | 'control';
}

export interface ConnectSessionData {
  instanceId: string;
  desktopEnvironment?: DesktopEnvironment;
  password: string; // User's account password for decrypting credentials
}

export interface SessionInfo {
  sessionId: string;
  websocketUrl: string;
  vncDisplayNumber: number;
  status: SessionStatus;
}

export interface ConnectionStep {
  id: string;
  message: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

export interface ConnectionProgress {
  steps: ConnectionStep[];
  currentStep: number;
  error?: string;
}

export interface SessionStats {
  activeSessions: number;
  totalSessions: number;
  totalDuration: number;
}
