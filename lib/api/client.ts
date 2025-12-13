import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import {
  API_BASE_URL,
  API_ENDPOINTS,
  TIMEOUTS,
  ERROR_MESSAGES,
  ROUTES,
} from '@/lib/utils/constants';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isTokenExpired,
  getTokenExpiry,
} from '@/lib/utils/helpers';
import type { ApiResponse, AuthTokens } from '@/lib/types';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUTS.API_REQUEST,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

// Process queued requests after token refresh
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Refresh tokens
const refreshTokens = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post<ApiResponse<AuthTokens>>(
    `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
    { refreshToken }
  );

  if (response.data.success && response.data.data) {
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    setTokens(accessToken, newRefreshToken);
    return accessToken;
  }

  throw new Error('Failed to refresh token');
};

// Request interceptor - attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token) {
      // Check if token is about to expire and we should preemptively refresh
      const expiry = getTokenExpiry(token);
      if (expiry && expiry - Date.now() < TIMEOUTS.TOKEN_REFRESH_BUFFER && !isRefreshing) {
        // Token is about to expire, trigger refresh in background
        // But still use current token for this request
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 and refresh tokens
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh endpoint itself
      if (originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH)) {
        clearTokens();
        window.location.href = ROUTES.LOGIN;
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise<AxiosResponse>((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err: Error) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshTokens();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearTokens();
        window.location.href = ROUTES.LOGIN;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Transform error response
    const apiError = transformError(error);
    return Promise.reject(apiError);
  }
);

// Transform axios error to consistent format
function transformError(error: AxiosError<ApiResponse>): Error {
  if (error.response) {
    // Server responded with error
    const data = error.response.data;
    const message =
      data?.error?.message ||
      getErrorMessageByStatus(error.response.status);
    const transformedError = new Error(message);
    (transformedError as Error & { code?: string; status?: number }).code =
      data?.error?.code || String(error.response.status);
    (transformedError as Error & { status?: number }).status =
      error.response.status;
    return transformedError;
  }

  if (error.request) {
    // Request made but no response
    return new Error(ERROR_MESSAGES.NETWORK_ERROR);
  }

  // Something else went wrong
  return new Error(error.message || ERROR_MESSAGES.SERVER_ERROR);
}

// Get error message by HTTP status
function getErrorMessageByStatus(status: number): string {
  switch (status) {
    case 400:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 500:
    default:
      return ERROR_MESSAGES.SERVER_ERROR;
  }
}

// API helper methods
export const api = {
  get: <T>(url: string, config?: InternalAxiosRequestConfig) =>
    apiClient.get<ApiResponse<T>>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) =>
    apiClient.post<ApiResponse<T>>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) =>
    apiClient.put<ApiResponse<T>>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) =>
    apiClient.patch<ApiResponse<T>>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: InternalAxiosRequestConfig) =>
    apiClient.delete<ApiResponse<T>>(url, config).then((res) => res.data),
};

export default apiClient;
