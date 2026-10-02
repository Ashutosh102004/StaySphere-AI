import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  propertyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // One review per booking
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index
reviewSchema.index({ propertyId: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
