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
