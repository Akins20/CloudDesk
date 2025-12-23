'use client';

import { useEffect, useState } from 'react';
import { Button, toast } from '@/components/ui';
import { useLicenseStore } from '@/lib/stores/license.store';

const PRICING = {
  team: { monthly: 99, yearly: 990 },
  enterprise: { monthly: 299, yearly: 2990 },
};

export default function BillingPage() {
  const { subscription, fetchSubscription, createCheckout, openBillingPortal, isLoading } = useLicenseStore();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleSubscribe = async (tier: 'team' | 'enterprise', billingCycle: 'monthly' | 'yearly') => {
    setCheckoutLoading(true);
    try {
      const checkoutUrl = await createCheckout(tier, billingCycle);
      window.location.href = checkoutUrl;
    } catch (error) {
      toast({
        title: 'Failed to create checkout',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const portalUrl = await openBillingPortal();
      window.location.href = portalUrl;
    } catch (error) {
      toast({
        title: 'Failed to open billing portal',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'past_due':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Billing</h1>
        <p className="text-white/60">
          Manage your subscription and billing information.
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Current Subscription</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusStyles(subscription.status)}`}>
              {subscription.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-white capitalize">{subscription.tier}</span>
                <span className="text-sm text-white/50">
                  {subscription.billingCycle === 'yearly' ? 'Annual' : 'Monthly'} billing
                </span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 mb-2">
                  Cancels at period end
                </span>
              )}
              <p className="text-sm text-white/50">
                Current period ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <Button
              onClick={handleManageBilling}
              isLoading={portalLoading}
              className="bg-white/10 border border-white/20 hover:bg-white/20"
            >
              Manage Subscription
            </Button>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">
            {subscription ? 'Change Plan' : 'Choose a Plan'}
          </h2>
          <p className="text-sm text-white/50">
            {subscription
              ? 'Upgrade or downgrade your subscription'
              : 'Get started with a CloudDesk subscription'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Team Plan */}
          <div className={`rounded-xl p-6 transition-all ${
            subscription?.tier === 'team'
              ? 'bg-blue-500/10 border-2 border-blue-500/50'
              : 'bg-white/5 border border-white/10 hover:bg-white/10'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Team</h3>
              {subscription?.tier === 'team' && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                  Current Plan
                </span>
              )}
            </div>
            <p className="text-sm text-white/50 mb-4">For growing teams</p>

            <div className="mb-1">
              <span className="text-3xl font-bold text-white">{formatPrice(PRICING.team.monthly)}</span>
              <span className="text-white/50">/month</span>
            </div>
            <p className="text-sm text-white/40 mb-6">
              or {formatPrice(PRICING.team.yearly)}/year (save 17%)
            </p>

            <ul className="space-y-3 mb-6">
              {[
                'Up to 25 users',
                'Up to 50 instances',
                '10 concurrent sessions',
                'Priority email support',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-white/70">
                  <CheckIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => handleSubscribe('team', 'monthly')}
                isLoading={checkoutLoading}
                disabled={subscription?.tier === 'team'}
              >
                {subscription?.tier === 'team' ? 'Current Plan' : 'Subscribe Monthly'}
              </Button>
              <Button
                className="w-full border-white/20"
                variant="outline"
                onClick={() => handleSubscribe('team', 'yearly')}
                isLoading={checkoutLoading}
                disabled={subscription?.tier === 'team'}
              >
                Subscribe Yearly
              </Button>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className={`rounded-xl p-6 transition-all ${
            subscription?.tier === 'enterprise'
              ? 'bg-purple-500/10 border-2 border-purple-500/50'
              : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-purple-500/30'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Enterprise</h3>
              {subscription?.tier === 'enterprise' ? (
                <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                  Current Plan
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  Popular
                </span>
              )}
            </div>
            <p className="text-sm text-white/50 mb-4">For large organizations</p>

            <div className="mb-1">
              <span className="text-3xl font-bold text-white">{formatPrice(PRICING.enterprise.monthly)}</span>
              <span className="text-white/50">/month</span>
            </div>
            <p className="text-sm text-white/40 mb-6">
              or {formatPrice(PRICING.enterprise.yearly)}/year (save 17%)
            </p>

            <ul className="space-y-3 mb-6">
              {[
                'Unlimited users',
                'Unlimited instances',
                'Unlimited sessions',
                '24/7 dedicated support',
                'SLA guarantee',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-white/70">
                  <CheckIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0"
                onClick={() => handleSubscribe('enterprise', 'monthly')}
                isLoading={checkoutLoading}
                disabled={subscription?.tier === 'enterprise'}
              >
                {subscription?.tier === 'enterprise' ? 'Current Plan' : 'Subscribe Monthly'}
              </Button>
              <Button
                className="w-full border-white/20"
                variant="outline"
                onClick={() => handleSubscribe('enterprise', 'yearly')}
                isLoading={checkoutLoading}
                disabled={subscription?.tier === 'enterprise'}
              >
                Subscribe Yearly
              </Button>
            </div>
          </div>
        </div>

        {/* Free Tier Info */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400">&#10003;</span>
            </div>
            <h4 className="font-medium text-white">Community (Free)</h4>
          </div>
          <p className="text-sm text-white/50 ml-11">
            No subscription required for basic usage: up to 5 users, 10 instances, and 3 concurrent sessions.
          </p>
        </div>
      </div>

      {/* Payment Methods & Invoices */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <CreditCardIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Payment Methods</h3>
              <p className="text-sm text-white/50">Manage cards and payment options</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleManageBilling}
            isLoading={portalLoading}
            className="w-full border-white/20"
          >
            Manage Payment Methods
          </Button>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <ReceiptIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Invoices</h3>
              <p className="text-sm text-white/50">View and download past invoices</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleManageBilling}
            isLoading={portalLoading}
            className="w-full border-white/20"
          >
            View Invoices
          </Button>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    </svg>
  );
}
