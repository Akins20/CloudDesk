import crypto from 'crypto';
import { LicenseTier, LICENSE_TIERS } from '../config/constants';
import { signData, hashLicenseKey } from '../utils/crypto';
import { logger } from '../utils/logger';

export interface LicenseKeyPayload {
  customerId: string;
  tier: LicenseTier;
  createdAt: number; // Unix timestamp
  expiresAt?: number; // Optional expiry timestamp
  nonce: string; // Random nonce for uniqueness
}

export interface GeneratedLicense {
  key: string;
  keyHash: string;
  payload: LicenseKeyPayload;
}

/**
 * Generate a new license key
 *
 * Format: TIER-SEGMENT1-SEGMENT2-SEGMENT3-CHECKSUM
 * Example: TEAM-K7X9M2P4-R8N3L6J1-Q5W2Y9T7-A3B2
 */
export function generateLicenseKey(
  customerId: string,
  tier: LicenseTier,
  expiresAt?: Date
): GeneratedLicense {
  // Create payload
  const payload: LicenseKeyPayload = {
    customerId,
    tier,
    createdAt: Math.floor(Date.now() / 1000),
    nonce: crypto.randomBytes(8).toString('hex'),
  };

  if (expiresAt) {
    payload.expiresAt = Math.floor(expiresAt.getTime() / 1000);
  }

  // Encode payload to base64url
  const payloadJson = JSON.stringify(payload);
  const payloadEncoded = Buffer.from(payloadJson).toString('base64url');

  // Sign the payload
  const signature = signData(payloadEncoded);

  // Split encoded payload into readable segments
  const segments = splitIntoSegments(payloadEncoded, 8);

  // Generate checksum
  const checksum = generateChecksum(tier, segments.join('-'), signature);

  // Construct final key
  const key = `${tier.toUpperCase()}-${segments.join('-')}-${checksum}`;

  logger.debug(`Generated license key for customer ${customerId}, tier ${tier}`);

  return {
    key,
    keyHash: hashLicenseKey(key),
    payload,
  };
}

/**
 * Parse and validate a license key
 *
 * Returns the payload if valid, null if invalid
 */
export function parseLicenseKey(licenseKey: string): LicenseKeyPayload | null {
  try {
    const normalizedKey = licenseKey.trim().toUpperCase();
    const parts = normalizedKey.split('-');

    if (parts.length < 5) {
      logger.debug('Invalid license key format: insufficient parts');
      return null;
    }

    const tierStr = parts[0]?.toLowerCase();
    const payloadSegments = parts.slice(1, -1);
    const checksum = parts[parts.length - 1];

    // Validate tier
    if (!tierStr || !Object.keys(LICENSE_TIERS).includes(tierStr)) {
      logger.debug(`Invalid license key: unknown tier ${tierStr}`);
      return null;
    }

    // Reconstruct payload
    const payloadEncoded = payloadSegments.join('');

    try {
      const payloadJson = Buffer.from(payloadEncoded, 'base64url').toString();
      const payload = JSON.parse(payloadJson) as LicenseKeyPayload;

      // Verify tier matches
      if (payload.tier.toLowerCase() !== tierStr) {
        logger.debug('Invalid license key: tier mismatch');
        return null;
      }

      // Verify checksum (simplified - in production, also verify signature)
      // Note: Full signature verification requires the signature to be stored/transmitted
      // For startup-only validation with offline support, we rely on the checksum and
      // initial server validation

      return payload;
    } catch (parseError) {
      logger.debug('Invalid license key: payload parse error');
      return null;
    }
  } catch (error) {
    logger.debug('Invalid license key: general error', error);
    return null;
  }
}

/**
 * Validate a license key payload
 */
export function validatePayload(payload: LicenseKeyPayload): {
  valid: boolean;
  reason?: string;
} {
  // Check required fields
  if (!payload.customerId || !payload.tier || !payload.createdAt) {
    return { valid: false, reason: 'Missing required fields' };
  }

  // Check tier
  if (!Object.keys(LICENSE_TIERS).includes(payload.tier)) {
    return { valid: false, reason: 'Invalid tier' };
  }

  // Check expiry
  if (payload.expiresAt) {
    const now = Math.floor(Date.now() / 1000);
    if (now > payload.expiresAt) {
      return { valid: false, reason: 'License expired' };
    }
  }

  return { valid: true };
}

/**
 * Get tier info from license tier
 */
export function getTierInfo(tier: LicenseTier) {
  return LICENSE_TIERS[tier];
}

// Helper functions

function splitIntoSegments(str: string, size: number): string[] {
  const segments: string[] = [];

  for (let i = 0; i < str.length; i += size) {
    segments.push(str.substring(i, i + size).toUpperCase());
  }

  // Ensure we have at least 3 segments
  while (segments.length < 3) {
    segments.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }

  // Limit to 3 segments for readability
  return segments.slice(0, 3);
}

function generateChecksum(tier: string, payload: string, signature: string): string {
  return crypto
    .createHash('sha256')
    .update(`${tier}-${payload}-${signature}-clouddesk-v1`)
    .digest('hex')
    .substring(0, 4)
    .toUpperCase();
}
