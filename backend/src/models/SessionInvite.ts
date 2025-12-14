import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import crypto from 'crypto';

export type InvitePermission = 'view' | 'control';
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface ISessionInvite {
  sessionId: Types.ObjectId;
  invitedUserId?: Types.ObjectId;  // Optional - for specific user invites
  invitedEmail?: string;           // Optional - email for invite notification
  inviteToken: string;             // Unique shareable token
  permissions: InvitePermission;
  createdBy: Types.ObjectId;       // Session owner who created the invite
  expiresAt?: Date;                // Optional expiration
  usedAt?: Date;                   // When invite was used
  usedBy?: Types.ObjectId;         // Who used the invite
  status: InviteStatus;
  maxUses: number;                 // Maximum number of times this invite can be used (0 = unlimited)
  useCount: number;                // Current use count
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionInviteDocument extends ISessionInvite, Document {
  _id: Types.ObjectId;
  isValid(): boolean;
  markUsed(userId: string): Promise<void>;
  revoke(): Promise<void>;
}

export interface ISessionInviteModel extends Model<ISessionInviteDocument> {
  generateToken(): string;
  findByToken(token: string): Promise<ISessionInviteDocument | null>;
  findValidByToken(token: string): Promise<ISessionInviteDocument | null>;
  findBySession(sessionId: string): Promise<ISessionInviteDocument[]>;
  findPendingBySession(sessionId: string): Promise<ISessionInviteDocument[]>;
  cleanupExpired(): Promise<number>;
}

const sessionInviteSchema = new Schema<ISessionInviteDocument>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    invitedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    invitedEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    inviteToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    permissions: {
      type: String,
      enum: ['view', 'control'],
      default: 'view',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    maxUses: {
      type: Number,
      default: 1, // Single use by default
      min: 0,
    },
    useCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
sessionInviteSchema.index({ sessionId: 1, status: 1 });
sessionInviteSchema.index({ createdBy: 1, status: 1 });
sessionInviteSchema.index({ inviteToken: 1, status: 1 });

/**
 * Check if the invite is still valid
 */
sessionInviteSchema.methods.isValid = function (): boolean {
  // Check status
  if (this.status !== 'pending') {
    return false;
  }

  // Check expiration
  if (this.expiresAt && new Date() > this.expiresAt) {
    return false;
  }

  // Check max uses
  if (this.maxUses > 0 && this.useCount >= this.maxUses) {
    return false;
  }

  return true;
};

/**
 * Mark the invite as used
 */
sessionInviteSchema.methods.markUsed = async function (userId: string): Promise<void> {
  this.useCount += 1;
  this.usedAt = new Date();
  this.usedBy = new mongoose.Types.ObjectId(userId);

  // If maxUses reached, mark as accepted
  if (this.maxUses > 0 && this.useCount >= this.maxUses) {
    this.status = 'accepted';
  }

  await this.save();
};

/**
 * Revoke the invite
 */
sessionInviteSchema.methods.revoke = async function (): Promise<void> {
  this.status = 'revoked';
  await this.save();
};

/**
 * Generate a secure random token
 */
sessionInviteSchema.statics.generateToken = function (): string {
  // Generate a URL-safe base64 token
  return crypto.randomBytes(32).toString('base64url');
};

/**
 * Find invite by token
 */
sessionInviteSchema.statics.findByToken = async function (
  token: string
): Promise<ISessionInviteDocument | null> {
  return this.findOne({ inviteToken: token });
};

/**
 * Find valid invite by token (not expired, not revoked, uses remaining)
 */
sessionInviteSchema.statics.findValidByToken = async function (
  token: string
): Promise<ISessionInviteDocument | null> {
  const invite = await this.findOne({
    inviteToken: token,
    status: 'pending',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ],
  });

  if (!invite) return null;

  // Check max uses
  if (invite.maxUses > 0 && invite.useCount >= invite.maxUses) {
    return null;
  }

  return invite;
};

/**
 * Find all invites for a session
 */
sessionInviteSchema.statics.findBySession = async function (
  sessionId: string
): Promise<ISessionInviteDocument[]> {
  return this.find({ sessionId }).sort({ createdAt: -1 });
};

/**
 * Find pending invites for a session
 */
sessionInviteSchema.statics.findPendingBySession = async function (
  sessionId: string
): Promise<ISessionInviteDocument[]> {
  return this.find({
    sessionId,
    status: 'pending',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ],
  }).sort({ createdAt: -1 });
};

/**
 * Clean up expired invites
 */
sessionInviteSchema.statics.cleanupExpired = async function (): Promise<number> {
  const result = await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() },
    },
    {
      status: 'expired',
    }
  );

  return result.modifiedCount;
};

// Pre-save middleware to auto-expire
sessionInviteSchema.pre('save', function () {
  // Auto-expire if past expiration date
  if (this.status === 'pending' && this.expiresAt && new Date() > this.expiresAt) {
    this.status = 'expired';
  }
});

export const SessionInvite = mongoose.model<ISessionInviteDocument, ISessionInviteModel>(
  'SessionInvite',
  sessionInviteSchema
);

export default SessionInvite;
