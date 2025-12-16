'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useLicenseStore } from '@/lib/stores/license.store';

// Mock usage data - in production this would come from API
const mockUsageData = {
  sessions: {
    current: 2,
    limit: 3,
    history: [12, 8, 15, 10, 14, 9, 11], // Last 7 days
  },
  instances: {
    current: 4,
    limit: 10,
  },
  users: {
    current: 2,
    limit: 5,
  },
  connectionTime: {
    today: 4.5, // hours
    thisWeek: 28.3,
    thisMonth: 112.7,
  },
  recentActivity: [
    { type: 'session', action: 'Connected to prod-server-01', time: '2 hours ago' },
    { type: 'session', action: 'Disconnected from dev-server', time: '5 hours ago' },
    { type: 'instance', action: 'Added new instance: staging-db', time: '1 day ago' },
    { type: 'user', action: 'Invited team member: john@example.com', time: '2 days ago' },
  ],
};

export default function DashboardPage() {
  const { customer } = useAuthStore();
  const { licenses, subscription, fetchLicenses, fetchSubscription, isLoading } = useLicenseStore();
  const [usageData] = useState(mockUsageData);

  useEffect(() => {
    fetchLicenses();
    fetchSubscription();
  }, [fetchLicenses, fetchSubscription]);

  const activeLicense = licenses.find((l) => l.status === 'active');
  const tierName = activeLicense?.tier || 'community';

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'from-red-500 to-red-600';
    if (percentage >= 70) return 'from-yellow-500 to-orange-500';
    return 'from-blue-500 to-purple-500';
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
            <p className="text-sm text-green-400 mt-1">Active</p>
          )}
        </div>

        {/* Connection Time */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/60">Connection Time</span>
            <span className="text-white/40">Today</span>
          </div>
          <p className="text-3xl font-bold text-white">{usageData.connectionTime.today}h</p>
          <p className="text-sm text-white/50 mt-1">
            {usageData.connectionTime.thisWeek}h this week
          </p>
        </div>

        {/* Active Sessions */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/60">Active Sessions</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <p className="text-3xl font-bold text-white">
            {usageData.sessions.current}
            <span className="text-lg text-white/40">/{usageData.sessions.limit}</span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getUsageColor(
                getUsagePercentage(usageData.sessions.current, usageData.sessions.limit)
              )}`}
              style={{
                width: `${getUsagePercentage(usageData.sessions.current, usageData.sessions.limit)}%`,
              }}
            />
          </div>
        </div>

        {/* Instances */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/60">Cloud Instances</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {usageData.instances.current}
            <span className="text-lg text-white/40">/{usageData.instances.limit}</span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getUsageColor(
                getUsagePercentage(usageData.instances.current, usageData.instances.limit)
              )}`}
              style={{
                width: `${getUsagePercentage(usageData.instances.current, usageData.instances.limit)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Session Activity</h2>
            <span className="text-sm text-white/40">Last 7 days</span>
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {usageData.sessions.history.map((value, idx) => {
              const maxValue = Math.max(...usageData.sessions.history);
              const height = (value / maxValue) * 100;
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative" style={{ height: '160px' }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-blue-500/80 to-purple-500/80 transition-all hover:from-blue-400/90 hover:to-purple-400/90"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40">{days[idx]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {usageData.recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'session' ? 'bg-blue-500/20 text-blue-400' :
                  activity.type === 'instance' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {activity.type === 'session' ? '&#128421;' :
                   activity.type === 'instance' ? '&#9729;' : '&#128100;'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{activity.action}</p>
                  <p className="text-xs text-white/40">{activity.time}</p>
                </div>
              </div>
            ))}
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
              <span className="text-3xl">&#128273;</span>
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
                    <span className="text-lg">&#128273;</span>
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
                    View &#8594;
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
                <span className="text-blue-400">&#128273;</span>
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
                <span className="text-purple-400">&#128179;</span>
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
                <span className="text-green-400">&#9881;</span>
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
