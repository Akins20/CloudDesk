'use client';

import { useEffect, useState } from 'react';
import { Button, toast } from '@/components/ui';
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

  const getStatusStyles = (status: License['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'expired':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'revoked':
      case 'suspended':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">License Keys</h1>
        <p className="text-white/60">
          Manage your CloudDesk license keys for self-hosted deployments.
        </p>
      </div>

      {/* License Cards */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">Your Licenses</h2>
          <p className="text-sm text-white/50">
            Copy your license key and add it to your .env file as LICENSE_KEY
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50">Loading licenses...</p>
          </div>
        ) : licenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">&#128273;</span>
            </div>
            <p className="text-white/60 mb-2">
              You don&apos;t have any licenses yet.
            </p>
            <p className="text-sm text-white/40">
              Subscribe to a plan to receive your license key.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {licenses.map((license) => (
              <div
                key={license.id}
                className="rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/[0.07] transition-colors"
              >
                {/* License Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <span className="text-2xl">&#128273;</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-lg text-white capitalize">
                            {license.tier} License
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusStyles(license.status)}`}>
                            {license.status}
                          </span>
                        </div>
                        <p className="text-sm text-white/50">
                          Created: {new Date(license.createdAt).toLocaleDateString()}
                          {license.expiresAt && (
                            <span className="mx-2">|</span>
                          )}
                          {license.expiresAt && (
                            <span>Expires: {new Date(license.expiresAt).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* License Key Display */}
                <div className="p-6">
                  <div className="rounded-xl bg-black/30 p-4 border border-white/10">
                    <div className="flex items-center justify-between gap-4">
                      <code className="font-mono text-sm text-white/80 break-all flex-1">
                        {revealedKeys[license.id] || license.keyPreview}
                      </code>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revealLicenseKey(license.id)}
                          isLoading={loadingKey === license.id}
                          className="border-white/20 hover:bg-white/10"
                        >
                          {revealedKeys[license.id] ? (
                            <>
                              <EyeOffIcon className="w-4 h-4 mr-1.5" />
                              Hide
                            </>
                          ) : (
                            <>
                              <EyeIcon className="w-4 h-4 mr-1.5" />
                              Reveal
                            </>
                          )}
                        </Button>
                        {revealedKeys[license.id] && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(revealedKeys[license.id])}
                            className="border-white/20 hover:bg-white/10"
                          >
                            <CopyIcon className="w-4 h-4 mr-1.5" />
                            Copy
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Usage Instructions */}
                  {revealedKeys[license.id] && (
                    <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="font-medium text-blue-400 mb-3 flex items-center gap-2">
                        <InfoIcon className="w-4 h-4" />
                        Usage Instructions
                      </p>
                      <ol className="space-y-2 text-sm">
                        <li className="flex items-start gap-3 text-white/70">
                          <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                          <span>Open your CloudDesk <code className="px-1.5 py-0.5 rounded bg-white/10 text-white/90">.env</code> file</span>
                        </li>
                        <li className="flex items-start gap-3 text-white/70">
                          <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                          <div>
                            <span>Add or update:</span>
                            <code className="block mt-1 px-2 py-1 rounded bg-black/30 text-white/90 text-xs">
                              LICENSE_KEY={revealedKeys[license.id]}
                            </code>
                          </div>
                        </li>
                        <li className="flex items-start gap-3 text-white/70">
                          <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                          <span>Restart your CloudDesk instance</span>
                        </li>
                      </ol>
                    </div>
                  )}

                  {/* Validation Stats */}
                  {license.metadata && (
                    <div className="mt-4 flex items-center gap-4 text-xs text-white/40">
                      <div className="flex items-center gap-1.5">
                        <CheckIcon className="w-3.5 h-3.5" />
                        Validated {license.metadata.validationCount} times
                      </div>
                      {license.metadata.lastValidatedAt && (
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5" />
                          Last: {new Date(license.metadata.lastValidatedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-medium text-white mb-2">Documentation</h4>
            <p className="text-sm text-white/50 mb-3">
              Learn how to install and configure your license key.
            </p>
            <Button variant="outline" size="sm" className="border-white/20">
              View Docs
            </Button>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-medium text-white mb-2">Support</h4>
            <p className="text-sm text-white/50 mb-3">
              Having issues? Contact our support team for help.
            </p>
            <Button variant="outline" size="sm" className="border-white/20">
              Get Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon Components
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
