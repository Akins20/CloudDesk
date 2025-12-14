'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Maximize2,
  Minimize2,
  XCircle,
  RefreshCw,
  Keyboard,
  Users,
} from 'lucide-react';
import { Button, Spinner, Card, Badge } from '@/components/ui';
import { ShareSession } from './ShareSession';
import { useSessionStore, toast } from '@/lib/stores';
import { ROUTES, SUCCESS_MESSAGES, API_BASE_URL } from '@/lib/utils/constants';
import { cn, getAccessToken } from '@/lib/utils/helpers';
import { api } from '@/lib/api';

interface VNCViewerProps {
  sessionId: string;
  websocketUrl: string;
  isOwner?: boolean;
}

interface Viewer {
  odId: string;
  name?: string;
  permissions: 'view' | 'control';
  joinedAt: Date;
  isOwner: boolean;
}

export function VNCViewer({ sessionId, websocketUrl, isOwner = true }: VNCViewerProps) {
  const router = useRouter();
  const { disconnect } = useSessionStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [vncUrl, setVncUrl] = useState<string | null>(null);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  // Build VNC URL on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError('Authentication required. Please log in again.');
      setIsConnecting(false);
      return;
    }

    const baseWsUrl = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    const separator = websocketUrl.includes('?') ? '&' : '?';
    const wsUrl = `${baseWsUrl}${websocketUrl}${separator}token=${encodeURIComponent(token)}`;

    // Build iframe URL with encoded WebSocket URL
    const iframeUrl = `/vnc.html?url=${encodeURIComponent(wsUrl)}`;
    setVncUrl(iframeUrl);
  }, [websocketUrl, sessionId]);

  // Fetch initial viewer count
  useEffect(() => {
    const fetchViewers = async () => {
      try {
        const response = await api.get<{
          viewerCount: number;
          viewers: Viewer[];
        }>(`/api/sessions/${sessionId}/viewers`);
        if (response.success && response.data) {
          setViewerCount(response.data.viewerCount);
          setViewers(response.data.viewers);
        }
      } catch (error) {
        console.error('Failed to fetch viewers:', error);
      }
    };

    if (isConnected) {
      fetchViewers();
      // Poll for viewer updates every 10 seconds
      const interval = setInterval(fetchViewers, 10000);
      return () => clearInterval(interval);
    }
  }, [sessionId, isConnected]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'vnc-connected') {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      } else if (event.data.type === 'vnc-disconnected') {
        setIsConnected(false);
        if (event.data.clean) {
          toast.info('Disconnected from remote desktop');
        } else {
          setError('Connection lost. Please try reconnecting.');
        }
      } else if (event.data.type === 'vnc-error') {
        setError(event.data.error);
        setIsConnecting(false);
      } else if (event.data.type === 'viewers_update') {
        // Handle viewer updates from WebSocket
        setViewerCount(event.data.count || 0);
        setViewers(event.data.viewers || []);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleDisconnect = useCallback(async () => {
    console.log('Disconnect button clicked, sessionId:', sessionId);
    try {
      // Disconnect VNC in iframe
      if (iframeRef.current?.contentWindow) {
        const rfb = (iframeRef.current.contentWindow as any).vncRFB;
        console.log('RFB instance:', rfb);
        if (rfb) rfb.disconnect();
      }
      console.log('Calling session store disconnect...');
      await disconnect(sessionId);
      console.log('Disconnect completed successfully');
      toast.success(SUCCESS_MESSAGES.DISCONNECTION_SUCCESS);
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      console.error('Disconnect error:', error);
      const message = error instanceof Error ? error.message : 'Failed to disconnect';
      toast.error(message);
    }
  }, [sessionId, disconnect, router]);

  const handleReconnect = useCallback(() => {
    setIsConnecting(true);
    setError(null);
    // Reload iframe to reconnect
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = document.getElementById('vnc-container');
    if (!document.fullscreenElement && container) {
      await container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const sendCtrlAltDel = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      const rfb = (iframeRef.current.contentWindow as any).vncRFB;
      if (rfb) rfb.sendCtrlAltDel();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide toolbar in fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setShowToolbar(true);
      return;
    }

    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowToolbar(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowToolbar(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  if (error && !vncUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md text-center">
          <div className="p-8">
            <XCircle className="w-12 h-12 text-status-error mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Connection Error
            </h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push(ROUTES.DASHBOARD)}>
                Back to Dashboard
              </Button>
              <Button onClick={handleReconnect}>
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      id="vnc-container"
      className={cn('relative h-full bg-black', isFullscreen && 'fixed inset-0 z-50')}
    >
      {/* Toolbar */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-10 bg-card/90 backdrop-blur-sm border-b border-border transition-transform duration-200',
          isFullscreen && !showToolbar && '-translate-y-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-status-success animate-pulse' : 'bg-status-warning'
                )}
              />
              <span className="text-sm text-foreground">
                {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>

            {/* Viewer indicator */}
            {viewerCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md" title={`${viewerCount} viewer(s) connected`}>
                <Users className="w-3.5 h-3.5 text-status-success" />
                <span className="text-xs text-foreground font-medium">{viewerCount}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Share button - only for owner */}
            {isOwner && (
              <ShareSession sessionId={sessionId} isOwner={isOwner} />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={sendCtrlAltDel}
              disabled={!isConnected}
              title="Send Ctrl+Alt+Del"
            >
              <Keyboard className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReconnect}
              disabled={isConnecting}
              title="Reconnect"
            >
              <RefreshCw className={cn('w-4 h-4', isConnecting && 'animate-spin')} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-status-error hover:bg-status-error/10"
              onClick={handleDisconnect}
              title="Disconnect"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* VNC Iframe */}
      {vncUrl && (
        <iframe
          ref={iframeRef}
          src={vncUrl}
          className={cn(
            'w-full h-full border-0',
            isFullscreen ? 'pt-0' : 'pt-12'
          )}
          allow="fullscreen"
        />
      )}

      {/* Loading overlay */}
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pt-12">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" className="text-white" />
            <p className="text-white text-sm">Connecting to remote desktop...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && vncUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 pt-12">
          <Card className="max-w-md text-center">
            <div className="p-8">
              <XCircle className="w-12 h-12 text-status-error mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Connection Error
              </h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => router.push(ROUTES.DASHBOARD)}>
                  Back to Dashboard
                </Button>
                <Button onClick={handleReconnect}>
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
