import { Client } from 'ssh2';
import { DesktopEnvironment } from '../config/constants';
import { logger, logVNC } from '../utils/logger';
import { sshService } from './sshService';
import { vncService } from './vncService';

interface ProvisionResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

interface SystemInfo {
  osName: string;
  osVersion: string;
  kernel: string;
  architecture: string;
}

class ProvisionService {
  /**
   * Detect Ubuntu version
   */
  async detectUbuntuVersion(client: Client): Promise<string> {
    try {
      const result = await sshService.executeCommand(
        client,
        'lsb_release -rs 2>/dev/null || cat /etc/os-release | grep VERSION_ID | cut -d= -f2 | tr -d \\"'
      );

      if (result.code === 0 && result.stdout.trim()) {
        return result.stdout.trim();
      }

      return 'unknown';
    } catch (error) {
      logger.warn('Error detecting Ubuntu version:', error);
      return 'unknown';
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo(client: Client): Promise<SystemInfo> {
    try {
      const [osResult, kernelResult, archResult] = await Promise.all([
        sshService.executeCommand(client, 'cat /etc/os-release | grep -E "^NAME=|^VERSION=" | head -2'),
        sshService.executeCommand(client, 'uname -r'),
        sshService.executeCommand(client, 'uname -m'),
      ]);

      const osInfo = osResult.stdout;
      const osNameMatch = osInfo.match(/NAME="?([^"\n]+)"?/);
      const osVersionMatch = osInfo.match(/VERSION="?([^"\n]+)"?/);

      return {
        osName: osNameMatch ? osNameMatch[1] : 'Unknown',
        osVersion: osVersionMatch ? osVersionMatch[1] : 'Unknown',
        kernel: kernelResult.stdout.trim(),
        architecture: archResult.stdout.trim(),
      };
    } catch (error) {
      logger.error('Error getting system info:', error);
      return {
        osName: 'Unknown',
        osVersion: 'Unknown',
        kernel: 'Unknown',
        architecture: 'Unknown',
      };
    }
  }

  /**
   * Check available disk space (returns GB)
   */
  async checkDiskSpace(client: Client): Promise<number> {
    try {
      const result = await sshService.executeCommand(
        client,
        "df -BG / | tail -1 | awk '{print $4}' | tr -d 'G'"
      );

      if (result.code === 0 && result.stdout.trim()) {
        return parseInt(result.stdout.trim(), 10);
      }

      return 0;
    } catch (error) {
      logger.warn('Error checking disk space:', error);
      return 0;
    }
  }

  /**
   * Check available memory (returns MB)
   */
  async checkAvailableMemory(client: Client): Promise<number> {
    try {
      const result = await sshService.executeCommand(
        client,
        "free -m | grep Mem | awk '{print $7}'"
      );

      if (result.code === 0 && result.stdout.trim()) {
        return parseInt(result.stdout.trim(), 10);
      }

      return 0;
    } catch (error) {
      logger.warn('Error checking memory:', error);
      return 0;
    }
  }

