export type CloudProvider = 'ec2' | 'oci';
export type AuthType = 'key' | 'password';
export type InstanceStatus = 'active' | 'inactive';
export type DesktopEnvironment = 'xfce' | 'lxde';

export interface Instance {
  id: string;
  userId: string;
  name: string;
  provider: CloudProvider;
  host: string;
  port: number;
  username: string;
  authType: AuthType;
  tags: string[];
  vncDisplayNumber?: number;
  vncPort?: number;
  desktopEnvironment?: DesktopEnvironment;
  isVncInstalled: boolean;
  status: InstanceStatus;
  lastConnectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstanceData {
  name: string;
  provider: CloudProvider;
  host: string;
  port?: number;
  username: string;
  authType: AuthType;
  credential: string;
  tags?: string[];
}

export interface UpdateInstanceData {
  name?: string;
  provider?: CloudProvider;
  host?: string;
  port?: number;
  username?: string;
  authType?: AuthType;
  credential?: string;
  tags?: string[];
  status?: InstanceStatus;
}

export interface InstanceQuery {
  search?: string;
  provider?: CloudProvider;
  status?: InstanceStatus;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: {
    osInfo?: string;
    vncInstalled?: boolean;
  };
}

// OS Information
export interface OSInfo {
  distroFamily: string;
  distroName: string;
  distroId: string;
  version: string;
  versionId: string;
  packageManager: string;
  kernel: string;
  architecture: string;
  detectedAt?: string;
}

// Pre-flight Check Results
export interface PreflightResult {
  success: boolean;
  sshConnected: boolean;
  osInfo?: OSInfo;
  systemResources: {
    diskSpaceGB: number;
    memoryMB: number;
    cpuCores: number;
  };
  vncStatus: {
    installed: boolean;
    running: boolean;
    displays: number[];
  };
  desktopStatus: {
    xfceInstalled: boolean;
    lxdeInstalled: boolean;
  };
  sudoAvailable: boolean;
  networkStatus: {
    internetAccess: boolean;
    dnsWorking: boolean;
  };
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

// Dry-Run Provisioning Results
export interface DryRunResult {
  osInfo: OSInfo;
  packagesToInstall: {
    vnc: string[];
    xserver: string[];
    desktop: string[];
  };
  estimatedDiskUsageMB: number;
  estimatedTimeMinutes: number;
  commands: string[];
  warnings: string[];
}

// Dev Software Templates
export interface SoftwareTemplate {
  templateId: string;
  name: string;
  description: string;
  installed: boolean;
  installedAt?: string;
}

export interface InstallSoftwareResult {
  success: boolean;
  templateId: string;
  packagesInstalled: string[];
  postInstallRan: boolean;
  errors: string[];
  duration: number;
}

// SFTP File Operations
export interface FileInfo {
  filename: string;
  path: string;
  size: number;
  modifyTime: string;
  accessTime: string;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
  permissions: string;
  owner: number;
  group: number;
}

export interface DirectoryListing {
  path: string;
  files: FileInfo[];
  totalSize: number;
  fileCount: number;
  directoryCount: number;
}

export interface TransferResult {
  success: boolean;
  filename: string;
  remotePath: string;
  size: number;
  duration: number;
  error?: string;
}

// Database GUI Types
export type DatabaseType = 'mysql' | 'postgresql' | 'mongodb' | 'sqlite' | 'redis';

export interface DatabaseInfo {
  type: DatabaseType;
  name: string;
  version?: string;
  isAvailable: boolean;
  clientPath?: string;
}

export interface DatabaseConnection {
  type: DatabaseType;
  host: string;
  port: number;
  database?: string;
  username?: string;
  password?: string;
}

export interface QueryResult {
  success: boolean;
  data?: Record<string, unknown>[];
  columns?: string[];
  rowCount?: number;
  affectedRows?: number;
  executionTime?: number;
  error?: string;
}

export interface TableSchema {
  columns: {
    name: string;
    type: string;
    nullable: boolean;
  }[];
}

// Port Forwarding Types
export interface PortForward {
  id: string;
  userId: string;
  instanceId: string;
  localPort: number;
  remoteHost: string;
  remotePort: number;
  status: 'active' | 'stopped' | 'error';
  createdAt: string;
  connectionCount: number;
  bytesTransferred: number;
  error?: string;
}

export interface CreatePortForwardData {
  localPort: number;
  remoteHost?: string;
  remotePort: number;
}
