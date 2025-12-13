'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VNCViewer } from '@/components/desktop';
import { PageLoader } from '@/components/ui';
import { useSessionStore, useAuthStore } from '@/lib/stores';
import { ROUTES } from '@/lib/utils/constants';

export default function DesktopPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();
  const { fetchSession, currentSession, sessionInfo, isLoading } = useSessionStore();
  const [error, setError] = useState<string | null>(null);

  const sessionId = params.sessionId as string;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    if (sessionId && isAuthenticated) {
      fetchSession(sessionId).catch((err) => {
        setError(err.message);
      });
    }
  }, [sessionId, isAuthenticated, fetchSession]);

  if (!isInitialized) {
    return <PageLoader message="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return <PageLoader message="Loading session..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Session Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.push(ROUTES.DASHBOARD)}
            className="text-foreground underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return <PageLoader message="Connecting..." />;
  }

  // Construct websocket URL from session data
  const websocketUrl = sessionInfo?.websocketUrl || `/vnc?sessionId=${sessionId}`;

  return (
    <div className="h-screen bg-black">
      <VNCViewer sessionId={sessionId} websocketUrl={websocketUrl} />
    </div>
  );
}
