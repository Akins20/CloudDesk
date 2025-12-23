'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useLicenseStore } from '@/lib/stores/license.store';

// Tier limits based on plan
const TIER_LIMITS = {
  community: { users: 5, instances: 10, sessions: 3 },
  team: { users: 25, instances: 50, sessions: 10 },
  enterprise: { users: Infinity, instances: Infinity, sessions: Infinity },
};

export default function DashboardPage() {
  const { customer } = useAuthStore();
  const { licenses, subscription, fetchLicenses, fetchSubscription, isLoading } = useLicenseStore();

  useEffect(() => {
    fetchLicenses();
    fetchSubscription();
  }, [fetchLicenses, fetchSubscription]);

  const activeLicense = licenses.find((l) => l.status === 'active');
  const tierName = activeLicense?.tier || 'community';
  const limits = TIER_LIMITS[tierName as keyof typeof TIER_LIMITS] || TIER_LIMITS.community;

  const formatLimit = (limit: number) => {
    return limit === Infinity ? 'Unlimited' : limit.toString();
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {customer?.firstName}!
        </h1>
        <p className="text-white/60">
          Manage your CloudDesk licenses and monitor your usage.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Current Plan */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/60">Current Plan</span>
            <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium capitalize">
              {tierName}
            </span>
          </div>
          <p className="text-3xl font-bold text-white capitalize">{tierName}</p>
          {subscription?.status === 'active' && (
            <p className="text-sm text-green-400 mt-1">Active subscription</p>
          )}
          {!subscription && tierName === 'community' && (
            <p className="text-sm text-white/50 mt-1">Free forever</p>
          )}
        </div>

        {/* User Limit */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/60">User Limit</span>
            <UsersIcon className="w-5 h-5 text-white/40" />
          </div>
          <p className="text-3xl font-bold text-white">{formatLimit(limits.users)}</p>
          <p className="text-sm text-white/50 mt-1">Maximum team members</p>
        </div>

        {/* Session Limit */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/60">Concurrent Sessions</span>
            <MonitorIcon className="w-5 h-5 text-white/40" />
          </div>
          <p className="text-3xl font-bold text-white">{formatLimit(limits.sessions)}</p>
          <p className="text-sm text-white/50 mt-1">Simultaneous connections</p>
        </div>

        {/* Instance Limit */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/60">Instance Limit</span>
            <ServerIcon className="w-5 h-5 text-white/40" />
          </div>
          <p className="text-3xl font-bold text-white">{formatLimit(limits.instances)}</p>
          <p className="text-sm text-white/50 mt-1">Cloud instances</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Info */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Subscription Details</h2>
            {subscription && (
              <span className={`text-xs px-2.5 py-1 rounded-full border ${
                subscription.status === 'active'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }`}>
                {subscription.status.replace('_', ' ')}
              </span>
            )}
          </div>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-white/60">Plan</span>
                <span className="text-white font-medium capitalize">{subscription.tier}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-white/60">Billing Cycle</span>
                <span className="text-white font-medium capitalize">{subscription.billingCycle}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-white/60">Next Billing Date</span>
                <span className="text-white font-medium">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-400">
                    Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              )}
              <Link href="/dashboard/billing">
                <Button variant="outline" className="mt-2 border-white/20">
                  Manage Subscription
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <CreditCardIcon className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/60 mb-2">No active subscription</p>
              <p className="text-sm text-white/40 mb-4">
                You&apos;re on the free Community plan
              </p>
              <Link href="/pricing">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0">
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white mb-4">Account Info</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <KeyIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {licenses.length} License{licenses.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-white/50">
                  {licenses.filter(l => l.status === 'active').length} active
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <BuildingIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {customer?.organizationName || 'No organization'}
                </p>
                <p className="text-xs text-white/50">Organization</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {customer?.createdAt
                    ? new Date(customer.createdAt).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
                <p className="text-xs text-white/50">Member since</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* License Keys Section */}
      <div className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Your License Keys</h2>
            <p className="text-sm text-white/50">Use these keys in your self-hosted CloudDesk installation</p>
          </div>
          <Link href="/dashboard/licenses">
            <Button variant="outline" size="sm" className="border-white/20">
              View All
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-white/50">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-3" />
            Loading licenses...
          </div>
        ) : licenses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <KeyIcon className="w-8 h-8 text-white/40" />
            </div>
            <p className="text-white/60 mb-4">
              You don&apos;t have any licenses yet.
            </p>
            <Link href="/pricing">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0">
                Get a License
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {licenses.slice(0, 3).map((license) => (
              <div
                key={license.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <KeyIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-mono text-sm text-white">{license.keyPreview}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 capitalize">
                        {license.tier}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          license.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {license.status}
                      </span>
                    </div>
                  </div>
                </div>
                <Link href="/dashboard/licenses">
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/licenses" className="block">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <KeyIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Manage Licenses</p>
                <p className="text-xs text-white/50">View and copy your license keys</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/billing" className="block">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCardIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Billing &amp; Invoices</p>
                <p className="text-xs text-white/50">Manage subscription and payments</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/settings" className="block">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <SettingsIcon className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Account Settings</p>
                <p className="text-xs text-white/50">Update profile and preferences</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// Icon components
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  );
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
