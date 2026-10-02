import mongoose, { Schema, Document } from 'mongoose';

export interface IRefund extends Document {
  bookingId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  reason: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  razorpayRefundId?: string;
  processedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    razorpayRefundId: {
      type: String,
    },
    processedAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Refund = mongoose.model<IRefund>('Refund', refundSchema);
