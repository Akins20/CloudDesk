'use client';

import { create } from 'zustand';

export type LicenseTier = 'community' | 'team' | 'enterprise';
export type LimitType = 'user' | 'instance' | 'session';

export interface LicenseInfo {
  tier: LicenseTier;
  limits: {
    users: number;
    instances: number;
    sessions: number;
  };
  features: string[];
}

export interface UpgradePrompt {
  isOpen: boolean;
  limitType: LimitType | null;
  currentUsage: number;
  limit: number;
  errorCode?: string;
}

interface LicenseState {
  // License info
  tier: LicenseTier;
  isLoading: boolean;

  // Upgrade modal
  upgradePrompt: UpgradePrompt;

  // Actions
  setTier: (tier: LicenseTier) => void;
  showUpgradeModal: (limitType: LimitType, currentUsage?: number, limit?: number, errorCode?: string | undefined) => void;
  hideUpgradeModal: () => void;
}

// License tier configurations
export const LICENSE_TIERS: Record<LicenseTier, LicenseInfo> = {
  community: {
    tier: 'community',
    limits: {
      users: 5,
      instances: 10,
      sessions: 3,
    },
    features: ['Basic VNC access', 'Community support'],
  },
  team: {
    tier: 'team',
    limits: {
      users: 25,
      instances: 50,
      sessions: 10,
    },
    features: [
      'Advanced VNC features',
      'Priority email support',
      'Advanced analytics',
      'Team management',
    ],
  },
  enterprise: {
    tier: 'enterprise',
    limits: {
      users: Infinity,
      instances: Infinity,
      sessions: Infinity,
    },
    features: [
      'Unlimited resources',
      '24/7 dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Advanced security',
    ],
  },
};

export const useLicenseStore = create<LicenseState>((set) => ({
  tier: 'community',
  isLoading: false,

  upgradePrompt: {
    isOpen: false,
    limitType: null,
    currentUsage: 0,
    limit: 0,
    errorCode: undefined,
  },

  setTier: (tier) => set({ tier }),

  showUpgradeModal: (limitType, currentUsage = 0, limit = 0, errorCode = undefined) =>
    set({
      upgradePrompt: {
        isOpen: true,
        limitType,
        currentUsage,
        limit,
        errorCode,
      },
    }),

  hideUpgradeModal: () =>
    set({
      upgradePrompt: {
        isOpen: false,
        limitType: null,
        currentUsage: 0,
        limit: 0,
        errorCode: undefined,
      },
    }),
}));

// Helper to check if a tier upgrade is needed
export function shouldShowUpgrade(
  currentTier: LicenseTier,
  resourceType: LimitType,
  currentCount: number
): boolean {
  const limits = LICENSE_TIERS[currentTier].limits;
  const limit = resourceType === 'user' ? limits.users :
                resourceType === 'instance' ? limits.instances :
                limits.sessions;
  return currentCount >= limit;
}

// Helper to get next tier
export function getNextTier(currentTier: LicenseTier): LicenseTier | null {
  if (currentTier === 'community') return 'team';
  if (currentTier === 'team') return 'enterprise';
  return null;
}

// License error codes that trigger upgrade modal
export const LICENSE_ERROR_CODES = {
  USER_LIMIT_REACHED: 'USER_LIMIT_REACHED',
  INSTANCE_LIMIT_REACHED: 'INSTANCE_LIMIT_REACHED',
  SESSION_LIMIT_REACHED: 'SESSION_LIMIT_REACHED',
} as const;

export type LicenseErrorCode = typeof LICENSE_ERROR_CODES[keyof typeof LICENSE_ERROR_CODES];
