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
};
