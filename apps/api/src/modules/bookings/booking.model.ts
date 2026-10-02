import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  propertyId: mongoose.Types.ObjectId;
  guestId: mongoose.Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: 'PENDING' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUND_PENDING' | 'REFUNDED' | 'FAILED';
  cancellationReason?: string;
  expiresAt?: Date;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
      required: true,
      index: true,
    },
    checkOut: {
      type: Date,
      required: true,
      index: true,
    },
    guests: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUND_PENDING', 'REFUNDED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    cancellationReason: {
      type: String,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    guestDetails: [
      {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for queries
bookingSchema.index({ guestId: 1, createdAt: -1 });
bookingSchema.index({ propertyId: 1, status: 1 });
bookingSchema.index({ status: 1, expiresAt: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });

// Validation: checkOut must be after checkIn
bookingSchema.pre('save', function (next) {
  if (this.checkOut <= this.checkIn) {
    next(new Error('Check-out date must be after check-in date'));
  }
  next();
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
