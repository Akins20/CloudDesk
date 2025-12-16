import mongoose, { Document, Schema, Types } from 'mongoose';
import { LicenseTier, LicenseStatus, LICENSE_STATUS } from '../config/constants';

export interface ILicenseMetadata {
  instanceId?: string;
  hostname?: string;
  lastValidatedAt?: Date;
  validationCount: number;
}

export interface ILicense extends Document {
  key: string;
  keyHash: string;
  customerId: Types.ObjectId;
  tier: LicenseTier;
  status: LicenseStatus;
  subscriptionId?: Types.ObjectId;
  expiresAt?: Date;
  revokedAt?: Date;
  revokedReason?: string;
  metadata: ILicenseMetadata;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  isValid(): boolean;
  recordValidation(instanceId: string, hostname: string): Promise<void>;
}

const licenseSchema = new Schema<ILicense>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    keyHash: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ['community', 'team', 'enterprise'],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(LICENSE_STATUS),
      default: LICENSE_STATUS.ACTIVE,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    expiresAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
    },
    metadata: {
      instanceId: String,
      hostname: String,
      lastValidatedAt: Date,
      validationCount: {
        type: Number,
        default: 0,
      },
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Check if license is valid
licenseSchema.methods.isValid = function (): boolean {
  // Check status
  if (this.status !== LICENSE_STATUS.ACTIVE) {
    return false;
  }

  // Check expiry
  if (this.expiresAt && new Date() > this.expiresAt) {
    return false;
  }

  return true;
};

// Record a validation attempt
licenseSchema.methods.recordValidation = async function (
  instanceId: string,
  hostname: string
): Promise<void> {
  this.metadata.instanceId = instanceId;
  this.metadata.hostname = hostname;
  this.metadata.lastValidatedAt = new Date();
  this.metadata.validationCount = (this.metadata.validationCount || 0) + 1;
  await this.save();
};

// Indexes
licenseSchema.index({ customerId: 1, status: 1 });
licenseSchema.index({ 'metadata.lastValidatedAt': -1 });

export const License = mongoose.model<ILicense>('License', licenseSchema);
