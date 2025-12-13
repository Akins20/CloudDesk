import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import { setTokens, clearTokens } from '@/lib/utils/helpers';
import type {
  User,
  LoginData,
  RegisterData,
  AuthResponse,
  ChangePasswordData,
} from '@/lib/types';

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
    if (response.success && response.data) {
      setTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    }
    throw new Error(response.error?.message || 'Login failed');
  },

  async register(data: RegisterData): Promise<void> {
    const response = await api.post<void>(API_ENDPOINTS.AUTH.REGISTER, data);
    if (!response.success) {
      throw new Error(response.error?.message || 'Registration failed');
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post<void>(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      clearTokens();
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>(API_ENDPOINTS.AUTH.ME);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to get user');
  },

  async changePassword(data: ChangePasswordData): Promise<void> {
    const response = await api.post<void>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to change password');
    }
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await api.post<{ accessToken: string; refreshToken: string }>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );
    if (response.success && response.data) {
      setTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to refresh token');
  },
};
