'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Maximize2,
  Minimize2,
  XCircle,
  RefreshCw,
  Settings,
  Keyboard,
  Mouse,
} from 'lucide-react';
import { Button, Spinner, Card } from '@/components/ui';
import { useSessionStore, toast } from '@/lib/stores';
import { ROUTES, SUCCESS_MESSAGES, API_BASE_URL } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/helpers';

interface VNCViewerProps {
  sessionId: string;
  websocketUrl: string;
}

export function VNCViewer({ sessionId, websocketUrl }: VNCViewerProps) {
  const router = useRouter();
  const { disconnect } = useSessionStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(true);

  const handleDisconnect = useCallback(async () => {
    try {
      if (rfbRef.current) {
        rfbRef.current.disconnect();
        rfbRef.current = null;
      }
      await disconnect(sessionId);
      toast.success(SUCCESS_MESSAGES.DISCONNECTION_SUCCESS);
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect';
      toast.error(message);
    }
  }, [sessionId, disconnect, router]);

  const handleReconnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    if (rfbRef.current) {
      rfbRef.current.disconnect();
      rfbRef.current = null;
    }

    // Re-initialize connection
    initializeVNC();
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await canvasRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const sendCtrlAltDel = useCallback(() => {
    if (rfbRef.current) {
      rfbRef.current.sendCtrlAltDel();
    }
  }, []);

  const initializeVNC = useCallback(async () => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    try {
      // Dynamically import noVNC (client-side only)
      const RFB = (await import('@novnc/novnc/lib/rfb')).default;

      // Build WebSocket URL
      const wsUrl = websocketUrl.startsWith('ws')
        ? websocketUrl
        : `ws://${API_BASE_URL.replace('http://', '').replace('https://', '')}${websocketUrl}`;

      // Create RFB instance
      const rfb = new RFB(canvasRef.current, wsUrl, {
        credentials: { password: '' },
      });

      rfb.scaleViewport = true;
      rfb.resizeSession = true;
      rfb.showDotCursor = true;

      rfb.addEventListener('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      });

      rfb.addEventListener('disconnect', ((e: CustomEvent) => {
        setIsConnected(false);
        if (e.detail.clean) {
          toast.info('Disconnected from remote desktop');
        } else {
          setError('Connection lost. Please try reconnecting.');
        }
      }) as EventListener);

      rfb.addEventListener('securityfailure', ((e: CustomEvent) => {
        setError(`Security error: ${e.detail.reason}`);
        setIsConnecting(false);
      }) as EventListener);

      rfbRef.current = rfb;
    } catch (error) {
      console.error('VNC initialization error:', error);
      setError('Failed to initialize VNC viewer. Please try again.');
      setIsConnecting(false);
    }
  }, [websocketUrl]);

  useEffect(() => {
    initializeVNC();

    return () => {
      if (rfbRef.current) {
        rfbRef.current.disconnect();
        rfbRef.current = null;
      }
    };
  }, [initializeVNC]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
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

  if (error) {
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
    <div className={cn('relative h-full bg-black', isFullscreen && 'fixed inset-0 z-50')}>
      {/* Toolbar */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-10 bg-card/90 backdrop-blur-sm border-b border-border transition-transform duration-200',
          isFullscreen && !showToolbar && '-translate-y-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-status-success animate-pulse' : 'bg-status-warning'
              )}
            />
            <span className="text-sm text-foreground">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
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

      {/* VNC Canvas Container */}
      <div
        ref={canvasRef}
        className={cn(
          'w-full h-full flex items-center justify-center',
          isFullscreen ? 'pt-0' : 'pt-12'
        )}
      >
        {isConnecting && (
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" className="text-white" />
            <p className="text-white text-sm">Connecting to remote desktop...</p>
          </div>
        )}
      </div>
    </div>
  );
}
