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
  async getSessions(query?: PaginationQuery): Promise<PaginatedResponse<Session>> {
    const queryString = query ? buildQueryString(query) : '';
    const response = await api.get<PaginatedResponse<Session>>(
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
    const response = await this.getSessions({ limit: 100 });
    return response.data.filter((session) => session.isActive);
  },
};
