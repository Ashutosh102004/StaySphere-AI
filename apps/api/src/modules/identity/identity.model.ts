import mongoose, { Schema, Document } from 'mongoose';

export interface IIdentityVerification extends Document {
  userId: mongoose.Types.ObjectId;
  provider: string;
  providerSessionId?: string;
  status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'REVIEW_REQUIRED' | 'EXPIRED';
  metadata?: Record<string, unknown>;
  events: {
    status: string;
    timestamp: Date;
    details?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const identityVerificationSchema = new Schema<IIdentityVerification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      default: 'mock',
    },
    providerSessionId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'VERIFIED', 'FAILED', 'REVIEW_REQUIRED', 'EXPIRED'],
      default: 'NOT_STARTED',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    events: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const IdentityVerification = mongoose.model<IIdentityVerification>(
  'IdentityVerification',
  identityVerificationSchema
);
