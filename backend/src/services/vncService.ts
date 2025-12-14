import { Client } from 'ssh2';
import crypto from 'crypto';
import { VNC_CONSTANTS } from '../config/constants';
import { VNCError } from '../utils/errors';
import { logger, logVNC } from '../utils/logger';
import { sshService } from './sshService';

/**
 * Validate and sanitize VNC password
 * VNC passwords are limited to 8 characters by the protocol
 */
function sanitizeVNCPassword(password: string): string {
  // VNC protocol only uses first 8 characters
  const sanitized = password.slice(0, 8);

  // Ensure password only contains safe characters (alphanumeric)
  if (!/^[a-zA-Z0-9]+$/.test(sanitized)) {
    throw new VNCError('VNC password must contain only alphanumeric characters');
  }

  if (sanitized.length < 6) {
    throw new VNCError('VNC password must be at least 6 characters');
  }

  return sanitized;
}

/**
 * Generate a secure random VNC password
 */
function generateVNCPassword(): string {
  // Generate 8 random alphanumeric characters
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  const randomBytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

/**
 * Validate display number to prevent command injection
 */
function validateDisplayNumber(displayNumber: number): number {
  if (!Number.isInteger(displayNumber) || displayNumber < 1 || displayNumber > 99) {
    throw new VNCError('Invalid display number');
  }
  return displayNumber;
}

/**
 * Validate geometry string to prevent command injection
 */
function validateGeometry(geometry: string): string {
  if (!/^\d{3,4}x\d{3,4}$/.test(geometry)) {
    throw new VNCError('Invalid geometry format');
  }
  return geometry;
}

/**
 * Validate depth to prevent command injection
 */
function validateDepth(depth: number): number {
  const validDepths = [8, 16, 24, 32];
  if (!validDepths.includes(depth)) {
    throw new VNCError('Invalid color depth');
  }
  return depth;
}

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
   * Set VNC password securely
   * Uses a temporary file approach to avoid command injection
   */
  async setVNCPassword(client: Client, password?: string): Promise<string> {
    try {
      // Generate a secure password if not provided
      const vncPassword = password ? sanitizeVNCPassword(password) : generateVNCPassword();

      // Create .vnc directory
      await sshService.executeCommand(client, 'mkdir -p ~/.vnc');

      // Create a temporary file with random name for the password
      const tempFile = `/tmp/.vncpwd_${crypto.randomBytes(8).toString('hex')}`;

      // Write password to temp file using base64 to avoid any shell escaping issues
      const base64Password = Buffer.from(`${vncPassword}\n${vncPassword}\nn\n`).toString('base64');
      await sshService.executeCommand(
        client,
        `echo "${base64Password}" | base64 -d > ${tempFile} && chmod 600 ${tempFile}`
      );

      // Use the temp file as input to vncpasswd
      const result = await sshService.executeCommand(
        client,
        `cat ${tempFile} | vncpasswd; rm -f ${tempFile}`
      );

      // Always clean up temp file even on error
      await sshService.executeCommand(client, `rm -f ${tempFile} 2>/dev/null || true`);

      if (result.code !== 0) {
        throw new VNCError('Failed to set VNC password');
      }

      // Set proper permissions on passwd file
      await sshService.executeCommand(client, 'chmod 600 ~/.vnc/passwd');

      logVNC('password_set', 'vnc');
      return vncPassword;
    } catch (error) {
      if (error instanceof VNCError) {
        throw error;
      }
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
    // Validate all inputs to prevent command injection
    const validatedDisplay = validateDisplayNumber(displayNumber);
    const validatedGeometry = validateGeometry(options.geometry || VNC_CONSTANTS.DEFAULT_GEOMETRY);
    const validatedDepth = validateDepth(options.depth || VNC_CONSTANTS.DEFAULT_DEPTH);
    const desktop = options.desktop === 'lxde' ? 'lxde' : 'xfce';

    try {
      // First, check if this display is already running
      const runningDisplays = await this.getRunningVNCDisplays(client);
      if (runningDisplays.includes(validatedDisplay)) {
        logVNC('server_already_running', 'vnc', { displayNumber: validatedDisplay });
        return {
          displayNumber: validatedDisplay,
          port: this.getVNCPort(validatedDisplay),
          isRunning: true,
        };
      }

      // Set up VNC password for authentication
      await this.setVNCPassword(client);

      // Create xstartup for the desktop environment
      await this.createXStartup(client, desktop);

      // Kill any existing VNC server on this display first
      await sshService.executeCommand(client, `vncserver -kill :${validatedDisplay} 2>/dev/null || true`);

      // Start VNC server with:
      // - localhost only (-localhost yes) - CRITICAL for security, only accept connections via SSH tunnel
      // - VncAuth authentication as fallback security layer
      // - Specified geometry and depth
      const startCommand = [
        'vncserver',
        `:${validatedDisplay}`,
        `-geometry ${validatedGeometry}`,
        `-depth ${validatedDepth}`,
        '-localhost yes',  // SECURITY: Only accept connections from localhost (via SSH tunnel)
        '-SecurityTypes VncAuth',  // SECURITY: Require VNC password authentication
        '2>&1'
      ].join(' ');

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

      if (!newRunningDisplays.includes(validatedDisplay)) {
        // Check VNC log file for errors
        const logResult = await sshService.executeCommand(
          client,
          `cat ~/.vnc/*.log 2>/dev/null | tail -20 || echo "No VNC logs found"`
        );
        logger.error('VNC log contents:', logResult.stdout);

        throw new VNCError(`VNC server failed to start - display :${validatedDisplay} not found. Check VNC logs: ${logResult.stdout.substring(0, 500)}`);
      }

      const port = this.getVNCPort(validatedDisplay);
      logVNC('server_started', 'vnc', { displayNumber: validatedDisplay, port, geometry: validatedGeometry, depth: validatedDepth });

      return {
        displayNumber: validatedDisplay,
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
    // Validate input to prevent command injection
    const validatedDisplay = validateDisplayNumber(displayNumber);

    try {
      const result = await sshService.executeCommand(
        client,
        `vncserver -kill :${validatedDisplay}`
      );

      // VNC server returns code 1 if the display wasn't running
      if (result.code !== 0 && !result.stderr.includes("isn't running")) {
        logger.warn('VNC stop warning:', result.stderr);
      }

      logVNC('server_stopped', 'vnc', { displayNumber: validatedDisplay });
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
