/**
 * License Service
 * Validates and manages CloudDesk license keys for self-hosted deployments
 */

import crypto from 'crypto';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

// License tiers and their features
export type LicenseTier = 'community' | 'team' | 'enterprise';

export interface LicenseInfo {
  tier: LicenseTier;
  valid: boolean;
  expiresAt: Date | null;
  maxUsers: number;
  maxInstances: number;
  maxConcurrentSessions: number;
  features: {
    sso: boolean;
    auditLogs: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    multiTenant: boolean;
  };
  organization?: string;
  email?: string;
}

// Community (free) tier limits
const COMMUNITY_LICENSE: LicenseInfo = {
  tier: 'community',
  valid: true,
  expiresAt: null,
  maxUsers: 5,
  maxInstances: 10,
  maxConcurrentSessions: 3,
  features: {
    sso: false,
    auditLogs: false,
    customBranding: false,
    prioritySupport: false,
    apiAccess: true,
    multiTenant: false,
  },
};

// Team tier limits
const TEAM_LICENSE_BASE: Omit<LicenseInfo, 'expiresAt' | 'organization' | 'email'> = {
  tier: 'team',
  valid: true,
  maxUsers: -1, // Unlimited
  maxInstances: -1, // Unlimited
  maxConcurrentSessions: 20,
  features: {
    sso: false,
    auditLogs: true,
    customBranding: true,
    prioritySupport: false,
    apiAccess: true,
    multiTenant: false,
  },
};

// Enterprise tier limits
const ENTERPRISE_LICENSE_BASE: Omit<LicenseInfo, 'expiresAt' | 'organization' | 'email'> = {
  tier: 'enterprise',
  valid: true,
  maxUsers: -1, // Unlimited
  maxInstances: -1, // Unlimited
  maxConcurrentSessions: -1, // Unlimited
  features: {
    sso: true,
    auditLogs: true,
    customBranding: true,
    prioritySupport: true,
    apiAccess: true,
    multiTenant: true,
  },
};

/**
 * License key format: TIER-XXXXXXXX-XXXXXXXX-XXXXXXXX-CHECKSUM
 * Example: TEAM-A1B2C3D4-E5F6G7H8-I9J0K1L2-ABCD
 */

class LicenseService {
  private cachedLicense: LicenseInfo | null = null;
  private readonly publicKey: string;

  constructor() {
    // Public key for license verification (in production, this would be a real RSA public key)
    this.publicKey = 'clouddesk-license-verification-key-v1';
  }

  /**
   * Parse and validate a license key
   */
  parseLicenseKey(licenseKey: string): LicenseInfo {
    if (!licenseKey || licenseKey.trim() === '') {
      logger.info('No license key provided, using community tier');
      return { ...COMMUNITY_LICENSE };
    }

    try {
      // Parse license key format
      const parts = licenseKey.trim().toUpperCase().split('-');

      if (parts.length < 5) {
        logger.warn('Invalid license key format');
        return { ...COMMUNITY_LICENSE, valid: false };
      }

      const tierRaw = parts[0];
      const tier = tierRaw.toLowerCase() as LicenseTier;
      const payload = parts.slice(1, -1).join('-');
      const checksum = parts[parts.length - 1];

      // Verify checksum
      const expectedChecksum = this.generateChecksum(tierRaw, payload);
      if (checksum !== expectedChecksum) {
        logger.warn('License key checksum mismatch');
        return { ...COMMUNITY_LICENSE, valid: false };
      }

      // Decode payload
      const decoded = this.decodePayload(payload);

      // Check expiration
      if (decoded.expiresAt && new Date(decoded.expiresAt) < new Date()) {
        logger.warn('License key has expired', { expiresAt: decoded.expiresAt });
        return {
          ...COMMUNITY_LICENSE,
          valid: false,
          organization: decoded.organization,
          email: decoded.email,
        };
      }

      // Return appropriate license based on tier
      if (tier === 'team') {
        return {
          ...TEAM_LICENSE_BASE,
          expiresAt: decoded.expiresAt ? new Date(decoded.expiresAt) : null,
          organization: decoded.organization,
          email: decoded.email,
        };
      } else if (tier === 'enterprise') {
        return {
          ...ENTERPRISE_LICENSE_BASE,
          expiresAt: decoded.expiresAt ? new Date(decoded.expiresAt) : null,
          organization: decoded.organization,
          email: decoded.email,
        };
      } else {
        return { ...COMMUNITY_LICENSE };
      }
    } catch (error) {
      logger.error('Failed to parse license key:', error);
      return { ...COMMUNITY_LICENSE, valid: false };
    }
  }

