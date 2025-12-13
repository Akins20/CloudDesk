import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { AUTH_CONSTANTS, USER_ROLES, UserRole } from '../config/constants';

export interface IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: UserRole;
  lastLoginAt?: Date;
  refreshTokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementRefreshTokenVersion(): Promise<void>;
  fullName: string;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't include password by default in queries
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name must be at most 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name must be at most 50 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'user',
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
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
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

// Indexes
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function (this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook to hash password
userSchema.pre('save', async function () {
  const user = this as IUserDocument;

  // Only hash password if it's modified (or new)
  if (!user.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);
  user.password = await bcrypt.hash(user.password, salt);
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const user = this as IUserDocument;
  return bcrypt.compare(candidatePassword, user.password);
};

// Instance method to increment refresh token version (for logout/token invalidation)
userSchema.methods.incrementRefreshTokenVersion = async function (): Promise<void> {
  const user = this as IUserDocument;
  user.refreshTokenVersion += 1;
  await user.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = async function (
  email: string
): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
