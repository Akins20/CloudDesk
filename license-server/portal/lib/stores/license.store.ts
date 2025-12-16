'use client';

import { create } from 'zustand';
import api, { ApiResponse } from '@/lib/api/client';

export interface License {
  id: string;
  keyPreview: string;
  tier: 'community' | 'team' | 'enterprise';
  status: 'active' | 'revoked' | 'expired' | 'suspended';
  expiresAt: string | null;
  createdAt: string;
  metadata: {
    lastValidatedAt?: string;
    validationCount: number;
  };
}

export interface Subscription {
  id: string;
  tier: 'team' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  billingCycle: 'monthly' | 'yearly';
}

interface LicenseState {
  licenses: License[];
  subscription: Subscription | null;
  isLoading: boolean;

  // Actions
  fetchLicenses: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  createCheckout: (tier: 'team' | 'enterprise', billingCycle: 'monthly' | 'yearly') => Promise<string>;
  openBillingPortal: () => Promise<string>;
}

export const useLicenseStore = create<LicenseState>((set) => ({
  licenses: [],
  subscription: null,
  isLoading: false,

  fetchLicenses: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<ApiResponse<{ licenses: License[] }>>('/customers/licenses');

      if (response.data.success && response.data.data) {
        set({ licenses: response.data.data.licenses, isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchSubscription: async () => {
    try {
      const response = await api.get<ApiResponse<{ subscription: Subscription | null }>>(
        '/subscriptions/current'
      );

      if (response.data.success && response.data.data) {
        set({ subscription: response.data.data.subscription });
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  },

  createCheckout: async (tier: 'team' | 'enterprise', billingCycle: 'monthly' | 'yearly') => {
    const response = await api.post<ApiResponse<{ checkoutUrl: string }>>(
      '/subscriptions/checkout',
      { tier, billingCycle }
    );

    if (response.data.success && response.data.data) {
      return response.data.data.checkoutUrl;
    }

    throw new Error(response.data.error?.message || 'Failed to create checkout');
  },

  openBillingPortal: async () => {
    const response = await api.post<ApiResponse<{ portalUrl: string }>>('/subscriptions/portal');

    if (response.data.success && response.data.data) {
      return response.data.data.portalUrl;
    }

    throw new Error(response.data.error?.message || 'Failed to open billing portal');
  },
}));
