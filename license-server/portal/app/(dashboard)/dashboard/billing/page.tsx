'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, toast } from '@/components/ui';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-status-success/20 text-status-success';
      case 'past_due':
        return 'bg-status-warning/20 text-status-warning';
      default:
        return 'bg-status-error/20 text-status-error';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Loading billing information...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-foreground">Billing</h1>
      <p className="text-muted-foreground mb-8">
        Manage your subscription and billing information.
      </p>

      {/* Current Subscription */}
      {subscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your active CloudDesk plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold capitalize text-foreground">{subscription.tier}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.billingCycle === 'yearly' ? 'Annual' : 'Monthly'} billing
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(subscription.status)}`}>
                    {subscription.status.replace('_', ' ')}
                  </span>
                  {subscription.cancelAtPeriodEnd && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-status-warning/20 text-status-warning">
                      Cancels at period end
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Current period ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <Button onClick={handleManageBilling} isLoading={portalLoading}>
                Manage Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>{subscription ? 'Change Plan' : 'Choose a Plan'}</CardTitle>
          <CardDescription>
            {subscription
              ? 'Upgrade or downgrade your subscription'
              : 'Get started with a CloudDesk subscription'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Team Plan */}
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2 text-foreground">Team</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For growing teams
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">{formatPrice(PRICING.team.monthly)}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                or {formatPrice(PRICING.team.yearly)}/year (save 17%)
              </p>
              <ul className="text-sm space-y-2 mb-6">
                <li className="flex items-center gap-2 text-foreground">
                  <CheckIcon /> Up to 25 users
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckIcon /> Up to 50 instances
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckIcon /> 10 concurrent sessions
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckIcon /> Priority email support
                </li>
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
                  className="w-full"
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
            <div className="border rounded-lg p-6 border-primary ring-2 ring-primary">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-foreground">Enterprise</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  Popular
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                For large organizations
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">{formatPrice(PRICING.enterprise.monthly)}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                or {formatPrice(PRICING.enterprise.yearly)}/year (save 17%)
              </p>
              <ul className="text-sm space-y-2 mb-6">
                <li className="flex items-center gap-2 text-foreground">
                  <CheckIcon /> Unlimited users
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckIcon /> Unlimited instances
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckIcon /> Unlimited sessions
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckIcon /> 24/7 dedicated support
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckIcon /> SLA guarantee
                </li>
              </ul>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe('enterprise', 'monthly')}
                  isLoading={checkoutLoading}
                  disabled={subscription?.tier === 'enterprise'}
                >
                  {subscription?.tier === 'enterprise' ? 'Current Plan' : 'Subscribe Monthly'}
                </Button>
                <Button
                  className="w-full"
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
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 text-foreground">Community (Free)</h4>
            <p className="text-sm text-muted-foreground">
              No subscription required for basic usage: up to 5 users, 10 instances, and 3 concurrent sessions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
