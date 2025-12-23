import mongoose, { Document, Schema, Types } from 'mongoose';
import { SubscriptionStatus, SUBSCRIPTION_STATUS, BillingCycle } from '../config/constants';

export interface ISubscriptionMetadata {
  priceId: string;
  productId: string;
  billingCycle: BillingCycle;
}

export interface ISubscription extends Document {
  customerId: Types.ObjectId;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  tier: 'team' | 'enterprise';
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  metadata: ISubscriptionMetadata;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  isActive(): boolean;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ['team', 'enterprise'],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.ACTIVE,
      index: true,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
    },
    metadata: {
      priceId: {
        type: String,
        required: true,
      },
      productId: {
        type: String,
        required: true,
      },
      billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Check if subscription is active
subscriptionSchema.methods.isActive = function (): boolean {
  return (
    this.status === SUBSCRIPTION_STATUS.ACTIVE || this.status === SUBSCRIPTION_STATUS.TRIALING
  );
};

// Indexes
subscriptionSchema.index({ customerId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
