import { Client, ClientChannel } from 'ssh2';
import { EventEmitter } from 'events';

export interface TerminalSession {
  id: string;
  userId: string;
  instanceId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  createdAt: Date;
  lastActivity: Date;
  cols: number;
  rows: number;
}

export interface TerminalDimensions {
  cols: number;
  rows: number;
}

interface ActiveTerminal {
  sshClient: Client;
  shell: ClientChannel;
  userId: string;
  instanceId: string;
  createdAt: Date;
  lastActivity: Date;
  cols: number;
  rows: number;
  onData: (data: string) => void;
  onClose: () => void;
}

class TerminalService extends EventEmitter {
  private activeTerminals: Map<string, ActiveTerminal> = new Map();
  private idleTimeout: number = 30 * 60 * 1000; // 30 minutes

  constructor() {
    super();
    // Start idle terminal cleanup
    setInterval(() => this.cleanupIdleTerminals(), 60000);
  }

  /**
   * Create a new terminal session
   */
  async createTerminal(
    id: string,
    sshClient: Client,
    userId: string,
    instanceId: string,
    dimensions: TerminalDimensions,
    onData: (data: string) => void,
    onClose: () => void
  ): Promise<TerminalSession> {
    return new Promise((resolve, reject) => {
      sshClient.shell(
        {
          term: 'xterm-256color',
          cols: dimensions.cols || 80,
          rows: dimensions.rows || 24,
        },
        (err, stream) => {
          if (err) {
            reject(new Error(`Failed to create terminal: ${err.message}`));
            return;
          }

          const terminal: ActiveTerminal = {
            sshClient,
            shell: stream,
            userId,
            instanceId,
            createdAt: new Date(),
            lastActivity: new Date(),
            cols: dimensions.cols || 80,
            rows: dimensions.rows || 24,
            onData,
            onClose,
          };

          // Handle data from terminal
          stream.on('data', (data: Buffer) => {
            terminal.lastActivity = new Date();
            onData(data.toString('utf-8'));
          });

          // Handle terminal close
          stream.on('close', () => {
            this.closeTerminal(id);
            onClose();
          });

          stream.on('error', (err: Error) => {
            console.error(`[Terminal] Stream error for ${id}:`, err.message);
            this.closeTerminal(id);
            onClose();
          });

          this.activeTerminals.set(id, terminal);

          resolve({
            id,
            userId,
            instanceId,
            status: 'connected',
            createdAt: terminal.createdAt,
            lastActivity: terminal.lastActivity,
            cols: terminal.cols,
            rows: terminal.rows,
          });
        }
      );
    });
  }

  /**
   * Write data to terminal
   */
  writeToTerminal(id: string, data: string): boolean {
    const terminal = this.activeTerminals.get(id);
    if (!terminal || !terminal.shell) {
      return false;
    }

    terminal.lastActivity = new Date();
    terminal.shell.write(data);
    return true;
  }

  /**
   * Resize terminal
   */
  resizeTerminal(id: string, dimensions: TerminalDimensions): boolean {
    const terminal = this.activeTerminals.get(id);
    if (!terminal || !terminal.shell) {
      return false;
    }

    terminal.cols = dimensions.cols;
    terminal.rows = dimensions.rows;
    terminal.shell.setWindow(dimensions.rows, dimensions.cols, 0, 0);
    return true;
  }

  /**
   * Close terminal session
   */
  closeTerminal(id: string): void {
    const terminal = this.activeTerminals.get(id);
    if (!terminal) {
      return;
    }

    try {
      if (terminal.shell) {
        terminal.shell.end();
      }
      if (terminal.sshClient) {
        terminal.sshClient.end();
      }
    } catch (err) {
      console.error(`[Terminal] Error closing terminal ${id}:`, err);
    }

    this.activeTerminals.delete(id);
    this.emit('terminal:closed', id);
  }

  /**
   * Get terminal status
   */
  getTerminalStatus(id: string): TerminalSession | null {
    const terminal = this.activeTerminals.get(id);
    if (!terminal) {
      return null;
    }

    return {
      id,
      userId: terminal.userId,
      instanceId: terminal.instanceId,
      status: 'connected',
      createdAt: terminal.createdAt,
      lastActivity: terminal.lastActivity,
      cols: terminal.cols,
      rows: terminal.rows,
    };
  }

  /**
   * Get all active terminals for a user
   */
  getTerminalsForUser(userId: string): TerminalSession[] {
    const terminals: TerminalSession[] = [];

    for (const [id, terminal] of this.activeTerminals) {
      if (terminal.userId === userId) {
        terminals.push({
          id,
          userId: terminal.userId,
          instanceId: terminal.instanceId,
          status: 'connected',
          createdAt: terminal.createdAt,
          lastActivity: terminal.lastActivity,
          cols: terminal.cols,
          rows: terminal.rows,
        });
      }
    }

    return terminals;
  }

  /**
   * Get all active terminals for an instance
   */
  getTerminalsForInstance(instanceId: string): TerminalSession[] {
    const terminals: TerminalSession[] = [];

    for (const [id, terminal] of this.activeTerminals) {
      if (terminal.instanceId === instanceId) {
        terminals.push({
          id,
          userId: terminal.userId,
          instanceId: terminal.instanceId,
          status: 'connected',
          createdAt: terminal.createdAt,
          lastActivity: terminal.lastActivity,
          cols: terminal.cols,
          rows: terminal.rows,
        });
      }
    }

    return terminals;
  }

  /**
   * Cleanup idle terminals
   */
  private cleanupIdleTerminals(): void {
    const now = Date.now();

    for (const [id, terminal] of this.activeTerminals) {
      const idleTime = now - terminal.lastActivity.getTime();
      if (idleTime > this.idleTimeout) {
        console.log(`[Terminal] Closing idle terminal ${id} (idle for ${Math.floor(idleTime / 1000)}s)`);
        terminal.onClose();
        this.closeTerminal(id);
      }
    }
  }

  /**
   * Cleanup all terminals for an instance
   */
  cleanupForInstance(instanceId: string): void {
    for (const [id, terminal] of this.activeTerminals) {
      if (terminal.instanceId === instanceId) {
        terminal.onClose();
        this.closeTerminal(id);
      }
    }
  }

  /**
   * Cleanup all terminals
   */
  cleanup(): void {
    for (const [id, terminal] of this.activeTerminals) {
      terminal.onClose();
      this.closeTerminal(id);
    }
  }
}

export const terminalService = new TerminalService();
export default terminalService;
