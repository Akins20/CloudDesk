import http from 'http';
import { URL } from 'url';
import WebSocket, { WebSocketServer } from 'ws';
import { Session } from '../models/Session';
import { authService } from '../services/authService';
import { tunnelService } from '../services/tunnelService';
import { connectionManager } from './connectionManager';
import { sessionBridgeManager, ViewerPermission } from './SessionBridge';
import { logger } from '../utils/logger';
import { WSConnectionInfo } from '../types';

interface VNCProxyOptions {
  server: http.Server;
  path?: string;
}

class VNCProxy {
  private wss: WebSocketServer;

  constructor(options: VNCProxyOptions) {
    const { server, path = '/vnc' } = options;

    this.wss = new WebSocketServer({
      server,
      path,
      verifyClient: this.verifyClient.bind(this),
    });

    this.setupEventHandlers();
    logger.info(`VNC WebSocket proxy initialized on path: ${path}`);
  }

  /**
   * Verify client before connection
   */
  private verifyClient(
    info: { origin: string; req: http.IncomingMessage; secure: boolean },
    callback: (res: boolean, code?: number, message?: string) => void
  ): void {
    try {
      const url = new URL(info.req.url || '', `http://${info.req.headers.host}`);
      const sessionId = url.searchParams.get('sessionId');
      const token = url.searchParams.get('token');

      if (!sessionId || !token) {
        callback(false, 401, 'Missing sessionId or token');
        return;
      }

      // Verify token
      try {
        authService.verifyAccessToken(token);
      } catch {
        callback(false, 401, 'Invalid token');
        return;
      }

      callback(true);
    } catch (error) {
      logger.error('WebSocket verify client error:', error);
      callback(false, 500, 'Internal server error');
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    this.wss.on('connection', this.handleConnection.bind(this));

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error:', error);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(
    ws: WebSocket,
    req: http.IncomingMessage
  ): Promise<void> {
    let sessionId: string | null = null;
    let userId: string | null = null;

    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      sessionId = url.searchParams.get('sessionId');
      const token = url.searchParams.get('token');

      if (!sessionId || !token) {
        ws.close(1008, 'Missing sessionId or token');
        return;
      }

      // Verify token and get user info
      const payload = authService.verifyAccessToken(token);
      userId = payload.userId;

      // Get session from database - allow owner OR invited viewer
      const session = await Session.findOne({
        _id: sessionId,
        status: { $in: ['connecting', 'connected'] },
        $or: [
          { userId }, // Owner
          { 'activeViewers.userId': userId }, // Invited viewer
        ],
      });

      if (!session) {
        ws.close(1008, 'Session not found, not active, or access denied');
        return;
      }

      // Determine if user is owner or viewer
      const isOwner = session.userId.toString() === userId;
      let permissions: ViewerPermission = 'control'; // Default for owner

      if (!isOwner) {
        // Find viewer permissions
        const viewer = session.activeViewers.find(
          (v) => v.userId.toString() === userId
        );
        if (viewer) {
          permissions = viewer.permissions;
        } else {
          ws.close(1008, 'You are not authorized to view this session');
          return;
        }
      }

      // Get tunnel info
      const tunnelInfo = tunnelService.getTunnelBySession(sessionId);
      if (!tunnelInfo) {
        ws.close(1008, 'Tunnel not found');
        return;
      }

      // Get or create session bridge (shared TCP connection)
      const bridge = await sessionBridgeManager.getOrCreateBridge({
        sessionId,
        tunnelHost: '127.0.0.1',
        tunnelPort: tunnelInfo.localPort,
        ownerId: session.userId.toString(),
      });

      // Add this viewer to the bridge
      bridge.addViewer(userId, ws, permissions, isOwner);

      // Store connection info in connection manager
      const connectionInfo: WSConnectionInfo = {
        sessionId,
        userId,
        tunnelPort: tunnelInfo.localPort,
        createdAt: new Date(),
      };

      connectionManager.addConnection(sessionId, ws, connectionInfo);

      // Update session activity
      session.lastActivityAt = new Date();
      await session.save();

      logger.info(`VNC proxy connection established`, {
        sessionId,
        userId,
        isOwner,
        permissions,
        viewerCount: bridge.getViewerCount(),
      });
    } catch (error) {
      logger.error('Error handling WebSocket connection:', error);
      if (sessionId && userId) {
        const bridge = sessionBridgeManager.getBridge(sessionId);
        if (bridge) {
          bridge.removeViewer(userId);
        }
      }
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * Close connection for a specific session
   */
  closeSession(sessionId: string): void {
    sessionBridgeManager.closeBridge(sessionId);
    connectionManager.removeConnection(sessionId);
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    sessionBridgeManager.closeAll();
    this.wss.close();
    logger.info('VNC proxy shut down');
  }

  /**
   * Get active connection count
   */
  getActiveConnectionCount(): number {
    return sessionBridgeManager.getTotalViewerCount();
  }

  /**
   * Get active session count
   */
  getActiveSessionCount(): number {
    return sessionBridgeManager.getActiveSessions().length;
  }
}

export const createVNCProxy = (options: VNCProxyOptions): VNCProxy => {
  return new VNCProxy(options);
};

export default createVNCProxy;
