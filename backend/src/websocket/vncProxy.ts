import http from 'http';
import net from 'net';
import { URL } from 'url';
import WebSocket, { WebSocketServer } from 'ws';
import { Session } from '../models/Session';
import { authService } from '../services/authService';
import { tunnelService } from '../services/tunnelService';
import { connectionManager } from './connectionManager';
import { logger } from '../utils/logger';
import { WSConnectionInfo } from '../types';

interface VNCProxyOptions {
  server: http.Server;
  path?: string;
}

class VNCProxy {
  private wss: WebSocketServer;
  private tcpConnections: Map<string, net.Socket> = new Map();

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
      const userId = payload.userId;

      // Get session from database
      const session = await Session.findOne({
        _id: sessionId,
        userId,
        status: { $in: ['connecting', 'connected'] },
      });

      if (!session) {
        ws.close(1008, 'Session not found or not active');
        return;
      }

      // Get tunnel info
      const tunnelInfo = tunnelService.getTunnelBySession(sessionId);
      if (!tunnelInfo) {
        ws.close(1008, 'Tunnel not found');
        return;
      }

      // Create TCP connection to the tunnel
      const tcpSocket = net.createConnection({
        host: '127.0.0.1',
        port: tunnelInfo.localPort,
      });

      // Store connection info
      const connectionInfo: WSConnectionInfo = {
        sessionId,
        userId,
        tunnelPort: tunnelInfo.localPort,
        createdAt: new Date(),
      };

      connectionManager.addConnection(sessionId, ws, connectionInfo);
      this.tcpConnections.set(sessionId, tcpSocket);

      // Set up TCP socket event handlers
      tcpSocket.on('connect', () => {
        logger.debug(`TCP connection established for session ${sessionId}`);
      });

      tcpSocket.on('data', (data: Buffer) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      tcpSocket.on('error', (error) => {
        logger.error(`TCP socket error for session ${sessionId}:`, error);
        ws.close(1011, 'VNC connection error');
      });

      tcpSocket.on('close', () => {
        logger.debug(`TCP connection closed for session ${sessionId}`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'VNC connection closed');
        }
      });

      // Set up WebSocket event handlers
      ws.on('message', (data: WebSocket.Data) => {
        if (tcpSocket.writable) {
          tcpSocket.write(data as Buffer);
        }
      });

      ws.on('close', (code, reason) => {
        logger.debug(`WebSocket closed for session ${sessionId}: ${code} ${reason}`);
        this.cleanup(sessionId as string);
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket error for session ${sessionId}:`, error);
        this.cleanup(sessionId as string);
      });

      // Update session activity
      session.lastActivityAt = new Date();
      await session.save();

      logger.info(`VNC proxy connection established for session ${sessionId}`);
    } catch (error) {
      logger.error('Error handling WebSocket connection:', error);
      if (sessionId) {
        this.cleanup(sessionId);
      }
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * Clean up connection resources
   */
  private cleanup(sessionId: string): void {
    // Close TCP connection
    const tcpSocket = this.tcpConnections.get(sessionId);
    if (tcpSocket) {
      try {
        tcpSocket.destroy();
      } catch (error) {
        logger.warn(`Error destroying TCP socket for session ${sessionId}:`, error);
      }
      this.tcpConnections.delete(sessionId);
    }

    // Remove from connection manager
    connectionManager.removeConnection(sessionId);
  }

  /**
   * Close connection for a specific session
   */
  closeSession(sessionId: string): void {
    this.cleanup(sessionId);
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    for (const sessionId of this.tcpConnections.keys()) {
      this.cleanup(sessionId);
    }

    this.wss.close();
    logger.info('VNC proxy shut down');
  }

  /**
   * Get active connection count
   */
  getActiveConnectionCount(): number {
    return this.tcpConnections.size;
  }
}

export const createVNCProxy = (options: VNCProxyOptions): VNCProxy => {
  return new VNCProxy(options);
};

export default createVNCProxy;
