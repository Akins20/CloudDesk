'use client';

import { useLicenseStore, LICENSE_TIERS, getNextTier, LimitType } from '@/lib/stores/license.store';
import { Button } from '@/components/ui/Button';

const PORTAL_URL = process.env.NEXT_PUBLIC_LICENSE_PORTAL_URL || 'https://clouddesk-production.up.railway.app';

export function UpgradeModal() {
  const { tier, upgradePrompt, hideUpgradeModal } = useLicenseStore();
  const { isOpen, limitType, currentUsage, limit } = upgradePrompt;

  if (!isOpen) return null;

  const nextTier = getNextTier(tier);
  const currentTierInfo = LICENSE_TIERS[tier];
  const nextTierInfo = nextTier ? LICENSE_TIERS[nextTier] : null;

  const getLimitLabel = (type: LimitType | null): string => {
    switch (type) {
      case 'user':
        return 'users';
      case 'instance':
        return 'instances';
      case 'session':
        return 'concurrent sessions';
      default:
        return 'resources';
    }
  };

  const getNextLimit = (type: LimitType | null, tierInfo: typeof nextTierInfo): number | string => {
    if (!tierInfo || !type) return 'more';
    const limits = tierInfo.limits;
    const value = type === 'user' ? limits.users :
                  type === 'instance' ? limits.instances :
                  limits.sessions;
    return value === Infinity ? 'Unlimited' : value;
  };

  const handleUpgrade = () => {
    window.open(`${PORTAL_URL}/pricing`, '_blank');
  };

  const handleManageSubscription = () => {
    window.open(`${PORTAL_URL}/dashboard/billing`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={hideUpgradeModal}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-xl animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-status-warning/20 flex items-center justify-center">
              <WarningIcon className="w-5 h-5 text-status-warning" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Upgrade Required
            </h2>
          </div>
          <p className="text-muted-foreground">
            You&apos;ve reached the {getLimitLabel(limitType)} limit for your current plan.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Usage */}
          {limitType && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {getLimitLabel(limitType).charAt(0).toUpperCase() + getLimitLabel(limitType).slice(1)} used
                </span>
                <span className="text-sm font-medium text-foreground">
                  {currentUsage} / {limit}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-status-warning rounded-full transition-all"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Current Plan */}
            <div className="p-4 border border-border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Current Plan</div>
              <div className="text-lg font-semibold text-foreground capitalize mb-2">
                {tier}
              </div>
              <ul className="space-y-1">
                <li className="text-sm text-muted-foreground">
                  {currentTierInfo.limits.users} users
                </li>
                <li className="text-sm text-muted-foreground">
                  {currentTierInfo.limits.instances} instances
                </li>
                <li className="text-sm text-muted-foreground">
                  {currentTierInfo.limits.sessions} sessions
                </li>
              </ul>
            </div>

            {/* Upgrade Plan */}
            {nextTierInfo && (
              <div className="p-4 border-2 border-primary rounded-lg ring-2 ring-primary/20">
                <div className="text-xs text-primary mb-1">Recommended</div>
                <div className="text-lg font-semibold text-foreground capitalize mb-2">
                  {nextTier}
                </div>
                <ul className="space-y-1">
                  <li className="text-sm text-foreground">
                    {nextTierInfo.limits.users === Infinity ? 'Unlimited' : nextTierInfo.limits.users} users
                  </li>
                  <li className="text-sm text-foreground">
                    {nextTierInfo.limits.instances === Infinity ? 'Unlimited' : nextTierInfo.limits.instances} instances
                  </li>
                  <li className="text-sm text-foreground">
                    {nextTierInfo.limits.sessions === Infinity ? 'Unlimited' : nextTierInfo.limits.sessions} sessions
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Benefits */}
          {nextTierInfo && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-2">
                Upgrade to {nextTier} to get:
              </h3>
              <ul className="space-y-2">
                {nextTierInfo.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckIcon className="w-4 h-4 text-status-success flex-shrink-0" />
                    {feature}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm text-foreground font-medium">
                  <CheckIcon className="w-4 h-4 text-status-success flex-shrink-0" />
                  {getNextLimit(limitType, nextTierInfo)} {getLimitLabel(limitType)}
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={hideUpgradeModal}>
            Maybe Later
          </Button>
          {nextTier ? (
            <Button onClick={handleUpgrade}>
              Upgrade to {nextTier.charAt(0).toUpperCase() + nextTier.slice(1)}
            </Button>
          ) : (
            <Button onClick={handleManageSubscription}>
              Manage Subscription
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default UpgradeModal;
