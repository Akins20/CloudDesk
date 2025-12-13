import { Client } from 'ssh2';
import { VNC_CONSTANTS } from '../config/constants';
import { VNCError } from '../utils/errors';
import { logger, logVNC } from '../utils/logger';
import { sshService } from './sshService';
import { generateRandomPassword } from '../utils/helpers';

interface VNCServerInfo {
  displayNumber: number;
  port: number;
  isRunning: boolean;
}

class VNCService {
  /**
   * Check if VNC server is installed
   */
  async isVNCInstalled(client: Client): Promise<boolean> {
    try {
      const result = await sshService.executeCommand(client, 'which vncserver || which tigervncserver');
      return result.code === 0 && result.stdout.trim().length > 0;
    } catch (error) {
      logger.warn('Error checking VNC installation:', error);
      return false;
    }
  }

  /**
   * Check if a desktop environment is installed
   */
  async isDesktopInstalled(client: Client, desktop: 'xfce' | 'lxde'): Promise<boolean> {
    try {
      const commands: Record<string, string> = {
        xfce: 'which xfce4-session',
        lxde: 'which lxsession',
      };

      const result = await sshService.executeCommand(client, commands[desktop]);
      return result.code === 0 && result.stdout.trim().length > 0;
    } catch (error) {
      logger.warn('Error checking desktop installation:', error);
      return false;
    }
  }

  /**
   * Get list of running VNC displays
   */
  async getRunningVNCDisplays(client: Client): Promise<number[]> {
    try {
      // Check for running VNC processes
      const result = await sshService.executeCommand(
        client,
        "ps aux | grep -E '[X]vnc|[X]tigervnc' | awk '{print $NF}' | grep -oE ':[0-9]+' | sed 's/://g'"
      );

      if (result.code !== 0 || !result.stdout.trim()) {
        return [];
      }

      const displays = result.stdout
        .trim()
        .split('\n')
        .map((d) => parseInt(d, 10))
        .filter((d) => !isNaN(d));

      return displays;
    } catch (error) {
      logger.warn('Error getting running VNC displays:', error);
      return [];
    }
  }

  /**
   * Get available display number
   */
  async getAvailableDisplayNumber(client: Client): Promise<number> {
    const runningDisplays = await this.getRunningVNCDisplays(client);

    for (let i = VNC_CONSTANTS.DEFAULT_DISPLAY_NUMBER; i <= VNC_CONSTANTS.MAX_DISPLAYS; i++) {
      if (!runningDisplays.includes(i)) {
        return i;
      }
    }

    throw new VNCError('No available VNC display numbers');
  }

  /**
   * Calculate VNC port from display number
   */
  getVNCPort(displayNumber: number): number {
    return VNC_CONSTANTS.BASE_PORT + displayNumber;
  }

  /**
   * Set VNC password
   */
  async setVNCPassword(client: Client, password: string): Promise<void> {
    try {
      // Create .vnc directory
      await sshService.executeCommand(client, 'mkdir -p ~/.vnc');

      // Set password using vncpasswd
      // We need to use expect or echo to stdin since vncpasswd is interactive
      const result = await sshService.executeCommand(
        client,
        `echo -e "${password}\\n${password}\\nn" | vncpasswd`
      );

      if (result.code !== 0) {
        // Try alternative method
        const altResult = await sshService.executeCommand(
          client,
          `printf "${password}\\n${password}\\n" | vncpasswd`
        );

        if (altResult.code !== 0) {
          throw new VNCError('Failed to set VNC password');
        }
      }

      logVNC('password_set', 'vnc');
    } catch (error) {
      logger.error('Error setting VNC password:', error);
      throw new VNCError('Failed to set VNC password');
    }
  }

