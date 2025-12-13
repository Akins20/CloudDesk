import { Client, ConnectConfig, ClientChannel } from 'ssh2';
import { SSH_CONSTANTS } from '../config/constants';
import { SSHError } from '../utils/errors';
import { logger, logSSH } from '../utils/logger';
import { SSHConfig, SSHCommandResult } from '../types';

class SSHService {
  private activeConnections: Map<string, Client> = new Map();

  /**
   * Create an SSH connection
   */
  async createConnection(config: SSHConfig): Promise<Client> {
    return new Promise((resolve, reject) => {
      const client = new Client();
      const connectionId = `${config.host}:${config.port}`;

      const connectConfig: ConnectConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: SSH_CONSTANTS.CONNECTION_TIMEOUT,
        keepaliveInterval: SSH_CONSTANTS.KEEPALIVE_INTERVAL,
        keepaliveCountMax: SSH_CONSTANTS.KEEPALIVE_COUNT_MAX,
      };

      // Set authentication method
      if (config.privateKey) {
        connectConfig.privateKey = config.privateKey;
      } else if (config.password) {
        connectConfig.password = config.password;
      } else {
        reject(new SSHError('No authentication method provided'));
        return;
      }

      // Set up event handlers
      client.on('ready', () => {
        logSSH('connection_ready', config.host);
        this.activeConnections.set(connectionId, client);
        resolve(client);
      });

      client.on('error', (err) => {
        logSSH('connection_error', config.host, { error: err.message });
        this.activeConnections.delete(connectionId);

        if (err.message.includes('Authentication failed')) {
          reject(new SSHError('SSH authentication failed. Check your credentials.'));
        } else if (err.message.includes('ECONNREFUSED')) {
          reject(new SSHError('SSH connection refused. Check if the host is reachable.'));
        } else if (err.message.includes('ETIMEDOUT')) {
          reject(new SSHError('SSH connection timed out.'));
        } else {
          reject(new SSHError(`SSH connection error: ${err.message}`));
        }
      });

      client.on('close', () => {
        logSSH('connection_closed', config.host);
        this.activeConnections.delete(connectionId);
      });

      client.on('end', () => {
        logSSH('connection_ended', config.host);
        this.activeConnections.delete(connectionId);
      });

      // Attempt connection
      logSSH('connecting', config.host, { port: config.port, username: config.username });

      try {
        client.connect(connectConfig);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reject(new SSHError(`Failed to initiate SSH connection: ${errorMessage}`));
      }
    });
  }

  /**
   * Execute a command on the remote server
   */
  async executeCommand(
    client: Client,
    command: string,
    options: { timeout?: number; sudo?: boolean } = {}
  ): Promise<SSHCommandResult> {
    const { timeout = SSH_CONSTANTS.COMMAND_TIMEOUT, sudo = false } = options;

    const finalCommand = sudo ? `sudo ${command}` : command;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new SSHError(`Command timed out after ${timeout}ms`));
      }, timeout);

      client.exec(finalCommand, (err, stream) => {
        if (err) {
          clearTimeout(timeoutId);
          reject(new SSHError(`Failed to execute command: ${err.message}`));
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code: number) => {
          clearTimeout(timeoutId);
          resolve({ stdout, stderr, code });
        });

        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        stream.on('error', (streamErr: Error) => {
          clearTimeout(timeoutId);
          reject(new SSHError(`Stream error: ${streamErr.message}`));
        });
      });
    });
  }

  /**
   * Execute multiple commands sequentially
   */
  async executeCommands(
    client: Client,
    commands: string[],
    options: { stopOnError?: boolean; sudo?: boolean } = {}
  ): Promise<SSHCommandResult[]> {
    const { stopOnError = true, sudo = false } = options;
    const results: SSHCommandResult[] = [];

    for (const command of commands) {
      try {
        const result = await this.executeCommand(client, command, { sudo });
        results.push(result);

        if (stopOnError && result.code !== 0) {
          logger.warn(`Command failed: ${command}`, { code: result.code, stderr: result.stderr });
          break;
        }
      } catch (error) {
        if (stopOnError) {
          throw error;
        }
        results.push({
          stdout: '',
          stderr: error instanceof Error ? error.message : 'Unknown error',
          code: -1,
        });
      }
    }

    return results;
  }

  /**
   * Get an interactive shell
   */
  async getShell(client: Client): Promise<ClientChannel> {
    return new Promise((resolve, reject) => {
      client.shell((err, stream) => {
        if (err) {
          reject(new SSHError(`Failed to get shell: ${err.message}`));
          return;
        }
        resolve(stream);
      });
    });
  }

  /**
   * Create SSH tunnel (port forwarding)
   */
  async createTunnel(
    client: Client,
    localPort: number,
    remoteHost: string,
    remotePort: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      client.forwardOut(
        '127.0.0.1',
        localPort,
        remoteHost,
        remotePort,
        (err, stream) => {
          if (err) {
            reject(new SSHError(`Failed to create tunnel: ${err.message}`));
            return;
          }

          logSSH('tunnel_created', remoteHost, {
            localPort,
            remotePort,
          });

          stream.on('close', () => {
            logSSH('tunnel_closed', remoteHost, { localPort, remotePort });
          });

          resolve();
        }
      );
    });
  }

  /**
   * Test SSH connection
   */
  async testConnection(config: SSHConfig): Promise<boolean> {
    let client: Client | null = null;

    try {
      client = await this.createConnection(config);

      // Execute a simple command to verify the connection
      const result = await this.executeCommand(client, 'echo "Connection successful"');

      return result.code === 0;
    } catch (error) {
      logger.warn('SSH connection test failed:', error);
      return false;
    } finally {
      if (client) {
        this.closeConnection(client);
      }
    }
  }

  /**
   * Close an SSH connection
   */
  closeConnection(client: Client): void {
    try {
      client.end();
    } catch (error) {
      logger.warn('Error closing SSH connection:', error);
    }
  }

  /**
   * Close all active connections
   */
  closeAllConnections(): void {
    for (const [connectionId, client] of this.activeConnections) {
      try {
        client.end();
        logSSH('connection_closed', connectionId);
      } catch (error) {
        logger.warn(`Error closing connection ${connectionId}:`, error);
      }
    }
    this.activeConnections.clear();
  }

  /**
   * Get active connection count
   */
  getActiveConnectionCount(): number {
    return this.activeConnections.size;
  }

  /**
   * Check if connection is still active
   */
  isConnectionActive(client: Client): boolean {
    try {
      // Check if the client's underlying socket is still writable
      return client && (client as unknown as { _sock?: { writable?: boolean } })._sock?.writable === true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const sshService = new SSHService();

export default sshService;
