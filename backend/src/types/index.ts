import { Request } from 'express';

// Auth types
export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload extends TokenPayload {
  version: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

// Instance types
export interface CreateInstanceDTO {
  name: string;
  provider: 'ec2' | 'oci';
  host: string;
  port?: number;
  username: string;
  authType: 'key' | 'password';
  credential: string;
  tags?: string[];
}

export interface UpdateInstanceDTO {
  name?: string;
  provider?: 'ec2' | 'oci';
  host?: string;
  port?: number;
  username?: string;
  authType?: 'key' | 'password';
  credential?: string;
  tags?: string[];
  status?: 'active' | 'inactive';
}

// Session types
export interface ConnectSessionDTO {
  instanceId: string;
  desktopEnvironment?: 'xfce' | 'lxde';
  password: string; // User's account password for decrypting credentials
}

export interface SessionInfo {
  sessionId: string;
  websocketUrl: string;
  vncDisplayNumber: number;
  status: string;
}

export interface VNCInfo {
  displayNumber: number;
  vncPort: number;
  sshTunnelLocalPort: number;
  websocketPort: number;
}

// SSH types
export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  privateKey?: string;
  password?: string;
}

export interface SSHCommandResult {
  stdout: string;
  stderr: string;
  code: number;
}

// Tunnel types
export interface TunnelInfo {
  localPort: number;
  remotePort: number;
  instanceId: string;
  sessionId: string;
  createdAt: Date;
}

// WebSocket types
export interface WSConnectionInfo {
  sessionId: string;
  userId: string;
  tunnelPort: number;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InstanceQuery extends PaginationQuery {
  search?: string;
  provider?: 'ec2' | 'oci';
  status?: 'active' | 'inactive';
  tags?: string | string[];
}

// Authenticated request type
export interface AuthRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

// Connection progress types
export interface ConnectionStep {
  message: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

export interface ConnectionProgress {
  steps: ConnectionStep[];
  currentStep: number;
  error?: string;
}