  /**
   * Get current license info
   */
  getLicense(): LicenseInfo {
    if (!this.cachedLicense) {
      this.cachedLicense = this.parseLicenseKey(env.LICENSE_KEY);
    }
    return this.cachedLicense;
  }

  /**
   * Refresh license (e.g., after env change)
   */
  refreshLicense(): LicenseInfo {
    this.cachedLicense = null;
    return this.getLicense();
  }

  /**
   * Check if a specific feature is enabled
   */
  hasFeature(feature: keyof LicenseInfo['features']): boolean {
    const license = this.getLicense();
    return license.valid && license.features[feature];
  }

  /**
   * Check if user count is within limits
   */
  canAddUser(currentUserCount: number): boolean {
    const license = this.getLicense();
    if (!license.valid) return false;
    if (license.maxUsers === -1) return true; // Unlimited
    return currentUserCount < license.maxUsers;
  }

  /**
   * Check if instance count is within limits
   */
  canAddInstance(currentInstanceCount: number): boolean {
    const license = this.getLicense();
    if (!license.valid) return false;
    if (license.maxInstances === -1) return true; // Unlimited
    return currentInstanceCount < license.maxInstances;
  }

  /**
   * Check if session count is within limits
   */
  canStartSession(currentSessionCount: number): boolean {
    const license = this.getLicense();
    if (!license.valid) return false;
    if (license.maxConcurrentSessions === -1) return true; // Unlimited
    return currentSessionCount < license.maxConcurrentSessions;
  }

  /**
   * Get license summary for admin dashboard
   */
  getLicenseSummary(): {
    tier: LicenseTier;
    valid: boolean;
    expiresAt: string | null;
    organization: string | null;
    limits: {
      users: string;
      instances: string;
      sessions: string;
    };
    features: string[];
  } {
    const license = this.getLicense();

    const formatLimit = (limit: number) => limit === -1 ? 'Unlimited' : limit.toString();

    const enabledFeatures = Object.entries(license.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature);

    return {
      tier: license.tier,
      valid: license.valid,
      expiresAt: license.expiresAt?.toISOString() || null,
      organization: license.organization || null,
      limits: {
        users: formatLimit(license.maxUsers),
        instances: formatLimit(license.maxInstances),
        sessions: formatLimit(license.maxConcurrentSessions),
      },
      features: enabledFeatures,
    };
  }

  /**
   * Generate checksum for license validation
   */
  private generateChecksum(tier: string, payload: string): string {
    const data = `${tier}-${payload}-${this.publicKey}`;
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 4)
      .toUpperCase();
  }

  /**
   * Decode license payload
   */
  private decodePayload(_payload: string): {
    expiresAt?: string;
    organization?: string;
    email?: string;
  } {
    // Simple payload decoding (in production, this would use proper encryption)
    // For self-hosted, return perpetual license info
    return {
      organization: 'Self-Hosted',
      expiresAt: undefined, // Perpetual for self-hosted
    };
  }

  /**
   * Generate a license key (for admin/sales use)
   */
  generateLicenseKey(
    tier: LicenseTier,
    _organization: string,
    _email: string,
    _expiresAt?: Date
  ): string {
    // Generate random payload segments
    const segment = () => crypto.randomBytes(4).toString('hex').toUpperCase();
    const payload = `${segment()}-${segment()}-${segment()}`;

    // Generate checksum
    const checksum = this.generateChecksum(tier.toUpperCase(), payload);

    return `${tier.toUpperCase()}-${payload}-${checksum}`;
  }
}

// Export singleton instance
export const licenseService = new LicenseService();

export default licenseService;
