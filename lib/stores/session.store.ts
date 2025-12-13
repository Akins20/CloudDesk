'use client';

import { create } from 'zustand';
import { sessionService } from '@/lib/services';
import { CONNECTION_STEPS } from '@/lib/utils/constants';
import type {
  Session,
  SessionInfo,
  SessionStats,
  ConnectSessionData,
  ConnectionProgress,
  ConnectionStep,
  PaginationQuery,
} from '@/lib/types';

interface SessionState {
  sessions: Session[];
  activeSessions: Session[];
  currentSession: Session | null;
  sessionInfo: SessionInfo | null;
  stats: SessionStats | null;
  connectionProgress: ConnectionProgress;
  isLoading: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SessionActions {
  fetchSessions: (query?: PaginationQuery) => Promise<void>;
  fetchActiveSessions: () => Promise<void>;
  fetchSession: (id: string) => Promise<Session>;
  connect: (data: ConnectSessionData) => Promise<SessionInfo>;
  disconnect: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  setCurrentSession: (session: Session | null) => void;
  updateConnectionStep: (stepIndex: number, status: ConnectionStep['status']) => void;
  setConnectionError: (error: string) => void;
  resetConnectionProgress: () => void;
  clearError: () => void;
}

type SessionStore = SessionState & SessionActions;

const createInitialConnectionProgress = (): ConnectionProgress => ({
  steps: CONNECTION_STEPS.map((step) => ({
    ...step,
    status: 'pending' as const,
  })),
  currentStep: 0,
});

const initialState: SessionState = {
  sessions: [],
  activeSessions: [],
  currentSession: null,
  sessionInfo: null,
  stats: null,
  connectionProgress: createInitialConnectionProgress(),
  isLoading: false,
  isConnecting: false,
  isDisconnecting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

export const useSessionStore = create<SessionStore>()((set, get) => ({
  ...initialState,

  fetchSessions: async (query?: PaginationQuery) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await sessionService.getSessions(query);
      set({
        sessions,
        pagination: {
          page: 1,
          limit: query?.limit || 10,
          total: sessions.length,
          totalPages: 1,
        },
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch sessions';
      set({ error: message, isLoading: false, sessions: [] });
      throw error;
    }
  },

  fetchActiveSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await sessionService.getActiveSessions();
      set({ activeSessions: sessions, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch active sessions';
      set({ error: message, isLoading: false, activeSessions: [] });
    }
  },

  fetchSession: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await sessionService.getSession(id);
      set({ currentSession: session, isLoading: false });
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch session';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  connect: async (data: ConnectSessionData) => {
    set({
      isConnecting: true,
      error: null,
      connectionProgress: createInitialConnectionProgress(),
    });

    try {
      // Simulate progress through steps
      const updateStep = get().updateConnectionStep;

      // Step 1: Init
      updateStep(0, 'in-progress');
      await new Promise((r) => setTimeout(r, 500));
      updateStep(0, 'completed');

      // Step 2: SSH
      updateStep(1, 'in-progress');
      const sessionInfo = await sessionService.connect(data);

      // Step 3: VNC
      updateStep(1, 'completed');
      updateStep(2, 'in-progress');
      await new Promise((r) => setTimeout(r, 500));
      updateStep(2, 'completed');

      // Step 4: WebSocket
      updateStep(3, 'in-progress');
      await new Promise((r) => setTimeout(r, 500));
      updateStep(3, 'completed');

      // Step 5: Connect
      updateStep(4, 'in-progress');
      await new Promise((r) => setTimeout(r, 300));
      updateStep(4, 'completed');

      set({
        sessionInfo,
        isConnecting: false,
      });

      return sessionInfo;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect';
      get().setConnectionError(message);
      set({ error: message, isConnecting: false });
      throw error;
    }
  },

  disconnect: async (id: string) => {
    set({ isDisconnecting: true, error: null });
    try {
      await sessionService.disconnect(id);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, status: 'disconnected' as const, isActive: false } : s
        ),
        activeSessions: state.activeSessions.filter((s) => s.id !== id),
        currentSession:
          state.currentSession?.id === id
            ? { ...state.currentSession, status: 'disconnected' as const, isActive: false }
            : state.currentSession,
        sessionInfo: null,
        isDisconnecting: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect';
      set({ error: message, isDisconnecting: false });
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const stats = await sessionService.getStats();
      set({ stats });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch stats';
      set({ error: message });
    }
  },

  setCurrentSession: (session: Session | null) => set({ currentSession: session }),

  updateConnectionStep: (stepIndex: number, status: ConnectionStep['status']) => {
    set((state) => ({
      connectionProgress: {
        ...state.connectionProgress,
        currentStep: status === 'in-progress' ? stepIndex : state.connectionProgress.currentStep,
        steps: state.connectionProgress.steps.map((step, idx) =>
          idx === stepIndex ? { ...step, status } : step
        ),
      },
    }));
  },

  setConnectionError: (error: string) => {
    set((state) => ({
      connectionProgress: {
        ...state.connectionProgress,
        error,
        steps: state.connectionProgress.steps.map((step) =>
          step.status === 'in-progress' ? { ...step, status: 'error' as const } : step
        ),
      },
    }));
  },

  resetConnectionProgress: () => {
    set({ connectionProgress: createInitialConnectionProgress() });
  },

  clearError: () => set({ error: null }),
}));
