import mongoose, { Document, Schema, Model } from 'mongoose';
import { SESSION_STATUSES, SessionStatus } from '../config/constants';

export interface ISession {
  userId: mongoose.Types.ObjectId;
  instanceId: mongoose.Types.ObjectId;
  vncDisplayNumber: number;
  vncPort: number;
  sshTunnelLocalPort: number;
  websocketPort: number;
  status: SessionStatus;
  errorMessage?: string;
  connectionStartedAt?: Date;
  connectionEndedAt?: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionDocument extends ISession, Document {
  _id: mongoose.Types.ObjectId;
  updateActivity(): Promise<void>;
  disconnect(errorMessage?: string): Promise<void>;
  isActive: boolean;
  duration: number | null;
}

export interface ISessionModel extends Model<ISessionDocument> {
  findActiveSessions(userId: string | mongoose.Types.ObjectId): Promise<ISessionDocument[]>;
  findActiveSessionByInstance(
    userId: string | mongoose.Types.ObjectId,
    instanceId: string | mongoose.Types.ObjectId
  ): Promise<ISessionDocument | null>;
  findInactiveSessions(timeoutMinutes: number): Promise<ISessionDocument[]>;
  countActiveSessions(userId: string | mongoose.Types.ObjectId): Promise<number>;
}

const sessionSchema = new Schema<ISessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    instanceId: {
      type: Schema.Types.ObjectId,
      ref: 'Instance',
      required: [true, 'Instance ID is required'],
      index: true,
    },
    vncDisplayNumber: {
      type: Number,
      required: [true, 'VNC display number is required'],
      min: [1, 'VNC display number must be at least 1'],
    },
    vncPort: {
      type: Number,
      required: [true, 'VNC port is required'],
      min: [5901, 'VNC port must be at least 5901'],
    },
    sshTunnelLocalPort: {
      type: Number,
      required: [true, 'SSH tunnel local port is required'],
      min: [1024, 'SSH tunnel port must be at least 1024'],
    },
    websocketPort: {
      type: Number,
      required: [true, 'WebSocket port is required'],
      min: [1024, 'WebSocket port must be at least 1024'],
    },
    status: {
      type: String,
      enum: SESSION_STATUSES,
      default: 'connecting',
      index: true,
    },
    errorMessage: {
      type: String,
    },
    connectionStartedAt: {
      type: Date,
    },
    connectionEndedAt: {
      type: Date,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Compound indexes
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ instanceId: 1, status: 1 });
sessionSchema.index({ lastActivityAt: 1, status: 1 });
sessionSchema.index({ createdAt: -1 });

// Virtual for checking if session is active
sessionSchema.virtual('isActive').get(function (this: ISessionDocument) {
  return this.status === 'connecting' || this.status === 'connected';
});

// Virtual for session duration
sessionSchema.virtual('duration').get(function (this: ISessionDocument) {
  if (!this.connectionStartedAt) return null;
  const endTime = this.connectionEndedAt || new Date();
  return endTime.getTime() - this.connectionStartedAt.getTime();
});

// Pre-save hook to update timestamps
sessionSchema.pre('save', function () {
  const session = this as ISessionDocument;
  if (session.isModified('status') && session.status === 'connected') {
    session.connectionStartedAt = new Date();
  }
  if (session.isModified('status') && (session.status === 'disconnected' || session.status === 'error')) {
    session.connectionEndedAt = new Date();
  }
});

// Instance method to update activity
sessionSchema.methods.updateActivity = async function (): Promise<void> {
  const session = this as ISessionDocument;
  session.lastActivityAt = new Date();
  await session.save();
};

// Instance method to disconnect session
sessionSchema.methods.disconnect = async function (errorMessage?: string): Promise<void> {
  const session = this as ISessionDocument;
  session.status = errorMessage ? 'error' : 'disconnected';
  session.connectionEndedAt = new Date();
  if (errorMessage) {
    session.errorMessage = errorMessage;
  }
  await session.save();
};

// Static method to find active sessions for a user
sessionSchema.statics.findActiveSessions = async function (
  userId: string | mongoose.Types.ObjectId
): Promise<ISessionDocument[]> {
  return this.find({
    userId,
    status: { $in: ['connecting', 'connected'] },
  })
    .populate('instanceId', 'name host provider')
    .sort({ createdAt: -1 });
};

// Static method to find active session for a specific instance
sessionSchema.statics.findActiveSessionByInstance = async function (
  userId: string | mongoose.Types.ObjectId,
  instanceId: string | mongoose.Types.ObjectId
): Promise<ISessionDocument | null> {
  return this.findOne({
    userId,
    instanceId,
    status: { $in: ['connecting', 'connected'] },
  });
};

// Static method to find inactive sessions (for cleanup)
sessionSchema.statics.findInactiveSessions = async function (
  timeoutMinutes: number
): Promise<ISessionDocument[]> {
  const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
  return this.find({
    status: { $in: ['connecting', 'connected'] },
    lastActivityAt: { $lt: cutoffTime },
  });
};

// Static method to count active sessions for a user
sessionSchema.statics.countActiveSessions = async function (
  userId: string | mongoose.Types.ObjectId
): Promise<number> {
  return this.countDocuments({
    userId,
    status: { $in: ['connecting', 'connected'] },
  });
};

export const Session = mongoose.model<ISessionDocument, ISessionModel>(
  'Session',
  sessionSchema
);

export default Session;
