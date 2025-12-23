import { Client } from 'ssh2';
import { sshService } from '../services/sshService';
import { logger } from './logger';
import { PackageManager, DistroFamily, OSInfo } from './osDetector';

/**
 * Package names for VNC and desktop environments across different distros
 */
interface PackageNames {
  vncServer: string[];
  vncServerFallback: string[];
  xserver: string[];
  xfce: string[];
  lxde: string[];
}

/**
 * Package names for each distribution family
 */
const PACKAGE_NAMES: Record<DistroFamily, PackageNames> = {
  debian: {
    vncServer: ['tigervnc-standalone-server', 'tigervnc-common'],
    vncServerFallback: ['tightvncserver'],
    xserver: ['xorg', 'xauth', 'x11-xserver-utils'],
    xfce: ['xfce4', 'xfce4-goodies', 'xfce4-terminal', 'dbus-x11'],
    lxde: ['lxde', 'lxterminal', 'dbus-x11'],
  },
  rhel: {
    vncServer: ['tigervnc-server'],
    vncServerFallback: ['tigervnc-server'],
    xserver: ['xorg-x11-server-Xvfb', 'xorg-x11-xauth', 'xorg-x11-utils'],
    xfce: ['@xfce', 'xfce4-terminal', 'dbus-x11'],
    lxde: ['@lxde-desktop', 'lxterminal', 'dbus-x11'],
  },
  arch: {
    vncServer: ['tigervnc'],
    vncServerFallback: ['tigervnc'],
    xserver: ['xorg-server', 'xorg-xauth', 'xorg-xinit'],
    xfce: ['xfce4', 'xfce4-goodies', 'xfce4-terminal'],
    lxde: ['lxde', 'lxterminal'],
  },
  alpine: {
    vncServer: ['tigervnc'],
    vncServerFallback: ['x11vnc'],
    xserver: ['xorg-server', 'xauth', 'xhost'],
    xfce: ['xfce4', 'xfce4-terminal', 'dbus-x11'],
    lxde: ['lxde-desktop', 'lxterminal', 'dbus-x11'],
  },
  suse: {
    vncServer: ['tigervnc'],
    vncServerFallback: ['tightvnc'],
    xserver: ['xorg-x11-server', 'xauth', 'xorg-x11-utils'],
    xfce: ['patterns-xfce-xfce', 'xfce4-terminal', 'dbus-1-x11'],
    lxde: ['patterns-lxde-lxde', 'lxterminal', 'dbus-1-x11'],
  },
  unknown: {
    vncServer: [],
    vncServerFallback: [],
    xserver: [],
    xfce: [],
    lxde: [],
  },
};

/**
 * Package manager command templates
 */
interface PackageManagerCommands {
  update: string;
  install: (packages: string[]) => string;
  checkInstalled: (packageName: string) => string;
  envPrefix: string;
}

const PACKAGE_MANAGER_COMMANDS: Record<PackageManager, PackageManagerCommands> = {
  apt: {
    update: 'sudo apt-get update -qq',
    install: (packages) => `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${packages.join(' ')}`,
    checkInstalled: (pkg) => `dpkg -l ${pkg} 2>/dev/null | grep -q "^ii"`,
    envPrefix: 'DEBIAN_FRONTEND=noninteractive',
  },
  dnf: {
    update: 'sudo dnf check-update -q || true',  // dnf returns 100 if updates available
    install: (packages) => `sudo dnf install -y ${packages.join(' ')}`,
    checkInstalled: (pkg) => `rpm -q ${pkg} >/dev/null 2>&1`,
    envPrefix: '',
  },
  yum: {
    update: 'sudo yum check-update -q || true',
    install: (packages) => `sudo yum install -y ${packages.join(' ')}`,
    checkInstalled: (pkg) => `rpm -q ${pkg} >/dev/null 2>&1`,
    envPrefix: '',
  },
  pacman: {
    update: 'sudo pacman -Sy --noconfirm',
    install: (packages) => `sudo pacman -S --noconfirm --needed ${packages.join(' ')}`,
    checkInstalled: (pkg) => `pacman -Q ${pkg} >/dev/null 2>&1`,
    envPrefix: '',
  },
  apk: {
    update: 'sudo apk update',
    install: (packages) => `sudo apk add --no-cache ${packages.join(' ')}`,
    checkInstalled: (pkg) => `apk info -e ${pkg} >/dev/null 2>&1`,
    envPrefix: '',
  },
  zypper: {
    update: 'sudo zypper refresh -q',
    install: (packages) => `sudo zypper install -y ${packages.join(' ')}`,
    checkInstalled: (pkg) => `rpm -q ${pkg} >/dev/null 2>&1`,
    envPrefix: '',
  },
  unknown: {
    update: 'echo "Unknown package manager"',
    install: () => 'echo "Unknown package manager"',
    checkInstalled: () => 'false',
    envPrefix: '',
  },
};

