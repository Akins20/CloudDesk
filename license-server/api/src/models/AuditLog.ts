import mongoose, { Document, Schema, Types } from 'mongoose';

export type EntityType = 'customer' | 'license' | 'subscription' | 'admin';
export type ActorType = 'customer' | 'admin' | 'system' | 'stripe';

export interface IAuditLog extends Document {
  entityType: EntityType;
  entityId: Types.ObjectId;
  action: string;
  actorType: ActorType;
  actorId?: Types.ObjectId;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    entityType: {
      type: String,
      enum: ['customer', 'license', 'subscription', 'admin'],
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    actorType: {
      type: String,
      enum: ['customer', 'admin', 'system', 'stripe'],
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for common queries
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorType: 1, actorId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// Static method to create audit log
auditLogSchema.statics.log = async function (
  entityType: EntityType,
  entityId: Types.ObjectId,
  action: string,
  actorType: ActorType,
  actorId?: Types.ObjectId,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<IAuditLog> {
  return this.create({
    entityType,
    entityId,
    action,
    actorType,
    actorId,
    details: details || {},
    ipAddress,
    userAgent,
  });
};

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