  /**
   * Update package lists
   */
  async updatePackageLists(client: Client): Promise<ProvisionResult> {
    try {
      logVNC('updating_packages', 'provision');

      const result = await sshService.executeCommand(
        client,
        'sudo apt-get update -qq',
        { timeout: 120000 }
      );

      if (result.code !== 0) {
        return {
          success: false,
          message: 'Failed to update package lists',
          details: { stderr: result.stderr },
        };
      }

      return { success: true, message: 'Package lists updated' };
    } catch (error) {
      logger.error('Error updating package lists:', error);
      return {
        success: false,
        message: 'Error updating package lists',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Install VNC server (TigerVNC)
   */
  async installVNCServer(client: Client): Promise<ProvisionResult> {
    try {
      // Check if already installed
      const isInstalled = await vncService.isVNCInstalled(client);
      if (isInstalled) {
        return { success: true, message: 'VNC server already installed' };
      }

      logVNC('installing_vnc', 'provision');

      // Install TigerVNC
      const result = await sshService.executeCommand(
        client,
        'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tigervnc-standalone-server tigervnc-common',
        { timeout: 300000 }
      );

      if (result.code !== 0) {
        // Try alternative package names
        const altResult = await sshService.executeCommand(
          client,
          'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y tightvncserver',
          { timeout: 300000 }
        );

        if (altResult.code !== 0) {
          return {
            success: false,
            message: 'Failed to install VNC server',
            details: { stderr: result.stderr },
          };
        }
      }

      logVNC('vnc_installed', 'provision');
      return { success: true, message: 'VNC server installed successfully' };
    } catch (error) {
      logger.error('Error installing VNC server:', error);
      return {
        success: false,
        message: 'Error installing VNC server',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Install desktop environment
   */
  async installDesktopEnvironment(
    client: Client,
    desktop: DesktopEnvironment
  ): Promise<ProvisionResult> {
    try {
      // Check if already installed
      const isInstalled = await vncService.isDesktopInstalled(client, desktop);
      if (isInstalled) {
        return { success: true, message: `${desktop.toUpperCase()} already installed` };
      }

      logVNC('installing_desktop', 'provision', { desktop });

      const packages: Record<DesktopEnvironment, string> = {
        xfce: 'xfce4 xfce4-goodies xfce4-terminal dbus-x11',
        lxde: 'lxde lxterminal dbus-x11',
      };

      const result = await sshService.executeCommand(
        client,
        `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${packages[desktop]}`,
        { timeout: 600000 } // 10 minutes for desktop installation
      );

      if (result.code !== 0) {
        return {
          success: false,
          message: `Failed to install ${desktop.toUpperCase()}`,
          details: { stderr: result.stderr },
        };
      }

      logVNC('desktop_installed', 'provision', { desktop });
      return { success: true, message: `${desktop.toUpperCase()} installed successfully` };
    } catch (error) {
      logger.error('Error installing desktop environment:', error);
      return {
        success: false,
        message: 'Error installing desktop environment',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Install X server dependencies
   */
  async installXServerDependencies(client: Client): Promise<ProvisionResult> {
    try {
      logVNC('installing_xserver', 'provision');

      const result = await sshService.executeCommand(
        client,
        'sudo DEBIAN_FRONTEND=noninteractive apt-get install -y xorg xauth x11-xserver-utils',
        { timeout: 300000 }
      );

      if (result.code !== 0) {
        logger.warn('X server dependency installation had issues:', result.stderr);
      }

      return { success: true, message: 'X server dependencies installed' };
    } catch (error) {
      logger.warn('Error installing X server dependencies:', error);
      return {
        success: true,
        message: 'X server dependencies may be partially installed',
      };
    }
  }

  /**
   * Full VNC provisioning
   */
  async provisionVNC(
    client: Client,
    desktopEnvironment: DesktopEnvironment = 'xfce'
  ): Promise<ProvisionResult> {
    const startTime = Date.now();

    try {
      logVNC('provisioning_started', 'provision', { desktopEnvironment });

      // Check disk space (need at least 2GB)
      const diskSpace = await this.checkDiskSpace(client);
      if (diskSpace < 2) {
        return {
          success: false,
          message: 'Insufficient disk space. At least 2GB required.',
          details: { availableGB: diskSpace },
        };
      }

      // Update package lists
      const updateResult = await this.updatePackageLists(client);
      if (!updateResult.success) {
        return updateResult;
      }

      // Install X server dependencies
      await this.installXServerDependencies(client);

      // Install VNC server
      const vncResult = await this.installVNCServer(client);
      if (!vncResult.success) {
        return vncResult;
      }

      // Install desktop environment
      const desktopResult = await this.installDesktopEnvironment(client, desktopEnvironment);
      if (!desktopResult.success) {
        return desktopResult;
      }

      const duration = Date.now() - startTime;
      logVNC('provisioning_completed', 'provision', {
        desktopEnvironment,
        durationMs: duration,
      });

      return {
        success: true,
        message: `VNC with ${desktopEnvironment.toUpperCase()} provisioned successfully`,
        details: {
          desktopEnvironment,
          durationMs: duration,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('VNC provisioning failed:', error);

      return {
        success: false,
        message: 'VNC provisioning failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          durationMs: duration,
        },
      };
    }
  }

  /**
   * Verify VNC installation
   */
  async verifyVNCInstallation(
    client: Client,
    desktopEnvironment: DesktopEnvironment
  ): Promise<boolean> {
    const vncInstalled = await vncService.isVNCInstalled(client);
    const desktopInstalled = await vncService.isDesktopInstalled(client, desktopEnvironment);

    return vncInstalled && desktopInstalled;
  }
}

// Export singleton instance
export const provisionService = new ProvisionService();

export default provisionService;
