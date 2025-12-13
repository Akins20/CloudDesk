import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { WSConnectionInfo } from '../types';

interface ConnectionEntry {
  ws: WebSocket;
  info: WSConnectionInfo;
  isAlive: boolean;
  missedPongs: number;
}

class ConnectionManager {
  private connections: Map<string, ConnectionEntry> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 60000; // 60 seconds
  private readonly MAX_MISSED_PONGS = 3; // Allow 3 missed pongs before disconnect

  /**
   * Start the heartbeat checker
   */
  startHeartbeat(): void {
    if (this.heartbeatInterval) {
      return;
    }

    this.heartbeatInterval = setInterval(() => {
      this.checkConnections();
    }, this.HEARTBEAT_INTERVAL);

    logger.info('WebSocket heartbeat started');
  }

  /**
   * Stop the heartbeat checker
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      logger.info('WebSocket heartbeat stopped');
    }
  }

  /**
   * Add a new connection
   */
  addConnection(sessionId: string, ws: WebSocket, info: WSConnectionInfo): void {
    // Close existing connection if any
    this.removeConnection(sessionId);

    const entry: ConnectionEntry = {
      ws,
      info,
      isAlive: true,
      missedPongs: 0,
    };

    this.connections.set(sessionId, entry);

    // Set up ping/pong handlers
    ws.on('pong', () => {
      const conn = this.connections.get(sessionId);
      if (conn) {
        conn.isAlive = true;
        conn.missedPongs = 0;
      }
    });

    logger.debug(`WebSocket connection added: ${sessionId}`);
  }

  /**
   * Remove a connection
   */
  removeConnection(sessionId: string): void {
    const entry = this.connections.get(sessionId);

    if (entry) {
      try {
        if (entry.ws.readyState === WebSocket.OPEN) {
          entry.ws.close();
        }
      } catch (error) {
        logger.warn(`Error closing WebSocket for session ${sessionId}:`, error);
      }

      this.connections.delete(sessionId);
      logger.debug(`WebSocket connection removed: ${sessionId}`);
    }
  }

  /**
   * Get connection by session ID
   */
  getConnection(sessionId: string): WebSocket | null {
    const entry = this.connections.get(sessionId);
    return entry?.ws || null;
  }

  /**
   * Get connection info by session ID
   */
  getConnectionInfo(sessionId: string): WSConnectionInfo | null {
    const entry = this.connections.get(sessionId);
    return entry?.info || null;
  }

  /**
   * Check if a connection exists
   */
  hasConnection(sessionId: string): boolean {
    return this.connections.has(sessionId);
  }

  /**
   * Get all connections for a user
   */
  getConnectionsByUser(userId: string): Array<{ sessionId: string; info: WSConnectionInfo }> {
    const result: Array<{ sessionId: string; info: WSConnectionInfo }> = [];

    for (const [sessionId, entry] of this.connections) {
      if (entry.info.userId === userId) {
        result.push({ sessionId, info: entry.info });
      }
    }

    return result;
  }

  /**
   * Close all connections for a user
   */
  closeConnectionsByUser(userId: string): number {
    let closedCount = 0;

    for (const [sessionId, entry] of this.connections) {
      if (entry.info.userId === userId) {
        this.removeConnection(sessionId);
        closedCount++;
      }
    }

    return closedCount;
  }

  /**
   * Get total connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Check connections and remove dead ones
   */
  private checkConnections(): void {
    for (const [sessionId, entry] of this.connections) {
      if (!entry.isAlive) {
        entry.missedPongs++;
        logger.debug(`Session ${sessionId} missed pong (${entry.missedPongs}/${this.MAX_MISSED_PONGS})`);

        if (entry.missedPongs >= this.MAX_MISSED_PONGS) {
          logger.warn(`WebSocket connection dead after ${this.MAX_MISSED_PONGS} missed pongs, removing: ${sessionId}`);
          this.removeConnection(sessionId);
          continue;
        }
      }

      // Mark as not alive, will be set to true on pong
      entry.isAlive = false;

      // Send ping
      try {
        if (entry.ws.readyState === WebSocket.OPEN) {
          entry.ws.ping();
        }
      } catch (error) {
        logger.warn(`Error sending ping to session ${sessionId}:`, error);
        this.removeConnection(sessionId);
      }
    }
  }

  /**
   * Send message to a specific session
   */
  sendToSession(sessionId: string, message: unknown): boolean {
    const entry = this.connections.get(sessionId);

    if (!entry || entry.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      entry.ws.send(data);
      return true;
    } catch (error) {
      logger.warn(`Error sending message to session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast message to all connections
   */
  broadcast(message: unknown): number {
    let sentCount = 0;

    for (const sessionId of this.connections.keys()) {
      if (this.sendToSession(sessionId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    for (const sessionId of this.connections.keys()) {
      this.removeConnection(sessionId);
    }

    logger.info('All WebSocket connections closed');
  }
}

// Export singleton instance
export const connectionManager = new ConnectionManager();

export default connectionManager;
