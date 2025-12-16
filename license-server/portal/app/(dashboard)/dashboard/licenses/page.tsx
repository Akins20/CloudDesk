'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, toast } from '@/components/ui';
import { useLicenseStore, License } from '@/lib/stores/license.store';
import api, { ApiResponse } from '@/lib/api/client';

export default function LicensesPage() {
  const { licenses, fetchLicenses, isLoading } = useLicenseStore();
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const revealLicenseKey = async (licenseId: string) => {
    if (revealedKeys[licenseId]) {
      // Already revealed, just toggle visibility
      const newRevealed = { ...revealedKeys };
      delete newRevealed[licenseId];
      setRevealedKeys(newRevealed);
      return;
    }

    setLoadingKey(licenseId);
    try {
      const response = await api.get<ApiResponse<{ key: string }>>(
        `/customers/licenses/${licenseId}/reveal`
      );

      if (response.data.success && response.data.data) {
        setRevealedKeys({
          ...revealedKeys,
          [licenseId]: response.data.data.key,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to reveal key',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard', variant: 'success' });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: License['status']) => {
    switch (status) {
      case 'active':
        return 'bg-status-success/20 text-status-success';
      case 'expired':
        return 'bg-status-warning/20 text-status-warning';
      case 'revoked':
      case 'suspended':
        return 'bg-status-error/20 text-status-error';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-foreground">License Keys</h1>
      <p className="text-muted-foreground mb-8">
        Manage your CloudDesk license keys for self-hosted deployments.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Your Licenses</CardTitle>
          <CardDescription>
            Copy your license key and add it to your .env file as LICENSE_KEY
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
              <p className="text-sm text-muted-foreground">
                Subscribe to a plan to receive your license key.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {licenses.map((license) => (
                <div
                  key={license.id}
                  className="border border-border rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold capitalize text-lg text-foreground">
                          {license.tier} License
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(license.status)}`}>
                          {license.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(license.createdAt).toLocaleDateString()}
                        {license.expiresAt && (
                          <> | Expires: {new Date(license.expiresAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* License Key Display */}
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <code className="font-mono text-sm break-all text-foreground">
                        {revealedKeys[license.id] || license.keyPreview}
                      </code>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revealLicenseKey(license.id)}
                          isLoading={loadingKey === license.id}
                        >
                          {revealedKeys[license.id] ? 'Hide' : 'Reveal'}
                        </Button>
                        {revealedKeys[license.id] && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(revealedKeys[license.id])}
                          >
                            Copy
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Usage Instructions */}
                  {revealedKeys[license.id] && (
                    <div className="mt-4 p-4 bg-status-info/10 border border-status-info/20 rounded-lg text-sm">
                      <p className="font-medium text-status-info mb-2">Usage Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Open your CloudDesk <code className="text-foreground">.env</code> file</li>
                        <li>Add or update: <code className="text-foreground">LICENSE_KEY={revealedKeys[license.id]}</code></li>
                        <li>Restart your CloudDesk instance</li>
                      </ol>
                    </div>
                  )}

                  {/* Validation Stats */}
                  {license.metadata && (
                    <div className="mt-4 text-xs text-muted-foreground">
                      Validated {license.metadata.validationCount} times
                      {license.metadata.lastValidatedAt && (
                        <> | Last validated: {new Date(license.metadata.lastValidatedAt).toLocaleString()}</>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
