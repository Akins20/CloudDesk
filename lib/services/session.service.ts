import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { buildQueryString } from '@/lib/utils/helpers';
import type {
  Session,
  SessionInfo,
  SessionStats,
  ConnectSessionData,
  PaginatedResponse,
  PaginationQuery,
} from '@/lib/types';

export const sessionService = {
  async getSessions(query?: PaginationQuery): Promise<Session[]> {
    const queryString = query ? buildQueryString(query) : '';
    const response = await api.get<Session[]>(
      `${API_ENDPOINTS.SESSIONS.BASE}${queryString}`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch sessions');
  },

  async getSession(id: string): Promise<Session> {
    const response = await api.get<Session>(API_ENDPOINTS.SESSIONS.BY_ID(id));
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch session');
  },

  async connect(data: ConnectSessionData): Promise<SessionInfo> {
    const response = await api.post<SessionInfo>(API_ENDPOINTS.SESSIONS.CONNECT, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to connect to instance');
  },

  async disconnect(id: string): Promise<void> {
    const response = await api.post<void>(API_ENDPOINTS.SESSIONS.DISCONNECT(id));
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to disconnect session');
    }
  },

  async getStats(): Promise<SessionStats> {
    const response = await api.get<SessionStats>(API_ENDPOINTS.SESSIONS.STATS);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch session stats');
  },

  async getActiveSessions(): Promise<Session[]> {
    const response = await api.get<Session[]>(API_ENDPOINTS.SESSIONS.ACTIVE);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch active sessions');
  },

  async getSessionHistory(query?: { limit?: number; offset?: number; status?: string }): Promise<Session[]> {
    const params = new URLSearchParams();
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());
    if (query?.status) params.append('status', query.status);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const response = await api.get<Session[]>(`${API_ENDPOINTS.SESSIONS.HISTORY}${queryString}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch session history');
  },

  async disconnectAll(): Promise<{ disconnectedCount: number }> {
    const response = await api.post<{ message: string; disconnectedCount: number }>(
      API_ENDPOINTS.SESSIONS.DISCONNECT_ALL
    );
    if (response.success && response.data) {
      return { disconnectedCount: response.data.disconnectedCount };
    }
    throw new Error(response.error?.message || 'Failed to disconnect all sessions');
  },
};
