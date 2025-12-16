'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useLicenseStore } from '@/lib/stores/license.store';

export default function DashboardPage() {
  const { customer } = useAuthStore();
  const { licenses, subscription, fetchLicenses, fetchSubscription, isLoading } = useLicenseStore();

  useEffect(() => {
    fetchLicenses();
    fetchSubscription();
  }, [fetchLicenses, fetchSubscription]);

  const activeLicense = licenses.find((l) => l.status === 'active');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Welcome back, {customer?.firstName}!</h1>
      <p className="text-muted-foreground mb-8">
        Manage your CloudDesk licenses and subscription.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">
              {activeLicense?.tier || 'No Plan'}
            </p>
            {subscription && (
              <p className="text-sm text-muted-foreground mt-1">
                {subscription.status === 'active' ? 'Active' : subscription.status}
              </p>
            )}
          </CardContent>
        </Card>

        {/* License Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              License Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">
              {activeLicense?.status || 'None'}
            </p>
            {activeLicense?.expiresAt && (
              <p className="text-sm text-muted-foreground mt-1">
                Expires: {new Date(activeLicense.expiresAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/licenses" className="block">
              <Button variant="outline" size="sm" className="w-full">
                View License Keys
              </Button>
            </Link>
            <Link href="/dashboard/billing" className="block">
              <Button variant="outline" size="sm" className="w-full">
                Manage Billing
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* License Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Your License Keys</CardTitle>
          <CardDescription>
            Use these keys in your self-hosted CloudDesk installation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading licenses...
            </div>
          ) : licenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You don&apos;t have any licenses yet.
              </p>
              <Link href="/pricing">
                <Button>Get a License</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {licenses.map((license) => (
                <div
                  key={license.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-mono text-sm">{license.keyPreview}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">
                        {license.tier}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          license.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {license.status}
                      </span>
                    </div>
                  </div>
                  <Link href="/dashboard/licenses">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
