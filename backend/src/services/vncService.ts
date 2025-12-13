import { Client } from 'ssh2';
import { VNC_CONSTANTS } from '../config/constants';
import { VNCError } from '../utils/errors';
import { logger, logVNC } from '../utils/logger';
import { sshService } from './sshService';

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
      // Check for running VNC processes - extract display number which follows Xvnc/Xtigervnc
      const result = await sshService.executeCommand(
        client,
        "ps aux | grep -E 'Xvnc|Xtigervnc' | grep -v grep | grep -oE ' :[0-9]+' | tr -d ' :' | sort -u"
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
      xfce: `#!/bin/sh
# TigerVNC xstartup for headless XFCE

unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS

[ -r \$HOME/.Xresources ] && xrdb \$HOME/.Xresources

# Start XFCE in background
startxfce4 &
XFCE_PID=\$!

# Wait then kill problematic apps that crash on headless
sleep 3
pkill -9 light-locker 2>/dev/null
pkill -9 xscreensaver 2>/dev/null
pkill -9 gnome-screensaver 2>/dev/null

# Wait for XFCE
wait \$XFCE_PID`,
      lxde: `#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XDG_SESSION_TYPE=x11
export XDG_CURRENT_DESKTOP=LXDE

# Start dbus if not running
if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
    eval $(dbus-launch --sh-syntax)
fi

exec startlxde`,
    };

    try {
      // Create .vnc directory
      await sshService.executeCommand(client, 'mkdir -p ~/.vnc');

      // Write xstartup file using cat with heredoc for proper multiline handling
      const content = xstartupContent[desktop];

      // Use base64 encoding to avoid shell escaping issues
      const base64Content = Buffer.from(content).toString('base64');
      await sshService.executeCommand(
        client,
        `echo "${base64Content}" | base64 -d > ~/.vnc/xstartup`
      );

      // Make executable
      await sshService.executeCommand(client, 'chmod +x ~/.vnc/xstartup');

      // Disable light-locker autostart if it exists
      await sshService.executeCommand(
        client,
        'mkdir -p ~/.config/autostart && echo "[Desktop Entry]\\nHidden=true" > ~/.config/autostart/light-locker.desktop 2>/dev/null || true'
      );

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

      // Kill any existing VNC server on this display first
      await sshService.executeCommand(client, `vncserver -kill :${displayNumber} 2>/dev/null || true`);

      // Start VNC server with no authentication (security is handled by our WebSocket proxy)
      const startCommand = `vncserver :${displayNumber} -geometry ${geometry} -depth ${depth} -SecurityTypes None 2>&1`;
      logger.info('Starting VNC server with command:', startCommand);
      const result = await sshService.executeCommand(client, startCommand);

      logger.info('VNC server start result:', {
        code: result.code,
        stdout: result.stdout,
        stderr: result.stderr
      });

      if (result.code !== 0 && !result.stderr.includes('already running') && !result.stdout.includes('already running')) {
        logger.error('VNC server start failed:', { stdout: result.stdout, stderr: result.stderr });
        throw new VNCError(`Failed to start VNC server: ${result.stderr || result.stdout}`);
      }

      // Verify the server started - wait a bit longer
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check running displays with more verbose logging
      const newRunningDisplays = await this.getRunningVNCDisplays(client);
      logger.info('Running VNC displays after start:', newRunningDisplays);

      if (!newRunningDisplays.includes(displayNumber)) {
        // Check VNC log file for errors
        const logResult = await sshService.executeCommand(
          client,
          `cat ~/.vnc/*.log 2>/dev/null | tail -20 || echo "No VNC logs found"`
        );
        logger.error('VNC log contents:', logResult.stdout);

        throw new VNCError(`VNC server failed to start - display :${displayNumber} not found. Check VNC logs: ${logResult.stdout.substring(0, 500)}`);
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
