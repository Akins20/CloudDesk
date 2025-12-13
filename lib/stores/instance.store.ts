'use client';

import { create } from 'zustand';
import { instanceService } from '@/lib/services';
import type {
  Instance,
  CreateInstanceData,
  UpdateInstanceData,
  InstanceQuery,
  TestConnectionResult,
} from '@/lib/types';

interface InstanceState {
  instances: Instance[];
  currentInstance: Instance | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isTesting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: InstanceQuery;
}

interface InstanceActions {
  fetchInstances: (query?: InstanceQuery) => Promise<void>;
  fetchInstance: (id: string) => Promise<Instance>;
  createInstance: (data: CreateInstanceData) => Promise<Instance>;
  updateInstance: (id: string, data: UpdateInstanceData) => Promise<Instance>;
  deleteInstance: (id: string) => Promise<void>;
  testConnection: (id: string) => Promise<TestConnectionResult>;
  setCurrentInstance: (instance: Instance | null) => void;
  setFilters: (filters: Partial<InstanceQuery>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

type InstanceStore = InstanceState & InstanceActions;

const initialState: InstanceState = {
  instances: [],
  currentInstance: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isTesting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
};

export const useInstanceStore = create<InstanceStore>()((set, get) => ({
  ...initialState,

  fetchInstances: async (query?: InstanceQuery) => {
    set({ isLoading: true, error: null });
    try {
      const mergedQuery = { ...get().filters, ...query };
      const response = await instanceService.getInstances(mergedQuery);
      set({
        instances: response?.data || [],
        pagination: response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch instances';
      set({ error: message, isLoading: false, instances: [] });
    }
  },

  fetchInstance: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const instance = await instanceService.getInstance(id);
      set({ currentInstance: instance, isLoading: false });
      return instance;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch instance';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createInstance: async (data: CreateInstanceData) => {
    set({ isCreating: true, error: null });
    try {
      const instance = await instanceService.createInstance(data);
      set((state) => ({
        instances: [instance, ...state.instances],
        isCreating: false,
      }));
      return instance;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create instance';
      set({ error: message, isCreating: false });
      throw error;
    }
  },

  updateInstance: async (id: string, data: UpdateInstanceData) => {
    set({ isUpdating: true, error: null });
    try {
      const instance = await instanceService.updateInstance(id, data);
      set((state) => ({
        instances: state.instances.map((i) => (i.id === id ? instance : i)),
        currentInstance: state.currentInstance?.id === id ? instance : state.currentInstance,
        isUpdating: false,
      }));
      return instance;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update instance';
      set({ error: message, isUpdating: false });
      throw error;
    }
  },

  deleteInstance: async (id: string) => {
    set({ isDeleting: true, error: null });
    try {
      await instanceService.deleteInstance(id);
      set((state) => ({
        instances: state.instances.filter((i) => i.id !== id),
        currentInstance: state.currentInstance?.id === id ? null : state.currentInstance,
        isDeleting: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete instance';
      set({ error: message, isDeleting: false });
      throw error;
    }
  },

  testConnection: async (id: string) => {
    set({ isTesting: true, error: null });
    try {
      const result = await instanceService.testConnection(id);
      set({ isTesting: false });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection test failed';
      set({ error: message, isTesting: false });
      throw error;
    }
  },

  setCurrentInstance: (instance: Instance | null) => set({ currentInstance: instance }),

  setFilters: (filters: Partial<InstanceQuery>) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () => set({ filters: {} }),

  clearError: () => set({ error: null }),
}));