/**
 * Timeout values for different operations (in ms)
 */
const TIMEOUTS = {
  update: 120000,      // 2 minutes
  vncInstall: 300000,  // 5 minutes
  xserverInstall: 300000,
  desktopInstall: 600000,  // 10 minutes
};

class PackageManagerService {
  /**
   * Update package lists
   */
  async updatePackageLists(client: Client, osInfo: OSInfo): Promise<{ success: boolean; message: string }> {
    const commands = PACKAGE_MANAGER_COMMANDS[osInfo.packageManager];

    try {
      logger.info(`Updating package lists using ${osInfo.packageManager}...`);
      const result = await sshService.executeCommand(client, commands.update, { timeout: TIMEOUTS.update });

      // Most package managers return 0 on success, but dnf/yum return 100 if updates available
      if (result.code !== 0 && osInfo.packageManager !== 'dnf' && osInfo.packageManager !== 'yum') {
        return {
          success: false,
          message: `Failed to update package lists: ${result.stderr}`,
        };
      }

      return { success: true, message: 'Package lists updated' };
    } catch (error) {
      logger.error('Error updating package lists:', error);
      return {
        success: false,
        message: `Error updating package lists: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Install packages
   */
  async installPackages(
    client: Client,
    osInfo: OSInfo,
    packages: string[],
    timeout: number = 300000
  ): Promise<{ success: boolean; message: string; installedPackages?: string[] }> {
    if (packages.length === 0) {
      return { success: true, message: 'No packages to install', installedPackages: [] };
    }

    const commands = PACKAGE_MANAGER_COMMANDS[osInfo.packageManager];

    try {
      logger.info(`Installing packages: ${packages.join(', ')} using ${osInfo.packageManager}...`);
      const installCmd = commands.install(packages);
      const result = await sshService.executeCommand(client, installCmd, { timeout });

      if (result.code !== 0) {
        return {
          success: false,
          message: `Failed to install packages: ${result.stderr}`,
        };
      }

      return {
        success: true,
        message: `Successfully installed: ${packages.join(', ')}`,
        installedPackages: packages,
      };
    } catch (error) {
      logger.error('Error installing packages:', error);
      return {
        success: false,
        message: `Error installing packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check if a package is installed
   */
  async isPackageInstalled(client: Client, osInfo: OSInfo, packageName: string): Promise<boolean> {
    const commands = PACKAGE_MANAGER_COMMANDS[osInfo.packageManager];

    try {
      const result = await sshService.executeCommand(client, commands.checkInstalled(packageName));
      return result.code === 0;
    } catch {
      return false;
    }
  }

  /**
   * Get VNC server packages for the OS
   */
  getVNCServerPackages(osInfo: OSInfo): { primary: string[]; fallback: string[] } {
    const packages = PACKAGE_NAMES[osInfo.distroFamily];
    return {
      primary: packages.vncServer,
      fallback: packages.vncServerFallback,
    };
  }

  /**
   * Get X server packages for the OS
   */
  getXServerPackages(osInfo: OSInfo): string[] {
    return PACKAGE_NAMES[osInfo.distroFamily].xserver;
  }

  /**
   * Get desktop environment packages for the OS
   */
  getDesktopPackages(osInfo: OSInfo, desktop: 'xfce' | 'lxde'): string[] {
    return PACKAGE_NAMES[osInfo.distroFamily][desktop];
  }

  /**
   * Install VNC server with fallback support
   */
  async installVNCServer(
    client: Client,
    osInfo: OSInfo
  ): Promise<{ success: boolean; message: string; vncType?: string }> {
    const packages = this.getVNCServerPackages(osInfo);

    // Try primary VNC packages first
    logger.info(`Attempting to install primary VNC packages: ${packages.primary.join(', ')}`);
    let result = await this.installPackages(client, osInfo, packages.primary, TIMEOUTS.vncInstall);

    if (result.success) {
      return { success: true, message: 'VNC server installed', vncType: 'tigervnc' };
    }

    // Try fallback packages
    if (packages.fallback.length > 0 && packages.fallback[0] !== packages.primary[0]) {
      logger.info(`Primary failed, trying fallback: ${packages.fallback.join(', ')}`);
      result = await this.installPackages(client, osInfo, packages.fallback, TIMEOUTS.vncInstall);

      if (result.success) {
        return { success: true, message: 'VNC server (fallback) installed', vncType: 'tightvnc' };
      }
    }

    return { success: false, message: `Failed to install VNC server: ${result.message}` };
  }

  /**
   * Install X server dependencies
   */
  async installXServerDependencies(
    client: Client,
    osInfo: OSInfo
  ): Promise<{ success: boolean; message: string }> {
    const packages = this.getXServerPackages(osInfo);
    return this.installPackages(client, osInfo, packages, TIMEOUTS.xserverInstall);
  }

  /**
   * Install desktop environment
   */
  async installDesktopEnvironment(
    client: Client,
    osInfo: OSInfo,
    desktop: 'xfce' | 'lxde'
  ): Promise<{ success: boolean; message: string }> {
    const packages = this.getDesktopPackages(osInfo, desktop);

    // For RHEL family with group installs (@xfce, @lxde-desktop)
    if (osInfo.distroFamily === 'rhel') {
      return this.installRhelDesktopGroup(client, osInfo, desktop);
    }

    return this.installPackages(client, osInfo, packages, TIMEOUTS.desktopInstall);
  }

  /**
   * Install RHEL desktop group (uses dnf/yum group install)
   */
  private async installRhelDesktopGroup(
    client: Client,
    osInfo: OSInfo,
    desktop: 'xfce' | 'lxde'
  ): Promise<{ success: boolean; message: string }> {
    const groupName = desktop === 'xfce' ? 'Xfce' : 'LXDE Desktop';
    const pm = osInfo.packageManager;

    try {
      // Try group install first
      const groupCmd = pm === 'dnf'
        ? `sudo dnf groupinstall -y "${groupName}"`
        : `sudo yum groupinstall -y "${groupName}"`;

      logger.info(`Installing ${desktop} desktop group...`);
      let result = await sshService.executeCommand(client, groupCmd, { timeout: TIMEOUTS.desktopInstall });

      if (result.code === 0) {
        // Install additional packages
        const additionalPkgs = ['dbus-x11', desktop === 'xfce' ? 'xfce4-terminal' : 'lxterminal'];
        await this.installPackages(client, osInfo, additionalPkgs, TIMEOUTS.vncInstall);
        return { success: true, message: `${desktop.toUpperCase()} desktop installed` };
      }

      // Fallback to individual packages if group install fails
      logger.warn(`Group install failed, trying individual packages...`);
      const packages = PACKAGE_NAMES.rhel[desktop].filter((p) => !p.startsWith('@'));
      return this.installPackages(client, osInfo, packages, TIMEOUTS.desktopInstall);
    } catch (error) {
      return {
        success: false,
        message: `Error installing desktop: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get package manager info string
   */
  getPackageManagerInfo(osInfo: OSInfo): string {
    const pmNames: Record<PackageManager, string> = {
      apt: 'APT (Debian/Ubuntu)',
      dnf: 'DNF (Fedora/RHEL 8+)',
      yum: 'YUM (CentOS/RHEL 7)',
      pacman: 'Pacman (Arch)',
      apk: 'APK (Alpine)',
      zypper: 'Zypper (openSUSE/SLES)',
      unknown: 'Unknown',
    };
    return pmNames[osInfo.packageManager];
  }
}

export const packageManagerService = new PackageManagerService();
export default packageManagerService;
