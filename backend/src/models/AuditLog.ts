import mongoose, { Document, Schema, Model } from 'mongoose';
import { AUDIT_ACTIONS, AuditAction } from '../config/constants';

export interface IAuditLog {
  userId: mongoose.Types.ObjectId;
  action: AuditAction;
  resource?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  createdAt: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IAuditLogModel extends Model<IAuditLogDocument> {
  logAction(data: {
    userId: string | mongoose.Types.ObjectId;
    action: AuditAction;
    resource?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failure';
  }): Promise<IAuditLogDocument>;
  findByUserId(
    userId: string | mongoose.Types.ObjectId,
    options?: { limit?: number; skip?: number }
  ): Promise<IAuditLogDocument[]>;
  findByAction(
    action: AuditAction,
    options?: { limit?: number; skip?: number; startDate?: Date; endDate?: Date }
  ): Promise<IAuditLogDocument[]>;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTIONS),
      required: [true, 'Action is required'],
      index: true,
    },
    resource: {
      type: String,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      required: [true, 'Status is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, action: 1, createdAt: -1 });

// TTL index to automatically delete old audit logs after 90 days
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

// Static method to log an action
auditLogSchema.statics.logAction = async function (data: {
  userId: string | mongoose.Types.ObjectId;
  action: AuditAction;
  resource?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
}): Promise<IAuditLogDocument> {
  const auditLog = new this(data);
  return auditLog.save();
};

// Static method to find audit logs by user ID
auditLogSchema.statics.findByUserId = async function (
  userId: string | mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number } = {}
): Promise<IAuditLogDocument[]> {
  const { limit = 50, skip = 0 } = options;
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find audit logs by action
auditLogSchema.statics.findByAction = async function (
  action: AuditAction,
  options: { limit?: number; skip?: number; startDate?: Date; endDate?: Date } = {}
): Promise<IAuditLogDocument[]> {
  const { limit = 50, skip = 0, startDate, endDate } = options;

  const query: Record<string, unknown> = { action };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      (query.createdAt as Record<string, Date>).$gte = startDate;
    }
    if (endDate) {
      (query.createdAt as Record<string, Date>).$lte = endDate;
    }
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const AuditLog = mongoose.model<IAuditLogDocument, IAuditLogModel>(
  'AuditLog',
  auditLogSchema
);

export default AuditLog;
