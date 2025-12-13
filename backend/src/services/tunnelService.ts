import net from 'net';
import { Client } from 'ssh2';
import { env } from '../config/environment';
import { TunnelError } from '../utils/errors';
import { logger } from '../utils/logger';
import { TunnelInfo } from '../types';
import { findAvailablePort } from '../utils/helpers';

interface ActiveTunnel {
  info: TunnelInfo;
  server: net.Server;
  sshClient: Client;
}

class TunnelService {
  private activeTunnels: Map<number, ActiveTunnel> = new Map();
  private usedPorts: Set<number> = new Set();

  /**
   * Create an SSH tunnel for VNC connection
   */
  async createTunnel(
    sshClient: Client,
    remoteHost: string,
    remotePort: number,
    instanceId: string,
    sessionId: string
  ): Promise<TunnelInfo> {
    // Find available local port
    const localPort = findAvailablePort(
      env.TUNNEL_PORT_RANGE_START,
      env.TUNNEL_PORT_RANGE_END,
      this.usedPorts
    );

    if (localPort === null) {
      throw new TunnelError('No available ports for tunnel');
    }

    return new Promise((resolve, reject) => {
      // Create local TCP server
      const server = net.createServer((socket) => {
        // For each incoming connection, create a forwarded connection
        sshClient.forwardOut(
          socket.remoteAddress || '127.0.0.1',
          socket.remotePort || 0,
          remoteHost,
          remotePort,
          (err, stream) => {
            if (err) {
              logger.error('Tunnel forward error:', err);
              socket.end();
              return;
            }

            // Pipe data between local socket and SSH stream
            socket.pipe(stream).pipe(socket);

            socket.on('error', (socketErr) => {
              logger.warn('Tunnel socket error:', socketErr);
              stream.end();
            });

            stream.on('error', (streamErr: Error) => {
              logger.warn('Tunnel stream error:', streamErr);
              socket.end();
            });

            socket.on('close', () => {
              stream.end();
            });

            stream.on('close', () => {
              socket.end();
            });
          }
        );
      });

      server.on('error', (err) => {
        logger.error('Tunnel server error:', err);
        this.usedPorts.delete(localPort);
        reject(new TunnelError(`Failed to create tunnel: ${err.message}`));
      });

      server.listen(localPort, '127.0.0.1', () => {
        const tunnelInfo: TunnelInfo = {
          localPort,
          remotePort,
          instanceId,
          sessionId,
          createdAt: new Date(),
        };

        // Store tunnel info
        this.activeTunnels.set(localPort, {
          info: tunnelInfo,
          server,
          sshClient,
        });
        this.usedPorts.add(localPort);

        logger.info(`Tunnel created: local ${localPort} -> remote ${remoteHost}:${remotePort}`);
        resolve(tunnelInfo);
      });
    });
  }

  /**
   * Close a tunnel by local port
   */
  async closeTunnel(localPort: number): Promise<void> {
    const tunnel = this.activeTunnels.get(localPort);

    if (!tunnel) {
      logger.warn(`Tunnel not found on port ${localPort}`);
      return;
    }

    return new Promise((resolve) => {
      tunnel.server.close(() => {
        this.activeTunnels.delete(localPort);
        this.usedPorts.delete(localPort);
        logger.info(`Tunnel closed on port ${localPort}`);
        resolve();
      });
    });
  }

  /**
   * Close tunnel by session ID
   */
  async closeTunnelBySession(sessionId: string): Promise<void> {
    for (const [localPort, tunnel] of this.activeTunnels) {
      if (tunnel.info.sessionId === sessionId) {
        await this.closeTunnel(localPort);
        return;
      }
    }
  }

  /**
   * Close all tunnels for an instance
   */
  async closeTunnelsByInstance(instanceId: string): Promise<void> {
    const tunnelsToClose: number[] = [];

    for (const [localPort, tunnel] of this.activeTunnels) {
      if (tunnel.info.instanceId === instanceId) {
        tunnelsToClose.push(localPort);
      }
    }

    for (const port of tunnelsToClose) {
      await this.closeTunnel(port);
    }
  }

  /**
   * Get tunnel info by local port
   */
  getTunnelInfo(localPort: number): TunnelInfo | null {
    const tunnel = this.activeTunnels.get(localPort);
    return tunnel ? tunnel.info : null;
  }

  /**
   * Get tunnel by session ID
   */
  getTunnelBySession(sessionId: string): TunnelInfo | null {
    for (const tunnel of this.activeTunnels.values()) {
      if (tunnel.info.sessionId === sessionId) {
        return tunnel.info;
      }
    }
    return null;
  }

  /**
   * Get all active tunnels
   */
  getActiveTunnels(): TunnelInfo[] {
    return Array.from(this.activeTunnels.values()).map((t) => t.info);
  }

  /**
   * Get active tunnel count
   */
  getActiveTunnelCount(): number {
    return this.activeTunnels.size;
  }

  /**
   * Check if tunnel is active
   */
  isTunnelActive(localPort: number): boolean {
    return this.activeTunnels.has(localPort);
  }

  /**
   * Close all tunnels
   */
  async closeAllTunnels(): Promise<void> {
    const ports = Array.from(this.activeTunnels.keys());

    for (const port of ports) {
      await this.closeTunnel(port);
    }

    logger.info('All tunnels closed');
  }

  /**
   * Health check for a tunnel
   */
  isTunnelHealthy(localPort: number): boolean {
    const tunnel = this.activeTunnels.get(localPort);

    if (!tunnel) {
      return false;
    }

    // Check if the server is still listening
    return tunnel.server.listening;
  }
}

// Export singleton instance
export const tunnelService = new TunnelService();

export default tunnelService;
