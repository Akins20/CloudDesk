import { Types } from 'mongoose';
import { License, ILicense } from '../models/License';
import { AuditLog } from '../models/AuditLog';
import { LicenseError, NotFoundError, ValidationError } from '../utils/errors';
import { ERROR_CODES, LicenseTier, LICENSE_TIERS, LICENSE_STATUS } from '../config/constants';
import { hashLicenseKey } from '../utils/crypto';
import {
  generateLicenseKey,
  parseLicenseKey,
  validatePayload,
  getTierInfo,
} from './licenseKeyGenerator';
import { logger } from '../utils/logger';

export interface CreateLicenseData {
  customerId: string;
  tier: LicenseTier;
  subscriptionId?: string;
  expiresAt?: Date;
  notes?: string;
}

export interface ValidationResult {
  valid: boolean;
  tier: LicenseTier;
  expiresAt: Date | null;
  limits: {
    maxUsers: number;
    maxInstances: number;
    maxConcurrentSessions: number;
  };
  features: {
    sso: boolean;
    auditLogs: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    multiTenant: boolean;
  };
  organization?: string;
  validatedAt: string;
}

/**
 * Create a new license
 */
export async function createLicense(
  data: CreateLicenseData,
  adminId?: string
): Promise<{ license: ILicense; key: string }> {
  // Generate license key
  const { key, keyHash, payload } = generateLicenseKey(
    data.customerId,
    data.tier,
    data.expiresAt
  );

  // Create license record
  const license = await License.create({
    key,
    keyHash,
    customerId: new Types.ObjectId(data.customerId),
    tier: data.tier,
    status: LICENSE_STATUS.ACTIVE,
    subscriptionId: data.subscriptionId ? new Types.ObjectId(data.subscriptionId) : undefined,
    expiresAt: data.expiresAt,
    notes: data.notes,
    metadata: {
      validationCount: 0,
    },
  });

  // Audit log
  await AuditLog.create({
    entityType: 'license',
    entityId: license._id,
    action: 'license.created',
    actorType: adminId ? 'admin' : 'system',
    actorId: adminId ? new Types.ObjectId(adminId) : undefined,
    details: { tier: data.tier, customerId: data.customerId },
  });

  logger.info(`License created: ${license._id}, tier: ${data.tier}`);

  return { license, key };
}

/**
 * Validate a license key (called by self-hosted instances on startup)
 */
export async function validateLicense(
  licenseKey: string,
  instanceId: string,
  hostname: string,
  ipAddress?: string
): Promise<ValidationResult> {
  // Hash the key for lookup
  const keyHash = hashLicenseKey(licenseKey);

  // Find license by hash
  const license = await License.findOne({ keyHash }).populate('customerId');

  if (!license) {
    logger.warn(`License validation failed: key not found`);
    throw new LicenseError('License key not found', ERROR_CODES.LICENSE_NOT_FOUND);
  }

  // Check status
  if (license.status === LICENSE_STATUS.REVOKED) {
    logger.warn(`License validation failed: revoked, license: ${license._id}`);
    throw new LicenseError('License has been revoked', ERROR_CODES.LICENSE_REVOKED);
  }

  if (license.status === LICENSE_STATUS.SUSPENDED) {
    logger.warn(`License validation failed: suspended, license: ${license._id}`);
    throw new LicenseError('License is suspended', ERROR_CODES.LICENSE_SUSPENDED);
  }

  if (license.status === LICENSE_STATUS.EXPIRED) {
    logger.warn(`License validation failed: expired, license: ${license._id}`);
    throw new LicenseError('License has expired', ERROR_CODES.LICENSE_EXPIRED);
  }

  // Check expiry
  if (license.expiresAt && new Date() > license.expiresAt) {
    // Update status
    license.status = LICENSE_STATUS.EXPIRED;
    await license.save();

    logger.warn(`License validation failed: expired, license: ${license._id}`);
    throw new LicenseError('License has expired', ERROR_CODES.LICENSE_EXPIRED);
  }

  // Record validation
  await license.recordValidation(instanceId, hostname);

  // Audit log
  await AuditLog.create({
    entityType: 'license',
    entityId: license._id,
    action: 'license.validated',
    actorType: 'system',
    details: { instanceId, hostname },
    ipAddress,
  });

  // Get tier info
  const tierInfo = getTierInfo(license.tier);
  const customer = license.customerId as unknown as { organizationName?: string };

  logger.info(`License validated: ${license._id}, tier: ${license.tier}, instance: ${instanceId}`);

  return {
    valid: true,
    tier: license.tier,
    expiresAt: license.expiresAt || null,
    limits: {
      maxUsers: tierInfo.maxUsers,
      maxInstances: tierInfo.maxInstances,
      maxConcurrentSessions: tierInfo.maxConcurrentSessions,
    },
    features: tierInfo.features,
    organization: customer?.organizationName,
    validatedAt: new Date().toISOString(),
  };
}

/**
 * Get license by ID
 */