  /**
   * Create xstartup script for desktop environment
   */
  async createXStartup(client: Client, desktop: 'xfce' | 'lxde'): Promise<void> {
    const xstartupContent: Record<string, string> = {
      xfce: `#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
exec startxfce4`,
      lxde: `#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
exec startlxde`,
    };

    try {
      // Create .vnc directory
      await sshService.executeCommand(client, 'mkdir -p ~/.vnc');

      // Write xstartup file
      const content = xstartupContent[desktop];
      const escapedContent = content.replace(/"/g, '\\"');

      await sshService.executeCommand(
        client,
        `echo "${escapedContent}" > ~/.vnc/xstartup`
      );

      // Make executable
      await sshService.executeCommand(client, 'chmod +x ~/.vnc/xstartup');

      logVNC('xstartup_created', 'vnc', { desktop });
    } catch (error) {
      logger.error('Error creating xstartup:', error);
      throw new VNCError('Failed to create xstartup script');
    }
  }

  /**
   * Start VNC server
   */
  async startVNCServer(
    client: Client,
    displayNumber: number,
    options: {
      geometry?: string;
      depth?: number;
      desktop?: 'xfce' | 'lxde';
    } = {}
  ): Promise<VNCServerInfo> {
    const {
      geometry = VNC_CONSTANTS.DEFAULT_GEOMETRY,
      depth = VNC_CONSTANTS.DEFAULT_DEPTH,
      desktop = 'xfce',
    } = options;

    try {
      // First, check if this display is already running
      const runningDisplays = await this.getRunningVNCDisplays(client);
      if (runningDisplays.includes(displayNumber)) {
        logVNC('server_already_running', 'vnc', { displayNumber });
        return {
          displayNumber,
          port: this.getVNCPort(displayNumber),
          isRunning: true,
        };
      }

      // Create xstartup for the desktop environment
      await this.createXStartup(client, desktop);

      // Generate and set VNC password if not already set
      const password = generateRandomPassword(VNC_CONSTANTS.PASSWORD_LENGTH);
      await this.setVNCPassword(client, password);

      // Start VNC server
      const startCommand = `vncserver :${displayNumber} -geometry ${geometry} -depth ${depth}`;
      const result = await sshService.executeCommand(client, startCommand);

      if (result.code !== 0 && !result.stderr.includes('already running')) {
        logger.error('VNC server start failed:', { stdout: result.stdout, stderr: result.stderr });
        throw new VNCError(`Failed to start VNC server: ${result.stderr}`);
      }

      // Verify the server started
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for server to start

      const newRunningDisplays = await this.getRunningVNCDisplays(client);
      if (!newRunningDisplays.includes(displayNumber)) {
        throw new VNCError('VNC server failed to start - display not found after startup');
      }

      const port = this.getVNCPort(displayNumber);
      logVNC('server_started', 'vnc', { displayNumber, port, geometry, depth });

      return {
        displayNumber,
        port,
        isRunning: true,
      };
    } catch (error) {
      if (error instanceof VNCError) {
        throw error;
      }
      logger.error('Error starting VNC server:', error);
      throw new VNCError('Failed to start VNC server');
    }
  }

  /**
   * Stop VNC server
   */
  async stopVNCServer(client: Client, displayNumber: number): Promise<void> {
    try {
      const result = await sshService.executeCommand(
        client,
        `vncserver -kill :${displayNumber}`
      );

      // VNC server returns code 1 if the display wasn't running
      if (result.code !== 0 && !result.stderr.includes("isn't running")) {
        logger.warn('VNC stop warning:', result.stderr);
      }

      logVNC('server_stopped', 'vnc', { displayNumber });
    } catch (error) {
      logger.error('Error stopping VNC server:', error);
      throw new VNCError('Failed to stop VNC server');
    }
  }

  /**
   * Get VNC server info
   */
  async getVNCServerInfo(client: Client, displayNumber: number): Promise<VNCServerInfo | null> {
    const runningDisplays = await this.getRunningVNCDisplays(client);

    if (!runningDisplays.includes(displayNumber)) {
      return null;
    }

    return {
      displayNumber,
      port: this.getVNCPort(displayNumber),
      isRunning: true,
    };
  }

  /**
   * Kill all VNC servers
   */
  async killAllVNCServers(client: Client): Promise<void> {
    try {
      const runningDisplays = await this.getRunningVNCDisplays(client);

      for (const displayNumber of runningDisplays) {
        await this.stopVNCServer(client, displayNumber);
      }

      logVNC('all_servers_killed', 'vnc');
    } catch (error) {
      logger.error('Error killing all VNC servers:', error);
      throw new VNCError('Failed to kill VNC servers');
    }
  }
}

// Export singleton instance
export const vncService = new VNCService();

export default vncService;
