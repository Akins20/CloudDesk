import http from 'http';
import net from 'net';
import WebSocket, { WebSocketServer } from 'ws';
import { Client as SSHClient } from 'ssh2';
import jwt from 'jsonwebtoken';

interface WorkerConfig {
  sessionId: string;
  userId: string;
  instanceId: string;
  sshConfig: {
    host: string;
    port: number;
    username: string;
    authType: 'key' | 'password';
    credential: string;
  };
  desktopEnvironment: 'xfce' | 'lxde';
  jwtSecret: string;
  port: number;
}

export class SessionWorker {
  private config: WorkerConfig;
  private sshClient: SSHClient | null = null;
  private tunnelServer: net.Server | null = null;
  private tunnelPort: number = 0;
  private httpServer: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private vncPort: number = 0;
  private displayNumber: number = 0;

  constructor(config: WorkerConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    console.log('[Worker] Starting session worker...');

    // 1. Establish SSH connection
    console.log('[Worker] Connecting to SSH...');
    this.sshClient = await this.connectSSH();
    console.log('[Worker] SSH connected');

    // 2. Check/provision VNC on remote
    console.log('[Worker] Checking VNC installation...');
    await this.ensureVNC();

    // 3. Start VNC server on remote
    console.log('[Worker] Starting VNC server...');
    this.displayNumber = await this.startRemoteVNC();
    this.vncPort = 5900 + this.displayNumber;
    console.log(`[Worker] VNC started on display :${this.displayNumber} (port ${this.vncPort})`);

    // 4. Create SSH tunnel to VNC port
    console.log('[Worker] Creating SSH tunnel...');
    this.tunnelPort = await this.createTunnel(this.vncPort);
    console.log(`[Worker] Tunnel created on local port ${this.tunnelPort}`);

    // 5. Start WebSocket server
    console.log('[Worker] Starting WebSocket server...');
    await this.startWebSocketServer();
    console.log(`[Worker] WebSocket server listening on port ${this.config.port}`);
  }

