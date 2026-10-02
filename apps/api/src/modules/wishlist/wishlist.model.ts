import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index to prevent duplicates
wishlistSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);
