import { Client } from 'ssh2';
import { IInstanceDocument, IOSInfo } from '../models/Instance';
import { sshService } from './sshService';
import { osDetector, OSInfo } from '../utils/osDetector';
import { packageManagerService } from '../utils/packageManager';
import { vncService } from './vncService';
import { logger } from '../utils/logger';
import {
  DEV_SOFTWARE_TEMPLATES,
  DevSoftwareTemplate,
  DesktopEnvironment,
} from '../config/constants';

export interface PreflightResult {
  success: boolean;
  sshConnected: boolean;
  osInfo?: OSInfo;
  systemResources: {
    diskSpaceGB: number;
    memoryMB: number;
    cpuCores: number;
  };
  vncStatus: {
    installed: boolean;
    running: boolean;
    displays: number[];
  };
  desktopStatus: {
    xfceInstalled: boolean;
    lxdeInstalled: boolean;
  };
  sudoAvailable: boolean;
  networkStatus: {
    internetAccess: boolean;
    dnsWorking: boolean;
  };
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface DryRunResult {
  osInfo: OSInfo;
  packagesToInstall: {
    vnc: string[];
    xserver: string[];
    desktop: string[];
  };
  estimatedDiskUsageMB: number;
  estimatedTimeMinutes: number;
  commands: string[];
  warnings: string[];
}

export interface DevSoftwareInstallResult {
  success: boolean;
  templateId: string;
  packagesInstalled: string[];
  postInstallRan: boolean;
  errors: string[];
  duration: number;
}

class PreflightService {
  /**
   * Run comprehensive pre-flight checks on an instance
   */
  async runPreflightCheck(
    client: Client,
    instance: IInstanceDocument
  ): Promise<PreflightResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    let osInfo: OSInfo | undefined;
    let systemResources = { diskSpaceGB: 0, memoryMB: 0, cpuCores: 0 };
    let vncStatus = { installed: false, running: false, displays: [] as number[] };
    let desktopStatus = { xfceInstalled: false, lxdeInstalled: false };
    let sudoAvailable = false;
    let networkStatus = { internetAccess: false, dnsWorking: false };

    try {
      // 1. Detect OS
      logger.info('Pre-flight: Detecting OS...');
      osInfo = await osDetector.detectOS(client);

      if (!osInfo.isSupported) {
        errors.push(`Unsupported OS: ${osInfo.distroName}. Supported: Debian, RHEL, Arch, Alpine, SUSE families.`);
      }

      sudoAvailable = osInfo.sudoAvailable;
      if (!sudoAvailable) {
        errors.push('sudo is not available. Root privileges required for VNC installation.');
      }

      // 2. Check system resources in parallel
      logger.info('Pre-flight: Checking system resources...');
      const [diskResult, memResult, cpuResult] = await Promise.all([
        sshService.executeCommand(client, "df -BG / | tail -1 | awk '{print $4}' | tr -d 'G'"),
        sshService.executeCommand(client, "free -m | grep Mem | awk '{print $7}'"),
        sshService.executeCommand(client, "nproc"),
      ]);

      systemResources.diskSpaceGB = parseInt(diskResult.stdout.trim()) || 0;
      systemResources.memoryMB = parseInt(memResult.stdout.trim()) || 0;
      systemResources.cpuCores = parseInt(cpuResult.stdout.trim()) || 1;

      if (systemResources.diskSpaceGB < 2) {
        errors.push(`Insufficient disk space: ${systemResources.diskSpaceGB}GB available, 2GB required.`);
      } else if (systemResources.diskSpaceGB < 5) {
        warnings.push(`Low disk space: ${systemResources.diskSpaceGB}GB. Consider freeing up space.`);
      }

      if (systemResources.memoryMB < 512) {
        warnings.push(`Low available memory: ${systemResources.memoryMB}MB. VNC may be slow.`);
      }

      // 3. Check VNC status
      logger.info('Pre-flight: Checking VNC status...');
      vncStatus.installed = await vncService.isVNCInstalled(client);
      if (vncStatus.installed) {
        vncStatus.displays = await vncService.getRunningVNCDisplays(client);
        vncStatus.running = vncStatus.displays.length > 0;
      }

      // 4. Check desktop environments
      logger.info('Pre-flight: Checking desktop environments...');
      [desktopStatus.xfceInstalled, desktopStatus.lxdeInstalled] = await Promise.all([
        vncService.isDesktopInstalled(client, 'xfce'),
        vncService.isDesktopInstalled(client, 'lxde'),
      ]);

      // 5. Check network connectivity
      logger.info('Pre-flight: Checking network...');
      const [pingResult, dnsResult] = await Promise.all([
        sshService.executeCommand(client, 'ping -c 1 -W 3 8.8.8.8 >/dev/null 2>&1 && echo "ok" || echo "fail"'),
        sshService.executeCommand(client, 'ping -c 1 -W 3 google.com >/dev/null 2>&1 && echo "ok" || echo "fail"'),
      ]);

      networkStatus.internetAccess = pingResult.stdout.trim() === 'ok';
      networkStatus.dnsWorking = dnsResult.stdout.trim() === 'ok';

      if (!networkStatus.internetAccess) {
        errors.push('No internet access. Cannot install packages.');
      } else if (!networkStatus.dnsWorking) {
        warnings.push('DNS resolution issues. Package installation may fail.');
      }

      // 6. Generate recommendations
      if (!vncStatus.installed) {
        recommendations.push('VNC server not installed. It will be automatically installed on first connection.');
      }
      if (!desktopStatus.xfceInstalled && !desktopStatus.lxdeInstalled) {
        recommendations.push('No desktop environment installed. XFCE (recommended) or LXDE will be installed.');
      }
      if (osInfo && osInfo.distroFamily === 'alpine') {
        recommendations.push('Alpine Linux detected. Some packages may have different names or limited availability.');
      }

      // 7. Update instance with pre-flight results
      instance.lastPreflightCheck = new Date();
      instance.preflightStatus = errors.length === 0 ? 'passed' : 'failed';
      instance.preflightMessage = errors.length > 0 ? errors.join('; ') : 'All checks passed';

      // Store OS info
      if (osInfo) {
        instance.osInfo = {
          distroFamily: osInfo.distroFamily,
          distroName: osInfo.distroName,
          distroId: osInfo.distroId,
          version: osInfo.version,
          versionId: osInfo.versionId,
          packageManager: osInfo.packageManager,
          kernel: osInfo.kernel,
          architecture: osInfo.architecture,
          detectedAt: new Date(),
        } as IOSInfo;
      }

      await instance.save();

      return {
        success: errors.length === 0,
        sshConnected: true,
        osInfo,
        systemResources,
        vncStatus,
        desktopStatus,
        sudoAvailable,
        networkStatus,
        errors,
        warnings,
        recommendations,
      };
    } catch (error) {
      logger.error('Pre-flight check failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error during pre-flight check');

      instance.lastPreflightCheck = new Date();
      instance.preflightStatus = 'failed';
      instance.preflightMessage = errors.join('; ');
      await instance.save();

      return {
        success: false,
        sshConnected: false,
        osInfo,
        systemResources,
        vncStatus,
        desktopStatus,
        sudoAvailable,
        networkStatus,
        errors,
        warnings,
        recommendations,
      };
    }
  }