  private async connectSSH(): Promise<SSHClient> {
    return new Promise((resolve, reject) => {
      const client = new SSHClient();

      const timeout = setTimeout(() => {
        client.end();
        reject(new Error('SSH connection timeout'));
      }, 30000);

      client.on('ready', () => {
        clearTimeout(timeout);
        resolve(client);
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      const connectConfig: Parameters<SSHClient['connect']>[0] = {
        host: this.config.sshConfig.host,
        port: this.config.sshConfig.port,
        username: this.config.sshConfig.username,
        readyTimeout: 30000,
      };

      if (this.config.sshConfig.authType === 'key') {
        connectConfig.privateKey = this.config.sshConfig.credential;
      } else {
        connectConfig.password = this.config.sshConfig.credential;
      }

      client.connect(connectConfig);
    });
  }

  private async execCommand(command: string): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      if (!this.sshClient) {
        reject(new Error('SSH client not connected'));
        return;
      }

      this.sshClient.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        stream.on('close', (code: number) => {
          resolve({ stdout, stderr, code: code || 0 });
        });
      });
    });
  }

  private async ensureVNC(): Promise<void> {
    // Check if TigerVNC is installed
    const { code } = await this.execCommand('which vncserver');

    if (code !== 0) {
      console.log('[Worker] VNC not installed, installing...');

      // Install TigerVNC and desktop environment
      const installCommands = [
        'sudo apt-get update',
        'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tigervnc-standalone-server tigervnc-common',
        this.config.desktopEnvironment === 'xfce'
          ? 'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y xfce4 xfce4-goodies dbus-x11'
          : 'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y lxde dbus-x11',
      ];

      for (const cmd of installCommands) {
        const result = await this.execCommand(cmd);
        if (result.code !== 0) {
          throw new Error(`Failed to run: ${cmd}\n${result.stderr}`);
        }
      }
    }

    // Create xstartup file
    const xstartup = this.config.desktopEnvironment === 'xfce'
      ? `#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
exec startxfce4`
      : `#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
exec startlxde`;

    await this.execCommand('mkdir -p ~/.vnc');
    await this.execCommand(`cat > ~/.vnc/xstartup << 'XSTARTUP_EOF'
${xstartup}
XSTARTUP_EOF`);
    await this.execCommand('chmod +x ~/.vnc/xstartup');
  }

  private async startRemoteVNC(): Promise<number> {
    // Kill any existing VNC servers
    await this.execCommand('vncserver -kill :* 2>/dev/null || true');

    // Find available display number
    let displayNumber = 1;
    for (let i = 1; i <= 99; i++) {
      const { code } = await this.execCommand(`[ -f /tmp/.X${i}-lock ] && echo exists`);
      if (code !== 0) {
        displayNumber = i;
        break;
      }
    }

    // Start VNC server with security settings
    const startCmd = `vncserver :${displayNumber} -geometry 1920x1080 -depth 24 -localhost yes -SecurityTypes None 2>&1`;
    const result = await this.execCommand(startCmd);

    if (result.code !== 0 && !result.stdout.includes('desktop is')) {
      throw new Error(`Failed to start VNC server: ${result.stderr || result.stdout}`);
    }

    return displayNumber;
  }

  private async createTunnel(remotePort: number): Promise<number> {
    // Use a fixed local port inside container
    const localPort = 6001;

    return new Promise((resolve, reject) => {
      this.tunnelServer = net.createServer((socket) => {
        this.sshClient!.forwardOut(
          socket.remoteAddress || '127.0.0.1',
          socket.remotePort || 0,
          '127.0.0.1',
          remotePort,
          (err, stream) => {
            if (err) {
              console.error('[Worker] Tunnel forward error:', err);
              socket.end();
              return;
            }

            socket.pipe(stream).pipe(socket);

            socket.on('error', (err) => {
              console.warn('[Worker] Tunnel socket error:', err.message);
              stream.end();
            });

            stream.on('error', (err: Error) => {
              console.warn('[Worker] Tunnel stream error:', err.message);
              socket.end();
            });

            socket.on('close', () => stream.end());
            stream.on('close', () => socket.end());
          }
        );
      });

      this.tunnelServer.on('error', (err) => {
        reject(err);
      });

      this.tunnelServer.listen(localPort, '127.0.0.1', () => {
        resolve(localPort);
      });
    });
  }

  private async startWebSocketServer(): Promise<void> {
    this.httpServer = http.createServer((req, res) => {
      // Health check endpoint
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', sessionId: this.config.sessionId }));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    this.wss = new WebSocketServer({
      server: this.httpServer,
      path: '/vnc',
      verifyClient: (info, callback) => {
        try {
          const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
          const token = url.searchParams.get('token');
          const sessionId = url.searchParams.get('sessionId');

          if (!token || sessionId !== this.config.sessionId) {
            callback(false, 401, 'Unauthorized');
            return;
          }

          // Verify JWT
          const payload = jwt.verify(token, this.config.jwtSecret) as { userId: string };
          if (payload.userId !== this.config.userId) {
            callback(false, 403, 'Forbidden');
            return;
          }

          callback(true);
        } catch (err) {
          console.error('[Worker] WebSocket auth error:', err);
          callback(false, 401, 'Invalid token');
        }
      },
    });

    this.wss.on('connection', (ws) => {
      console.log('[Worker] WebSocket client connected');

      // Connect to local tunnel
      const tcpSocket = net.createConnection({
        host: '127.0.0.1',
        port: this.tunnelPort,
      });

      tcpSocket.on('connect', () => {
        console.log('[Worker] TCP connection to tunnel established');
      });

      tcpSocket.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      ws.on('message', (data) => {
        if (tcpSocket.writable) {
          tcpSocket.write(data as Buffer);
        }
      });

      ws.on('close', () => {
        console.log('[Worker] WebSocket client disconnected');
        tcpSocket.destroy();
      });

      tcpSocket.on('close', () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });

      tcpSocket.on('error', (err) => {
        console.error('[Worker] TCP socket error:', err.message);
        ws.close();
      });

      ws.on('error', (err) => {
        console.error('[Worker] WebSocket error:', err.message);
        tcpSocket.destroy();
      });
    });

    return new Promise((resolve) => {
      this.httpServer!.listen(this.config.port, () => {
        resolve();
      });
    });
  }

  async shutdown(): Promise<void> {
    console.log('[Worker] Shutting down...');

    // Close WebSocket connections
    if (this.wss) {
      this.wss.clients.forEach((client) => {
        client.close(1000, 'Server shutting down');
      });
      this.wss.close();
      this.wss = null;
    }

    // Close HTTP server
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }

    // Close tunnel
    if (this.tunnelServer) {
      this.tunnelServer.close();
      this.tunnelServer = null;
    }

    // Kill VNC server on remote
    if (this.sshClient && this.displayNumber > 0) {
      try {
        await this.execCommand(`vncserver -kill :${this.displayNumber}`);
      } catch (err) {
        console.warn('[Worker] Failed to kill VNC server:', err);
      }
    }

    // Close SSH connection
    if (this.sshClient) {
      this.sshClient.end();
      this.sshClient = null;
    }

    console.log('[Worker] Shutdown complete');
  }
}
