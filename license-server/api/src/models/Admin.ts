import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type AdminRole = 'admin' | 'super_admin';

export interface IAdmin extends Document {
  email: string;
  password: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: Date;
  refreshTokenVersion: number;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementRefreshTokenVersion(): Promise<void>;
}

const adminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'super_admin'],
      default: 'admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
    refreshTokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Increment refresh token version
adminSchema.methods.incrementRefreshTokenVersion = async function (): Promise<void> {
  this.refreshTokenVersion += 1;
  await this.save();
};

// Remove password from JSON output
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);
