import mongoose, { Document, Schema, Model } from 'mongoose';
import {
  CLOUD_PROVIDERS,
  AUTH_TYPES,
  DESKTOP_ENVIRONMENTS,
  INSTANCE_STATUSES,
  CloudProvider,
  AuthType,
  DesktopEnvironment,
  InstanceStatus,
} from '../config/constants';
import { encryptionService } from '../services/encryptionService';

export interface IInstance {
  userId: mongoose.Types.ObjectId;
  name: string;
  provider: CloudProvider;
  host: string;
  port: number;
  username: string;
  authType: AuthType;
  encryptedCredential: string;
  tags: string[];
  vncDisplayNumber?: number;
  vncPort?: number;
  desktopEnvironment?: DesktopEnvironment;
  isVncInstalled: boolean;
  status: InstanceStatus;
  lastConnectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInstanceDocument extends IInstance, Document {
  _id: mongoose.Types.ObjectId;
  getDecryptedCredential(): string;
  setCredential(credential: string): void;
  markConnected(): Promise<void>;
}

export interface IInstanceModel extends Model<IInstanceDocument> {
  findByUserId(userId: string | mongoose.Types.ObjectId): Promise<IInstanceDocument[]>;
  findByUserIdAndId(
    userId: string | mongoose.Types.ObjectId,
    instanceId: string | mongoose.Types.ObjectId
  ): Promise<IInstanceDocument | null>;
}

const instanceSchema = new Schema<IInstanceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Instance name is required'],
      trim: true,
      minlength: [3, 'Instance name must be at least 3 characters'],
      maxlength: [50, 'Instance name must be at most 50 characters'],
    },
    provider: {
      type: String,
      enum: CLOUD_PROVIDERS,
      required: [true, 'Provider is required'],
    },
    host: {
      type: String,
      required: [true, 'Host is required'],
      trim: true,
    },
    port: {
      type: Number,
      default: 22,
      min: [1, 'Port must be at least 1'],
      max: [65535, 'Port must be at most 65535'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
    },
    authType: {
      type: String,
      enum: AUTH_TYPES,
      required: [true, 'Auth type is required'],
    },
    encryptedCredential: {
      type: String,
      required: [true, 'Credential is required'],
      select: false, // Don't include by default in queries
    },
    tags: [{
      type: String,
      trim: true,
    }],
    vncDisplayNumber: {
      type: Number,
      min: [1, 'VNC display number must be at least 1'],
      max: [99, 'VNC display number must be at most 99'],
    },
    vncPort: {
      type: Number,
      min: [5901, 'VNC port must be at least 5901'],
      max: [5999, 'VNC port must be at most 5999'],
    },
    desktopEnvironment: {
      type: String,
      enum: DESKTOP_ENVIRONMENTS,
    },
    isVncInstalled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: INSTANCE_STATUSES,
      default: 'active',
    },
    lastConnectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.encryptedCredential;
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
instanceSchema.index({ userId: 1, name: 1 });
instanceSchema.index({ userId: 1, status: 1 });
instanceSchema.index({ tags: 1 });
instanceSchema.index({ status: 1 });
instanceSchema.index({ createdAt: -1 });

// Instance method to decrypt credential
instanceSchema.methods.getDecryptedCredential = function (): string {
  const instance = this as IInstanceDocument;
  return encryptionService.decrypt(instance.encryptedCredential);
};

// Instance method to set encrypted credential
instanceSchema.methods.setCredential = function (credential: string): void {
  const instance = this as IInstanceDocument;
  instance.encryptedCredential = encryptionService.encrypt(credential);
};

// Instance method to mark as connected
instanceSchema.methods.markConnected = async function (): Promise<void> {
  const instance = this as IInstanceDocument;
  instance.lastConnectedAt = new Date();
  await instance.save();
};

// Static method to find instances by user ID
instanceSchema.statics.findByUserId = async function (
  userId: string | mongoose.Types.ObjectId
): Promise<IInstanceDocument[]> {
  return this.find({ userId, status: 'active' }).sort({ createdAt: -1 });
};

// Static method to find instance by user ID and instance ID
instanceSchema.statics.findByUserIdAndId = async function (
  userId: string | mongoose.Types.ObjectId,
  instanceId: string | mongoose.Types.ObjectId
): Promise<IInstanceDocument | null> {
  return this.findOne({ _id: instanceId, userId }).select('+encryptedCredential');
};

export const Instance = mongoose.model<IInstanceDocument, IInstanceModel>(
  'Instance',
  instanceSchema
);

export default Instance;
