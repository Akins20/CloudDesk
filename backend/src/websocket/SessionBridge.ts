import net from 'net';
import WebSocket from 'ws';
import { logger } from '../utils/logger';

export type ViewerPermission = 'view' | 'control';

export interface SessionViewer {
  userId: string;
  ws: WebSocket;
  permissions: ViewerPermission;
  joinedAt: Date;
  isOwner: boolean;
}

interface SessionBridgeOptions {
  sessionId: string;
  tunnelHost: string;
  tunnelPort: number;
  ownerId: string;
}

/**
 * SessionBridge manages a single TCP connection to VNC that multiple WebSocket clients share.
 *
 * Architecture:
 * - One TCP connection per session (to the SSH tunnel -> VNC server)
 * - Multiple WebSocket clients can connect to the same bridge
 * - VNC frames from TCP are broadcast to ALL connected clients
 * - Input events are forwarded from clients with 'control' permission
 * - Owner always has 'control' permission
 */
export class SessionBridge {
  private sessionId: string;
  private tcpSocket: net.Socket | null = null;
  private viewers: Map<string, SessionViewer> = new Map();
  private tunnelHost: string;
  private tunnelPort: number;
  private ownerId: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  constructor(options: SessionBridgeOptions) {
    this.sessionId = options.sessionId;
    this.tunnelHost = options.tunnelHost;
    this.tunnelPort = options.tunnelPort;
    this.ownerId = options.ownerId;
  }

  /**
   * Initialize the TCP connection to the VNC tunnel
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.tcpSocket = net.createConnection({
        host: this.tunnelHost,
        port: this.tunnelPort,
      });

      this.tcpSocket.on('connect', () => {
        logger.info(`[SessionBridge] TCP connection established for session ${this.sessionId}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.tcpSocket.on('data', (data: Buffer) => {
        this.broadcastToViewers(data);
      });

      this.tcpSocket.on('error', (error) => {
        logger.error(`[SessionBridge] TCP error for session ${this.sessionId}:`, error);
        if (!this.isConnected) {
          reject(error);
        }
      });

      this.tcpSocket.on('close', () => {
        logger.info(`[SessionBridge] TCP connection closed for session ${this.sessionId}`);
        this.isConnected = false;
        this.handleTcpClose();
      });
    });
  }

  /**
   * Handle TCP connection close - notify all viewers
   */
  private handleTcpClose(): void {
    // Close all WebSocket connections
    for (const [viewerId, viewer] of this.viewers) {
      if (viewer.ws.readyState === WebSocket.OPEN) {
        viewer.ws.close(1000, 'VNC connection closed');
      }
    }
    this.viewers.clear();
  }

  /**
   * Broadcast VNC data to all connected viewers
   */
  private broadcastToViewers(data: Buffer): void {
    for (const [viewerId, viewer] of this.viewers) {
      if (viewer.ws.readyState === WebSocket.OPEN) {
        try {
          viewer.ws.send(data);
        } catch (error) {
          logger.warn(`[SessionBridge] Failed to send data to viewer ${viewerId}:`, error);
        }
      }
    }
  }

  /**
   * Add a viewer to this session
   */
  addViewer(
    userId: string,
    ws: WebSocket,
    permissions: ViewerPermission,
    isOwner: boolean = false
  ): void {
    // If this user already has a connection, close the old one
    const existingViewer = this.viewers.get(userId);
    if (existingViewer && existingViewer.ws !== ws) {
      logger.info(`[SessionBridge] Closing existing connection for user ${userId}`);
      if (existingViewer.ws.readyState === WebSocket.OPEN) {
        existingViewer.ws.close(1000, 'New connection established');
      }
    }

    const viewer: SessionViewer = {
      userId,
      ws,
      permissions: isOwner ? 'control' : permissions, // Owner always has control
      joinedAt: new Date(),
      isOwner,
    };

    this.viewers.set(userId, viewer);

    // Set up WebSocket event handlers for this viewer
    ws.on('message', (data: WebSocket.Data) => {
      this.handleViewerMessage(userId, data);
    });

    ws.on('close', () => {
      this.removeViewer(userId);
    });

    ws.on('error', (error) => {
      logger.error(`[SessionBridge] WebSocket error for viewer ${userId}:`, error);
      this.removeViewer(userId);
    });

    logger.info(`[SessionBridge] Viewer ${userId} joined session ${this.sessionId} with ${permissions} permissions`);

    // Notify other viewers about new participant
    this.broadcastViewerUpdate();
  }

  /**
   * Handle incoming message from a viewer
   */
  private handleViewerMessage(userId: string, data: WebSocket.Data): void {
    const viewer = this.viewers.get(userId);
    if (!viewer) return;

    // Only forward input if viewer has control permission
    if (viewer.permissions === 'control' && this.tcpSocket?.writable) {
      this.tcpSocket.write(data as Buffer);
    }
    // View-only users' input is silently ignored
  }

