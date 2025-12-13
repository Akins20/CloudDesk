'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/utils/constants';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface UIState {
  sidebarCollapsed: boolean;
  toasts: Toast[];
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  sidebarCollapsed: false,
  toasts: [],
  isModalOpen: false,
  modalContent: null,
};

let toastIdCounter = 0;

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),

      addToast: (toast: Omit<Toast, 'id'>) => {
        const id = `toast_${++toastIdCounter}_${Date.now()}`;
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));
        return id;
      },

      removeToast: (id: string) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      clearToasts: () => set({ toasts: [] }),

      openModal: (content: React.ReactNode) =>
        set({ isModalOpen: true, modalContent: content }),

      closeModal: () => set({ isModalOpen: false, modalContent: null }),
    }),
    {
      name: STORAGE_KEYS.SIDEBAR_COLLAPSED,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Toast helper functions
export const toast = {
  success: (message: string, duration?: number) =>
    useUIStore.getState().addToast({ type: 'success', message, duration }),
  error: (message: string, duration?: number) =>
    useUIStore.getState().addToast({ type: 'error', message, duration }),
  warning: (message: string, duration?: number) =>
    useUIStore.getState().addToast({ type: 'warning', message, duration }),
  info: (message: string, duration?: number) =>
    useUIStore.getState().addToast({ type: 'info', message, duration }),
};
