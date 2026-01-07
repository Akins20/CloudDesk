import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { buildQueryString } from '@/lib/utils/helpers';
import type {
  Instance,
  CreateInstanceData,
  UpdateInstanceData,
  InstanceQuery,
  TestConnectionResult,
  PaginatedResponse,
  OSInfo,
  PreflightResult,
  DryRunResult,
  SoftwareTemplate,
  InstallSoftwareResult,
  DirectoryListing,
  TransferResult,
  DatabaseInfo,
  DatabaseConnection,
  QueryResult,
  TableSchema,
  PortForward,
  CreatePortForwardData,
} from '@/lib/types';

export const instanceService = {
  async getInstances(query?: InstanceQuery): Promise<PaginatedResponse<Instance>> {
    const queryString = query ? buildQueryString(query) : '';
    // The API returns { success, data: Instance[], pagination } directly
    const response = await api.get<Instance[]>(
      `${API_ENDPOINTS.INSTANCES.BASE}${queryString}`
    );
    // The response IS the PaginatedResponse (success, data, pagination at same level)
    const paginatedResponse = response as unknown as PaginatedResponse<Instance>;
    if (paginatedResponse.success && paginatedResponse.data) {
      return paginatedResponse;
    }
    throw new Error((response as unknown as { error?: { message: string } }).error?.message || 'Failed to fetch instances');
  },

  async getInstance(id: string): Promise<Instance> {
    const response = await api.get<Instance>(API_ENDPOINTS.INSTANCES.BY_ID(id));
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch instance');
  },

  async createInstance(data: CreateInstanceData): Promise<Instance> {
    const response = await api.post<Instance>(API_ENDPOINTS.INSTANCES.BASE, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to create instance');
  },

  async updateInstance(id: string, data: UpdateInstanceData): Promise<Instance> {
    const response = await api.put<Instance>(API_ENDPOINTS.INSTANCES.BY_ID(id), data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to update instance');
  },

  async deleteInstance(id: string): Promise<void> {
    const response = await api.delete<void>(API_ENDPOINTS.INSTANCES.BY_ID(id));
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete instance');
    }
  },

  async testConnection(id: string): Promise<TestConnectionResult> {
    const response = await api.post<TestConnectionResult>(
      API_ENDPOINTS.INSTANCES.TEST_CONNECTION(id)
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to test connection');
  },

  // ========== Instance Features ==========

  async getOSInfo(id: string): Promise<OSInfo> {
    const response = await api.get<OSInfo>(API_ENDPOINTS.INSTANCES.OS_INFO(id));
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to get OS info');
  },

  async runPreflightCheck(id: string, password: string): Promise<PreflightResult> {
    const response = await api.post<PreflightResult>(
      API_ENDPOINTS.INSTANCES.PREFLIGHT(id),
      { password }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to run preflight check');
  },

  async dryRunProvisioning(id: string, password: string, desktopEnvironment: string = 'xfce'): Promise<DryRunResult> {
    const response = await api.post<DryRunResult>(
      API_ENDPOINTS.INSTANCES.DRY_RUN(id),
      { password, desktopEnvironment }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to run dry-run provisioning');
  },

  async getSoftwareTemplates(id: string): Promise<SoftwareTemplate[]> {
    const response = await api.get<SoftwareTemplate[]>(
      API_ENDPOINTS.INSTANCES.SOFTWARE_TEMPLATES(id)
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to get software templates');
  },

  async installSoftware(id: string, templateId: string, password: string): Promise<InstallSoftwareResult> {
    // Use longer timeout for software installation (10 minutes)
    const response = await api.post<InstallSoftwareResult>(
      API_ENDPOINTS.INSTANCES.INSTALL_SOFTWARE(id),
      { templateId, password },
      { timeout: 600000 } as never
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to install software');
  },

  // ========== SFTP File Operations ==========

  async listDirectory(id: string, password: string, path: string = '~'): Promise<DirectoryListing> {
    const response = await api.post<DirectoryListing>(
      API_ENDPOINTS.INSTANCES.FILES_LIST(id),
      { password, path }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to list directory');
  },

  async downloadFile(id: string, password: string, remotePath: string): Promise<Blob> {
    const response = await api.post<{ data: string; size: number; filename: string }>(
      API_ENDPOINTS.INSTANCES.FILES_DOWNLOAD(id),
      { password, remotePath }
    );
    if (response.success && response.data) {
      // Convert base64 to blob
      const byteCharacters = atob(response.data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray]);
    }
    throw new Error(response.error?.message || 'Failed to download file');
  },

  async uploadFile(id: string, password: string, remotePath: string, content: string): Promise<TransferResult> {
    const response = await api.post<TransferResult>(
      API_ENDPOINTS.INSTANCES.FILES_UPLOAD(id),
      { password, remotePath, content }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to upload file');
  },

  async deleteFile(id: string, password: string, remotePath: string, recursive: boolean = false): Promise<void> {
    const response = await api.post<void>(
      API_ENDPOINTS.INSTANCES.FILES_DELETE(id),
      { password, remotePath, recursive }
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete file');
    }
  },

  async createDirectory(id: string, password: string, remotePath: string): Promise<void> {
    const response = await api.post<void>(
      API_ENDPOINTS.INSTANCES.FILES_MKDIR(id),
      { password, remotePath }
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create directory');
    }
  },

  // ========== Database GUI Operations ==========

  async detectDatabases(id: string, password: string): Promise<DatabaseInfo[]> {
    const response = await api.post<DatabaseInfo[]>(
      API_ENDPOINTS.INSTANCES.DATABASE_DETECT(id),
      { password }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to detect databases');
  },

  async listDatabases(id: string, password: string, connection: DatabaseConnection): Promise<string[]> {
    const response = await api.post<string[]>(
      API_ENDPOINTS.INSTANCES.DATABASE_LIST(id),
      { password, connection }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to list databases');
  },

  async listTables(id: string, password: string, connection: DatabaseConnection): Promise<string[]> {
    const response = await api.post<string[]>(
      API_ENDPOINTS.INSTANCES.DATABASE_TABLES(id),
      { password, connection }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to list tables');
  },

  async getTableSchema(id: string, password: string, connection: DatabaseConnection, tableName: string): Promise<TableSchema> {
    const response = await api.post<TableSchema>(
      API_ENDPOINTS.INSTANCES.DATABASE_SCHEMA(id),
      { password, connection, tableName }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to get table schema');
  },

  async executeQuery(id: string, password: string, connection: DatabaseConnection, query: string): Promise<QueryResult> {
    const response = await api.post<QueryResult>(
      API_ENDPOINTS.INSTANCES.DATABASE_QUERY(id),
      { password, connection, query },
      { timeout: 60000 } as never // 1 minute timeout for queries
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to execute query');
  },

  // ========== Port Forwarding Operations ==========

  async createPortForward(id: string, password: string, config: CreatePortForwardData): Promise<PortForward> {
    const response = await api.post<PortForward>(
      API_ENDPOINTS.INSTANCES.PORT_FORWARD_CREATE(id),
      { password, ...config }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to create port forward');
  },

  async stopPortForward(id: string, forwardId: string): Promise<void> {
    const response = await api.post<void>(
      API_ENDPOINTS.INSTANCES.PORT_FORWARD_STOP(id, forwardId),
      {}
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to stop port forward');
    }
  },

  async listPortForwards(id: string): Promise<PortForward[]> {
    const response = await api.get<PortForward[]>(
      API_ENDPOINTS.INSTANCES.PORT_FORWARD_LIST(id)
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to list port forwards');
  },

  async getAvailablePort(id: string): Promise<number> {
    const response = await api.get<{ port: number }>(
      API_ENDPOINTS.INSTANCES.PORT_FORWARD_AVAILABLE_PORT(id)
    );
    if (response.success && response.data) {
      return response.data.port;
    }
    throw new Error(response.error?.message || 'Failed to get available port');
  },
};