export async function getLicenseById(licenseId: string): Promise<ILicense> {
  if (!Types.ObjectId.isValid(licenseId)) {
    throw new NotFoundError('License not found', ERROR_CODES.LICENSE_NOT_FOUND);
  }

  const license = await License.findById(licenseId).populate('customerId', 'email organizationName');

  if (!license) {
    throw new NotFoundError('License not found', ERROR_CODES.LICENSE_NOT_FOUND);
  }

  return license;
}

/**
 * Get license status (public endpoint)
 */
export async function getLicenseStatus(licenseKey: string): Promise<{
  valid: boolean;
  tier: LicenseTier;
  status: string;
  expiresAt: Date | null;
}> {
  const keyHash = hashLicenseKey(licenseKey);
  const license = await License.findOne({ keyHash });

  if (!license) {
    throw new NotFoundError('License not found', ERROR_CODES.LICENSE_NOT_FOUND);
  }

  return {
    valid: license.isValid(),
    tier: license.tier,
    status: license.status,
    expiresAt: license.expiresAt || null,
  };
}

/**
 * Revoke a license
 */
export async function revokeLicense(
  licenseId: string,
  reason: string,
  adminId?: string
): Promise<ILicense> {
  const license = await getLicenseById(licenseId);

  license.status = LICENSE_STATUS.REVOKED;
  license.revokedAt = new Date();
  license.revokedReason = reason;
  await license.save();

  // Audit log
  await AuditLog.create({
    entityType: 'license',
    entityId: license._id,
    action: 'license.revoked',
    actorType: adminId ? 'admin' : 'system',
    actorId: adminId ? new Types.ObjectId(adminId) : undefined,
    details: { reason },
  });

  logger.info(`License revoked: ${license._id}, reason: ${reason}`);

  return license;
}

/**
 * Suspend a license (temporary)
 */
export async function suspendLicense(licenseId: string, reason: string): Promise<ILicense> {
  const license = await getLicenseById(licenseId);

  license.status = LICENSE_STATUS.SUSPENDED;
  await license.save();

  // Audit log
  await AuditLog.create({
    entityType: 'license',
    entityId: license._id,
    action: 'license.suspended',
    actorType: 'system',
    details: { reason },
  });

  logger.info(`License suspended: ${license._id}, reason: ${reason}`);

  return license;
}

/**
 * Reactivate a suspended license
 */
export async function reactivateLicense(licenseId: string, adminId?: string): Promise<ILicense> {
  const license = await getLicenseById(licenseId);

  if (license.status !== LICENSE_STATUS.SUSPENDED) {
    throw new ValidationError('Only suspended licenses can be reactivated');
  }

  license.status = LICENSE_STATUS.ACTIVE;
  await license.save();

  // Audit log
  await AuditLog.create({
    entityType: 'license',
    entityId: license._id,
    action: 'license.reactivated',
    actorType: adminId ? 'admin' : 'system',
    actorId: adminId ? new Types.ObjectId(adminId) : undefined,
  });

  logger.info(`License reactivated: ${license._id}`);

  return license;
}

/**
 * Extend license expiry
 */
export async function extendLicense(
  licenseId: string,
  newExpiryDate: Date,
  adminId?: string
): Promise<ILicense> {
  const license = await getLicenseById(licenseId);

  const oldExpiry = license.expiresAt;
  license.expiresAt = newExpiryDate;

  // If was expired, reactivate
  if (license.status === LICENSE_STATUS.EXPIRED) {
    license.status = LICENSE_STATUS.ACTIVE;
  }

  await license.save();

  // Audit log
  await AuditLog.create({
    entityType: 'license',
    entityId: license._id,
    action: 'license.extended',
    actorType: adminId ? 'admin' : 'system',
    actorId: adminId ? new Types.ObjectId(adminId) : undefined,
    details: { oldExpiry, newExpiry: newExpiryDate },
  });

  logger.info(`License extended: ${license._id}, new expiry: ${newExpiryDate}`);

  return license;
}

/**
 * Get licenses with pagination (admin)
 */
export async function getLicenses(
  page: number = 1,
  limit: number = 20,
  filters?: { status?: string; tier?: LicenseTier; customerId?: string }
) {
  const query: Record<string, unknown> = {};

  if (filters?.status) query.status = filters.status;
  if (filters?.tier) query.tier = filters.tier;
  if (filters?.customerId) query.customerId = new Types.ObjectId(filters.customerId);

  const [licenses, total] = await Promise.all([
    License.find(query)
      .populate('customerId', 'email organizationName')
      .select('-key') // Don't return full key
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    License.countDocuments(query),
  ]);

  return {
    licenses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get license analytics
 */
export async function getLicenseAnalytics() {
  const [totalLicenses, byStatus, byTier, recentValidations] = await Promise.all([
    License.countDocuments(),
    License.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    License.aggregate([{ $group: { _id: '$tier', count: { $sum: 1 } } }]),
    License.find({ 'metadata.lastValidatedAt': { $exists: true } })
      .sort({ 'metadata.lastValidatedAt': -1 })
      .limit(10)
      .select('tier metadata.lastValidatedAt metadata.hostname'),
  ]);

  return {
    totalLicenses,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    byTier: Object.fromEntries(byTier.map((t) => [t._id, t.count])),
    recentValidations,
  };
}
