import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  preferredLanguage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    preferredLanguage: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

export const Profile = mongoose.model<IProfile>('Profile', profileSchema);
