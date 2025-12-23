import { Client } from 'ssh2';
import { sshService } from '../services/sshService';
import { logger } from './logger';

/**
 * Supported Linux distribution families
 */
export type DistroFamily = 'debian' | 'rhel' | 'arch' | 'alpine' | 'suse' | 'unknown';

/**
 * Supported package managers
 */
export type PackageManager = 'apt' | 'yum' | 'dnf' | 'pacman' | 'apk' | 'zypper' | 'unknown';

/**
 * Detailed OS information
 */
export interface OSInfo {
  distroFamily: DistroFamily;
  distroName: string;
  distroId: string;
  version: string;
  versionId: string;
  packageManager: PackageManager;
  kernel: string;
  architecture: string;
  isSupported: boolean;
  sudoAvailable: boolean;
}

/**
 * Distribution ID to family mapping
 */
const DISTRO_FAMILY_MAP: Record<string, DistroFamily> = {
  // Debian family
  debian: 'debian',
  ubuntu: 'debian',
  linuxmint: 'debian',
  pop: 'debian',
  elementary: 'debian',
  zorin: 'debian',
  kali: 'debian',
  parrot: 'debian',
  raspbian: 'debian',

  // RHEL family
  rhel: 'rhel',
  centos: 'rhel',
  fedora: 'rhel',
  rocky: 'rhel',
  almalinux: 'rhel',
  oracle: 'rhel',
  amzn: 'rhel',  // Amazon Linux
  amazon: 'rhel',

  // Arch family
  arch: 'arch',
  manjaro: 'arch',
  endeavouros: 'arch',
  garuda: 'arch',

  // Alpine
  alpine: 'alpine',

  // SUSE family
  opensuse: 'suse',
  suse: 'suse',
  sles: 'suse',
};

/**
 * Package manager for each distribution family
 */
const FAMILY_PACKAGE_MANAGER: Record<DistroFamily, PackageManager> = {
  debian: 'apt',
  rhel: 'dnf',  // Modern default, will check for yum fallback
  arch: 'pacman',
  alpine: 'apk',
  suse: 'zypper',
  unknown: 'unknown',
};

class OSDetector {
  /**
   * Detect complete OS information from remote system
   */
  async detectOS(client: Client): Promise<OSInfo> {
    try {
      // Get OS release info, kernel, and architecture in parallel
      const [osReleaseResult, kernelResult, archResult, sudoResult] = await Promise.all([
        sshService.executeCommand(client, 'cat /etc/os-release 2>/dev/null || echo "ID=unknown"'),
        sshService.executeCommand(client, 'uname -r'),
        sshService.executeCommand(client, 'uname -m'),
        sshService.executeCommand(client, 'which sudo >/dev/null 2>&1 && echo "yes" || echo "no"'),
      ]);

      // Parse /etc/os-release
      const osRelease = this.parseOsRelease(osReleaseResult.stdout);

      // Determine distro family
      const distroFamily = this.detectDistroFamily(osRelease.id, osRelease.idLike);

      // Determine package manager (with fallback check for RHEL family)
      let packageManager = FAMILY_PACKAGE_MANAGER[distroFamily];
      if (distroFamily === 'rhel') {
        packageManager = await this.detectRhelPackageManager(client);
      }

      const osInfo: OSInfo = {
        distroFamily,
        distroName: osRelease.name,
        distroId: osRelease.id,
        version: osRelease.version,
        versionId: osRelease.versionId,
        packageManager,
        kernel: kernelResult.stdout.trim(),
        architecture: archResult.stdout.trim(),
        isSupported: distroFamily !== 'unknown' && packageManager !== 'unknown',
        sudoAvailable: sudoResult.stdout.trim() === 'yes',
      };

      logger.info('Detected OS:', osInfo);
      return osInfo;
    } catch (error) {
      logger.error('Error detecting OS:', error);
      return this.getUnknownOSInfo();
    }
  }

  /**
   * Parse /etc/os-release content
   */
  private parseOsRelease(content: string): {
    id: string;
    idLike: string;
    name: string;
    version: string;
    versionId: string;
  } {
    const lines = content.split('\n');
    const values: Record<string, string> = {};

    for (const line of lines) {
      const match = line.match(/^([A-Z_]+)=["']?([^"'\n]*)["']?$/);
      if (match) {
        values[match[1].toLowerCase()] = match[2];
      }
    }

    return {
      id: (values.id || 'unknown').toLowerCase(),
      idLike: (values.id_like || '').toLowerCase(),
      name: values.name || values.pretty_name || 'Unknown',
      version: values.version || values.version_id || 'Unknown',
      versionId: values.version_id || 'unknown',
    };
  }

  /**
   * Detect distribution family from ID and ID_LIKE
   */
  private detectDistroFamily(id: string, idLike: string): DistroFamily {
    // First check direct ID mapping
    if (DISTRO_FAMILY_MAP[id]) {
      return DISTRO_FAMILY_MAP[id];
    }

    // Check ID_LIKE for parent distribution
    const idLikeDistros = idLike.split(/\s+/);
    for (const parentDistro of idLikeDistros) {
      if (DISTRO_FAMILY_MAP[parentDistro]) {
        return DISTRO_FAMILY_MAP[parentDistro];
      }
    }

    return 'unknown';
  }

  /**
   * Detect package manager for RHEL family (dnf vs yum)
   */
  private async detectRhelPackageManager(client: Client): Promise<PackageManager> {
    // Check for dnf first (modern RHEL/Fedora/CentOS 8+)
    const dnfResult = await sshService.executeCommand(client, 'which dnf >/dev/null 2>&1 && echo "yes" || echo "no"');
    if (dnfResult.stdout.trim() === 'yes') {
      return 'dnf';
    }

    // Fall back to yum (older CentOS/RHEL)
    const yumResult = await sshService.executeCommand(client, 'which yum >/dev/null 2>&1 && echo "yes" || echo "no"');
    if (yumResult.stdout.trim() === 'yes') {
      return 'yum';
    }

    return 'unknown';
  }

  /**
   * Get default unknown OS info
   */
  private getUnknownOSInfo(): OSInfo {
    return {
      distroFamily: 'unknown',
      distroName: 'Unknown',
      distroId: 'unknown',
      version: 'Unknown',
      versionId: 'unknown',
      packageManager: 'unknown',
      kernel: 'Unknown',
      architecture: 'Unknown',
      isSupported: false,
      sudoAvailable: false,
    };
  }

  /**
   * Get human-readable OS description
   */
  getOSDescription(osInfo: OSInfo): string {
    return `${osInfo.distroName} ${osInfo.version} (${osInfo.architecture}) - ${osInfo.packageManager}`;
  }

  /**
   * Check if OS is supported for VNC provisioning
   */
  isSupportedForVNC(osInfo: OSInfo): { supported: boolean; reason?: string } {
    if (!osInfo.isSupported) {
      return {
        supported: false,
        reason: `Unsupported distribution: ${osInfo.distroName}. Supported families: Debian/Ubuntu, RHEL/CentOS/Fedora, Arch, Alpine, SUSE.`,
      };
    }

    if (!osInfo.sudoAvailable) {
      return {
        supported: false,
        reason: 'sudo is not available. Root privileges are required to install VNC packages.',
      };
    }

    return { supported: true };
  }
}

export const osDetector = new OSDetector();
export default osDetector;