  /**
   * Dry run VNC provisioning - show what would be installed without actually installing
   */
  async dryRunProvisioning(
    client: Client,
    desktopEnvironment: DesktopEnvironment = 'xfce'
  ): Promise<DryRunResult> {
    const osInfo = await osDetector.detectOS(client);
    const warnings: string[] = [];
    const commands: string[] = [];

    // Get packages that would be installed
    const vncPackages = packageManagerService.getVNCServerPackages(osInfo);
    const xserverPackages = packageManagerService.getXServerPackages(osInfo);
    const desktopPackages = packageManagerService.getDesktopPackages(osInfo, desktopEnvironment);

    // Check what's already installed
    const vncInstalled = await vncService.isVNCInstalled(client);
    const desktopInstalled = await vncService.isDesktopInstalled(client, desktopEnvironment);

    const packagesToInstall = {
      vnc: vncInstalled ? [] : vncPackages.primary,
      xserver: xserverPackages,
      desktop: desktopInstalled ? [] : desktopPackages,
    };

    // Estimate disk usage (rough estimates)
    const packageCount =
      packagesToInstall.vnc.length +
      packagesToInstall.xserver.length +
      packagesToInstall.desktop.length;

    const estimatedDiskUsageMB = packageCount * 50; // ~50MB per package average
    const estimatedTimeMinutes = Math.ceil(packageCount * 0.5); // ~30s per package

    // Generate commands that would be run
    if (packagesToInstall.vnc.length > 0 || packagesToInstall.xserver.length > 0 || packagesToInstall.desktop.length > 0) {
      // Update command
      const pmCommands = this.getPackageManagerCommands(osInfo.packageManager);
      commands.push(pmCommands.update);

      // Install commands
      if (packagesToInstall.xserver.length > 0) {
        commands.push(pmCommands.install(packagesToInstall.xserver));
      }
      if (packagesToInstall.vnc.length > 0) {
        commands.push(pmCommands.install(packagesToInstall.vnc));
      }
      if (packagesToInstall.desktop.length > 0) {
        commands.push(pmCommands.install(packagesToInstall.desktop));
      }
    }

    // Add warnings
    if (!osInfo.isSupported) {
      warnings.push(`Unsupported OS: ${osInfo.distroName}`);
    }
    if (!osInfo.sudoAvailable) {
      warnings.push('sudo not available - installation will fail');
    }
    if (vncInstalled) {
      warnings.push('VNC is already installed - will skip VNC installation');
    }
    if (desktopInstalled) {
      warnings.push(`${desktopEnvironment.toUpperCase()} is already installed - will skip desktop installation`);
    }

    return {
      osInfo,
      packagesToInstall,
      estimatedDiskUsageMB,
      estimatedTimeMinutes,
      commands,
      warnings,
    };
  }

