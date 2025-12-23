'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { setTokens, clearTokens, getTokens, ApiResponse } from '@/lib/api/client';

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  emailVerified?: boolean;
  createdAt?: string;
}

interface AuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Customer>) => Promise<void>;
  setHasHydrated: (state: boolean) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

interface AuthResponse {
  customer: Customer;
  accessToken: string;
  refreshToken: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      customer: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post<ApiResponse<AuthResponse>>('/customers/login', {
            email,
            password,
          });

          if (response.data.success && response.data.data) {
            const { customer, accessToken, refreshToken } = response.data.data;
            setTokens(accessToken, refreshToken);
            set({ customer, isAuthenticated: true, isLoading: false });
          } else {
            throw new Error(response.data.error?.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await api.post<ApiResponse<AuthResponse>>('/customers/register', data);

          if (response.data.success && response.data.data) {
            const { customer, accessToken, refreshToken } = response.data.data;
            setTokens(accessToken, refreshToken);
            set({ customer, isAuthenticated: true, isLoading: false });
          } else {
            throw new Error(response.data.error?.message || 'Registration failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        clearTokens();
        set({ customer: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        try {
          const response = await api.get<ApiResponse<Customer>>('/customers/profile');

          if (response.data.success && response.data.data) {
            set({ customer: response.data.data, isAuthenticated: true });
          }
        } catch (error) {
          // If profile fetch fails, user is not authenticated
          get().logout();
        }
      },

      updateProfile: async (data: Partial<Customer>) => {
        const response = await api.put<ApiResponse<Customer>>('/customers/profile', data);

        if (response.data.success && response.data.data) {
          set({ customer: response.data.data });
        } else {
          throw new Error(response.data.error?.message || 'Update failed');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        customer: state.customer,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark hydration as complete
        state?.setHasHydrated(true);

        // Restore tokens from localStorage if authenticated
        if (state?.isAuthenticated && typeof window !== 'undefined') {
          const { accessToken, refreshToken } = getTokens();
          if (!accessToken || !refreshToken) {
            // Tokens are missing, clear auth state
            state.logout();
          }
        }
      },
    }
  )
);
