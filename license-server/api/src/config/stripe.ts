import Stripe from 'stripe';
import { env } from './environment';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const STRIPE_PRICES = {
  team: {
    monthly: env.STRIPE_TEAM_MONTHLY_PRICE_ID,
    yearly: env.STRIPE_TEAM_YEARLY_PRICE_ID,
  },
  enterprise: {
    monthly: env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    yearly: env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
  },
} as const;

export function getPriceId(tier: 'team' | 'enterprise', cycle: 'monthly' | 'yearly'): string {
  return STRIPE_PRICES[tier][cycle];
}
