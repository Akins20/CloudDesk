import { Client } from 'ssh2';
import { DesktopEnvironment } from '../config/constants';
import { logger, logVNC } from '../utils/logger';
import { sshService } from './sshService';
import { vncService } from './vncService';
import { osDetector, OSInfo } from '../utils/osDetector';
import { packageManagerService } from '../utils/packageManager';

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
   * Cached OS info to avoid repeated detection
   */
  private osInfoCache: Map<string, { osInfo: OSInfo; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes

  /**
   * Detect and cache OS information
   */
  async detectOS(client: Client, instanceId?: string): Promise<OSInfo> {
    // Check cache first
    if (instanceId) {
      const cached = this.osInfoCache.get(instanceId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        logger.debug('Using cached OS info for instance:', instanceId);
        return cached.osInfo;
      }
    }

    const osInfo = await osDetector.detectOS(client);

    // Cache the result
    if (instanceId) {
      this.osInfoCache.set(instanceId, { osInfo, timestamp: Date.now() });
    }

    return osInfo;
  }

  /**
   * Clear cached OS info for an instance
   */
  clearOSCache(instanceId: string): void {
    this.osInfoCache.delete(instanceId);
  }

  /**
   * Detect Ubuntu version (legacy compatibility)
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
   * Get system information (legacy compatibility)
   */
  async getSystemInfo(client: Client): Promise<SystemInfo> {
    try {
      const osInfo = await this.detectOS(client);
      return {
        osName: osInfo.distroName,
        osVersion: osInfo.version,
        kernel: osInfo.kernel,
        architecture: osInfo.architecture,
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
   * Update package lists (multi-OS)
   */
  async updatePackageLists(client: Client, osInfo?: OSInfo): Promise<ProvisionResult> {
    try {
      logVNC('updating_packages', 'provision');

      // Get OS info if not provided
      const os = osInfo || await this.detectOS(client);

      const result = await packageManagerService.updatePackageLists(client, os);

      if (!result.success) {
        return {
          success: false,
          message: result.message,
          details: { packageManager: os.packageManager },
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
   * Install VNC server (multi-OS)
   */
  async installVNCServer(client: Client, osInfo?: OSInfo): Promise<ProvisionResult> {
    try {
      // Check if already installed
      const isInstalled = await vncService.isVNCInstalled(client);
      if (isInstalled) {
        return { success: true, message: 'VNC server already installed' };
      }

      logVNC('installing_vnc', 'provision');

      // Get OS info if not provided
      const os = osInfo || await this.detectOS(client);

      // Check if OS is supported
      const supportCheck = osDetector.isSupportedForVNC(os);
      if (!supportCheck.supported) {
        return {
          success: false,
          message: supportCheck.reason || 'Unsupported operating system',
          details: {
            distro: os.distroName,
            distroFamily: os.distroFamily,
            packageManager: os.packageManager,
          },
        };
      }

      // Install VNC using the package manager service
      const result = await packageManagerService.installVNCServer(client, os);

      if (!result.success) {
        return {
          success: false,
          message: result.message,
          details: {
            distro: os.distroName,
            packageManager: os.packageManager,
          },
        };
      }

      logVNC('vnc_installed', 'provision', { vncType: result.vncType });
      return {
        success: true,
        message: 'VNC server installed successfully',
        details: { vncType: result.vncType },
      };
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
   * Install desktop environment (multi-OS)
   */
  async installDesktopEnvironment(
    client: Client,
    desktop: DesktopEnvironment,
    osInfo?: OSInfo
  ): Promise<ProvisionResult> {
    try {
      // Check if already installed
      const isInstalled = await vncService.isDesktopInstalled(client, desktop);
      if (isInstalled) {
        return { success: true, message: `${desktop.toUpperCase()} already installed` };
      }

      logVNC('installing_desktop', 'provision', { desktop });

      // Get OS info if not provided
      const os = osInfo || await this.detectOS(client);

      const result = await packageManagerService.installDesktopEnvironment(client, os, desktop);

      if (!result.success) {
        return {
          success: false,
          message: `Failed to install ${desktop.toUpperCase()}: ${result.message}`,
          details: {
            distro: os.distroName,
            packageManager: os.packageManager,
          },
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
   * Install X server dependencies (multi-OS)
   */
  async installXServerDependencies(client: Client, osInfo?: OSInfo): Promise<ProvisionResult> {
    try {
      logVNC('installing_xserver', 'provision');

      // Get OS info if not provided
      const os = osInfo || await this.detectOS(client);

      const result = await packageManagerService.installXServerDependencies(client, os);

      if (!result.success) {
        logger.warn('X server dependency installation had issues:', result.message);
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
   * Full VNC provisioning (multi-OS)
   */
  async provisionVNC(
    client: Client,
    desktopEnvironment: DesktopEnvironment = 'xfce',
    instanceId?: string
  ): Promise<ProvisionResult> {
    const startTime = Date.now();

    try {
      logVNC('provisioning_started', 'provision', { desktopEnvironment });

      // Detect OS first
      const osInfo = await this.detectOS(client, instanceId);
      logger.info(`Detected OS: ${osDetector.getOSDescription(osInfo)}`);

      // Check if OS is supported
      const supportCheck = osDetector.isSupportedForVNC(osInfo);
      if (!supportCheck.supported) {
        return {
          success: false,
          message: supportCheck.reason || 'Unsupported operating system for VNC provisioning',
          details: {
            distro: osInfo.distroName,
            distroId: osInfo.distroId,
            distroFamily: osInfo.distroFamily,
            packageManager: osInfo.packageManager,
            supportedFamilies: ['debian', 'rhel', 'arch', 'alpine', 'suse'],
          },
        };
      }

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
      const updateResult = await this.updatePackageLists(client, osInfo);
      if (!updateResult.success) {
        return updateResult;
      }

      // Install X server dependencies
      await this.installXServerDependencies(client, osInfo);

      // Install VNC server
      const vncResult = await this.installVNCServer(client, osInfo);
      if (!vncResult.success) {
        return vncResult;
      }

      // Install desktop environment
      const desktopResult = await this.installDesktopEnvironment(client, desktopEnvironment, osInfo);
      if (!desktopResult.success) {
        return desktopResult;
      }

      const duration = Date.now() - startTime;
      logVNC('provisioning_completed', 'provision', {
        desktopEnvironment,
        durationMs: duration,
        osInfo: {
          distro: osInfo.distroName,
          packageManager: osInfo.packageManager,
        },
      });

      return {
        success: true,
        message: `VNC with ${desktopEnvironment.toUpperCase()} provisioned successfully on ${osInfo.distroName}`,
        details: {
          desktopEnvironment,
          durationMs: duration,
          distro: osInfo.distroName,
          distroFamily: osInfo.distroFamily,
          packageManager: osInfo.packageManager,
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

  /**
   * Get detailed provisioning requirements for an OS
   */
  async getProvisioningRequirements(client: Client): Promise<{
    osInfo: OSInfo;
    isSupported: boolean;
    reason?: string;
    packages: {
      vnc: string[];
      xserver: string[];
      xfce: string[];
      lxde: string[];
    };
  }> {
    const osInfo = await this.detectOS(client);
    const supportCheck = osDetector.isSupportedForVNC(osInfo);

    return {
      osInfo,
      isSupported: supportCheck.supported,
      reason: supportCheck.reason,
      packages: {
        vnc: packageManagerService.getVNCServerPackages(osInfo).primary,
        xserver: packageManagerService.getXServerPackages(osInfo),
        xfce: packageManagerService.getDesktopPackages(osInfo, 'xfce'),
        lxde: packageManagerService.getDesktopPackages(osInfo, 'lxde'),
      },
    };
  }
}

// Export singleton instance
export const provisionService = new ProvisionService();

export default provisionService;
