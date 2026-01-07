import { Client } from 'ssh2';
import { Server, createServer, Socket } from 'net';
import { EventEmitter } from 'events';

export interface PortForward {
  id: string;
  userId: string;
  instanceId: string;
  localPort: number;
  remoteHost: string;
  remotePort: number;
  status: 'active' | 'stopped' | 'error';
  createdAt: Date;
  connectionCount: number;
  bytesTransferred: number;
  error?: string;
}

export interface PortForwardConfig {
  localPort: number;
  remoteHost: string;
  remotePort: number;
}

interface ActiveForward {
  server: Server;
  sshClient: Client;
  config: PortForwardConfig;
  connections: Set<Socket>;
  bytesTransferred: number;
  createdAt: Date;
}

class PortForwardingService extends EventEmitter {
  private activeForwards: Map<string, ActiveForward> = new Map();
  private usedPorts: Set<number> = new Set();

  /**
   * Create a port forward
   */
  async createForward(
    id: string,
    sshClient: Client,
    config: PortForwardConfig
  ): Promise<PortForward> {
    // Validate port availability
    if (this.usedPorts.has(config.localPort)) {
      throw new Error(`Local port ${config.localPort} is already in use`);
    }

    // Check if port is available on the system
    const isPortAvailable = await this.checkPortAvailable(config.localPort);
    if (!isPortAvailable) {
      throw new Error(`Local port ${config.localPort} is not available on the system`);
    }

    return new Promise((resolve, reject) => {
      const server = createServer((socket: Socket) => {
        this.handleConnection(id, socket);
      });

      server.on('error', (err: Error) => {
        this.cleanupForward(id);
        reject(new Error(`Failed to create port forward: ${err.message}`));
      });

      server.listen(config.localPort, '127.0.0.1', () => {
        const forward: ActiveForward = {
          server,
          sshClient,
          config,
          connections: new Set(),
          bytesTransferred: 0,
          createdAt: new Date(),
        };

        this.activeForwards.set(id, forward);
        this.usedPorts.add(config.localPort);

        resolve({
          id,
          userId: '',
          instanceId: '',
          localPort: config.localPort,
          remoteHost: config.remoteHost,
          remotePort: config.remotePort,
          status: 'active',
          createdAt: forward.createdAt,
          connectionCount: 0,
          bytesTransferred: 0,
        });
      });
    });
  }

  /**
   * Stop a port forward
   */
  stopForward(id: string): void {
    const forward = this.activeForwards.get(id);
    if (!forward) {
      return;
    }

    this.cleanupForward(id);
    this.emit('forward:stopped', id);
  }

  /**
   * Get status of a port forward
   */
  getForwardStatus(id: string): PortForward | null {
    const forward = this.activeForwards.get(id);
    if (!forward) {
      return null;
    }

    return {
      id,
      userId: '',
      instanceId: '',
      localPort: forward.config.localPort,
      remoteHost: forward.config.remoteHost,
      remotePort: forward.config.remotePort,
      status: 'active',
      createdAt: forward.createdAt,
      connectionCount: forward.connections.size,
      bytesTransferred: forward.bytesTransferred,
    };
  }

  /**
   * Get all active forwards
   */
  getAllForwards(): PortForward[] {
    const forwards: PortForward[] = [];

    for (const [id, forward] of this.activeForwards) {
      forwards.push({
        id,
        userId: '',
        instanceId: '',
        localPort: forward.config.localPort,
        remoteHost: forward.config.remoteHost,
        remotePort: forward.config.remotePort,
        status: 'active',
        createdAt: forward.createdAt,
        connectionCount: forward.connections.size,
        bytesTransferred: forward.bytesTransferred,
      });
    }

    return forwards;
  }

  /**
   * Get a free local port
   */
  async getAvailablePort(startPort: number = 10000, endPort: number = 60000): Promise<number> {
    for (let port = startPort; port <= endPort; port++) {
      if (!this.usedPorts.has(port)) {
        const isAvailable = await this.checkPortAvailable(port);
        if (isAvailable) {
          return port;
        }
      }
    }
    throw new Error('No available ports');
  }

  /**
   * Handle incoming connection to the local server
   */
  private handleConnection(forwardId: string, socket: Socket): void {
    const forward = this.activeForwards.get(forwardId);
    if (!forward) {
      socket.destroy();
      return;
    }

    const { sshClient, config, connections } = forward;

    // Create SSH tunnel channel
    sshClient.forwardOut(
      socket.remoteAddress || '127.0.0.1',
      socket.remotePort || 0,
      config.remoteHost,
      config.remotePort,
      (err, stream) => {
        if (err) {
          console.error(`[PortForward] SSH tunnel error for ${forwardId}:`, err.message);
          socket.destroy();
          return;
        }

        // Track connection
        connections.add(socket);
        this.emit('forward:connection', forwardId, connections.size);

        // Pipe data both ways
        socket.pipe(stream);
        stream.pipe(socket);

        // Track bytes
        socket.on('data', (data: Buffer) => {
          forward.bytesTransferred += data.length;
        });
        stream.on('data', (data: Buffer) => {
          forward.bytesTransferred += data.length;
        });

        // Cleanup on close
        const cleanup = () => {
          connections.delete(socket);
          stream.destroy();
          socket.destroy();
          this.emit('forward:disconnection', forwardId, connections.size);
        };

        socket.on('close', cleanup);
        socket.on('error', cleanup);
        stream.on('close', cleanup);
        stream.on('error', cleanup);
      }
    );
  }

  /**
   * Cleanup a forward
   */
  private cleanupForward(id: string): void {
    const forward = this.activeForwards.get(id);
    if (!forward) {
      return;
    }

    // Close all connections
    for (const socket of forward.connections) {
      socket.destroy();
    }
    forward.connections.clear();

    // Close server
    forward.server.close();

    // Release port
    this.usedPorts.delete(forward.config.localPort);

    // Remove from map
    this.activeForwards.delete(id);
  }

  /**
   * Check if a port is available
   */
  private checkPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer();

      server.once('error', () => {
        resolve(false);
      });

      server.once('listening', () => {
        server.close(() => {
          resolve(true);
        });
      });

      server.listen(port, '127.0.0.1');
    });
  }

  /**
   * Cleanup all forwards for an instance
   */
  cleanupForInstance(instanceId: string): void {
    for (const [id, _forward] of this.activeForwards) {
      // In production, check if forward belongs to instance
      // For now, we'd need to track this separately
      this.stopForward(id);
    }
  }

  /**
   * Cleanup all forwards
   */
  cleanup(): void {
    for (const [id] of this.activeForwards) {
      this.stopForward(id);
    }
  }
}

export const portForwardingService = new PortForwardingService();
export default portForwardingService;