  /**
   * Install dev software template
   */
  async installDevSoftware(
    client: Client,
    instance: IInstanceDocument,
    templateId: DevSoftwareTemplate
  ): Promise<DevSoftwareInstallResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const packagesInstalled: string[] = [];
    let postInstallRan = false;

    try {
      const template = DEV_SOFTWARE_TEMPLATES[templateId];
      if (!template) {
        throw new Error(`Unknown software template: ${templateId}`);
      }

      // Get OS info - always detect fresh to ensure we have complete data
      const osInfo = await osDetector.detectOS(client);

      // Update instance with fresh OS info
      instance.osInfo = {
        distroFamily: osInfo.distroFamily,
        distroName: osInfo.distroName,
        distroId: osInfo.distroId,
        version: osInfo.version,
        versionId: osInfo.versionId,
        packageManager: osInfo.packageManager,
        kernel: osInfo.kernel,
        architecture: osInfo.architecture,
        detectedAt: new Date(),
      };

      // Get packages for this OS
      const templatePackages = template.packages[osInfo.distroFamily as keyof typeof template.packages];
      if (!templatePackages) {
        throw new Error(`No packages defined for ${osInfo.distroFamily} in template ${templateId}`);
      }

      // Convert readonly array to mutable
      const packages: string[] = [...templatePackages];
      if (packages.length === 0) {
        throw new Error(`No packages defined for ${osInfo.distroFamily} in template ${templateId}`);
      }

      logger.info(`Installing ${template.name} on ${osInfo.distroName}...`);

      // Update package lists first
      await packageManagerService.updatePackageLists(client, osInfo);

      // Install packages
      const installResult = await packageManagerService.installPackages(
        client,
        osInfo,
        packages,
        600000 // 10 minute timeout
      );

      if (!installResult.success) {
        errors.push(`Package installation failed: ${installResult.message}`);
      } else {
        packagesInstalled.push(...packages);
      }

      // Run post-install commands
      if (template.postInstall && template.postInstall.length > 0) {
        for (const cmd of template.postInstall) {
          try {
            logger.info(`Running post-install: ${cmd.substring(0, 50)}...`);
            const result = await sshService.executeCommand(client, cmd, { timeout: 300000 });
            if (result.code !== 0) {
              errors.push(`Post-install command failed: ${result.stderr}`);
            }
          } catch (err) {
            errors.push(`Post-install error: ${err instanceof Error ? err.message : 'Unknown'}`);
          }
        }
        postInstallRan = true;
      }

      // Update instance with installed software
      if (!instance.installedSoftware) {
        instance.installedSoftware = [];
      }

      // Check if already installed
      const existingIndex = instance.installedSoftware.findIndex(s => s.templateId === templateId);
      const softwareEntry = {
        templateId,
        installedAt: new Date(),
        status: errors.length === 0 ? 'installed' as const : 'partial' as const,
      };

      if (existingIndex >= 0) {
        instance.installedSoftware[existingIndex] = softwareEntry;
      } else {
        instance.installedSoftware.push(softwareEntry);
      }

      await instance.save();

      return {
        success: errors.length === 0,
        templateId,
        packagesInstalled,
        postInstallRan,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      logger.error(`Dev software installation failed:`, error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        templateId,
        packagesInstalled,
        postInstallRan,
        errors,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get available dev software templates with installation status for an instance
   */
  async getAvailableTemplates(instance: IInstanceDocument): Promise<{
    templateId: string;
    name: string;
    description: string;
    installed: boolean;
    installedAt?: Date;
  }[]> {
    const installedMap = new Map(
      (instance.installedSoftware || []).map(s => [s.templateId, s])
    );

    return Object.entries(DEV_SOFTWARE_TEMPLATES).map(([id, template]) => {
      const installed = installedMap.get(id);
      return {
        templateId: id,
        name: template.name,
        description: template.description,
        installed: installed?.status === 'installed',
        installedAt: installed?.installedAt,
      };
    });
  }

  /**
   * Helper to get package manager commands
   */
  private getPackageManagerCommands(pm: string): {
    update: string;
    install: (packages: string[]) => string;
  } {
    const commands: Record<string, { update: string; install: (p: string[]) => string }> = {
      apt: {
        update: 'sudo apt-get update',
        install: (p) => `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${p.join(' ')}`,
      },
      dnf: {
        update: 'sudo dnf check-update || true',
        install: (p) => `sudo dnf install -y ${p.join(' ')}`,
      },
      yum: {
        update: 'sudo yum check-update || true',
        install: (p) => `sudo yum install -y ${p.join(' ')}`,
      },
      pacman: {
        update: 'sudo pacman -Sy',
        install: (p) => `sudo pacman -S --noconfirm ${p.join(' ')}`,
      },
      apk: {
        update: 'sudo apk update',
        install: (p) => `sudo apk add ${p.join(' ')}`,
      },
      zypper: {
        update: 'sudo zypper refresh',
        install: (p) => `sudo zypper install -y ${p.join(' ')}`,
      },
    };

    return commands[pm] || commands.apt;
  }
}

export const preflightService = new PreflightService();
export default preflightService;