  /**
   * Remove a viewer from this session
   */
  removeViewer(userId: string): void {
    const viewer = this.viewers.get(userId);
    if (!viewer) return;

    this.viewers.delete(userId);
    logger.info(`[SessionBridge] Viewer ${userId} left session ${this.sessionId}`);

    // If no viewers left and this isn't the owner, consider closing
    // But we'll keep the bridge alive as long as the session exists

    // Notify remaining viewers about participant leaving
    this.broadcastViewerUpdate();
  }

  /**
   * Broadcast viewer list update to all connected clients
   */
  private broadcastViewerUpdate(): void {
    const viewerList = this.getViewerList();
    const message = JSON.stringify({
      type: 'viewers_update',
      viewers: viewerList,
      count: viewerList.length,
    });

    for (const [, viewer] of this.viewers) {
      if (viewer.ws.readyState === WebSocket.OPEN) {
        try {
          // Send as text message (not binary VNC data)
          viewer.ws.send(message);
        } catch (error) {
          logger.warn('[SessionBridge] Failed to send viewer update:', error);
        }
      }
    }
  }

  /**
   * Get list of current viewers (for API/UI)
   */
  getViewerList(): Array<{
    userId: string;
    permissions: ViewerPermission;
    joinedAt: Date;
    isOwner: boolean;
  }> {
    return Array.from(this.viewers.values()).map((v) => ({
      userId: v.userId,
      permissions: v.permissions,
      joinedAt: v.joinedAt,
      isOwner: v.isOwner,
    }));
  }

  /**
   * Get viewer count
   */
  getViewerCount(): number {
    return this.viewers.size;
  }

  /**
   * Check if a user is connected to this session
   */
  hasViewer(userId: string): boolean {
    return this.viewers.has(userId);
  }

  /**
   * Update a viewer's permissions
   */
  updateViewerPermissions(userId: string, permissions: ViewerPermission): boolean {
    const viewer = this.viewers.get(userId);
    if (!viewer) return false;

    // Can't change owner's permissions
    if (viewer.isOwner) return false;

    viewer.permissions = permissions;
    this.broadcastViewerUpdate();
    return true;
  }

  /**
   * Kick a viewer from the session
   */
  kickViewer(userId: string, reason: string = 'Kicked by session owner'): boolean {
    const viewer = this.viewers.get(userId);
    if (!viewer) return false;

    // Can't kick the owner
    if (viewer.isOwner) return false;

    if (viewer.ws.readyState === WebSocket.OPEN) {
      viewer.ws.close(1000, reason);
    }
    this.viewers.delete(userId);
    this.broadcastViewerUpdate();
    return true;
  }

  /**
   * Get the session owner ID
   */
  getOwnerId(): string {
    return this.ownerId;
  }

  /**
   * Check if the bridge is connected to VNC
   */
  isVncConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Close the bridge and all connections
   */
  close(): void {
    logger.info(`[SessionBridge] Closing bridge for session ${this.sessionId}`);

    // Close all viewer WebSocket connections
    for (const [, viewer] of this.viewers) {
      if (viewer.ws.readyState === WebSocket.OPEN) {
        viewer.ws.close(1000, 'Session ended');
      }
    }
    this.viewers.clear();

    // Close TCP connection
    if (this.tcpSocket) {
      try {
        this.tcpSocket.destroy();
      } catch (error) {
        logger.warn(`[SessionBridge] Error destroying TCP socket:`, error);
      }
      this.tcpSocket = null;
    }

    this.isConnected = false;
  }
}

/**
 * SessionBridgeManager manages all active session bridges
 */
export class SessionBridgeManager {
  private bridges: Map<string, SessionBridge> = new Map();

  /**
   * Get or create a bridge for a session
   */
  async getOrCreateBridge(options: SessionBridgeOptions): Promise<SessionBridge> {
    let bridge = this.bridges.get(options.sessionId);

    if (bridge && bridge.isVncConnected()) {
      return bridge;
    }

    // Create new bridge
    bridge = new SessionBridge(options);
    await bridge.connect();
    this.bridges.set(options.sessionId, bridge);

    logger.info(`[SessionBridgeManager] Created bridge for session ${options.sessionId}`);
    return bridge;
  }

  /**
   * Get an existing bridge
   */
  getBridge(sessionId: string): SessionBridge | undefined {
    return this.bridges.get(sessionId);
  }

  /**
   * Close and remove a bridge
   */
  closeBridge(sessionId: string): void {
    const bridge = this.bridges.get(sessionId);
    if (bridge) {
      bridge.close();
      this.bridges.delete(sessionId);
      logger.info(`[SessionBridgeManager] Closed bridge for session ${sessionId}`);
    }
  }

  /**
   * Get all active session IDs
   */
  getActiveSessions(): string[] {
    return Array.from(this.bridges.keys());
  }

  /**
   * Get total viewer count across all sessions
   */
  getTotalViewerCount(): number {
    let total = 0;
    for (const bridge of this.bridges.values()) {
      total += bridge.getViewerCount();
    }
    return total;
  }

  /**
   * Close all bridges
   */
  closeAll(): void {
    for (const [sessionId, bridge] of this.bridges) {
      bridge.close();
    }
    this.bridges.clear();
    logger.info('[SessionBridgeManager] All bridges closed');
  }
}

// Export singleton instance
export const sessionBridgeManager = new SessionBridgeManager();
