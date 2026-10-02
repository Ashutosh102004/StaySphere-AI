import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  hostId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  propertyType: string;
  location: {
    address: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
  currency: string;
  amenities: string[];
  images: {
    url: string;
    caption?: string;
    order: number;
  }[];
  cancellationPolicy: string;
  published: boolean;
  rating?: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const propertySchema = new Schema<IProperty>(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    propertyType: {
      type: String,
      required: true,
      enum: ['APARTMENT', 'HOUSE', 'VILLA', 'COTTAGE', 'CABIN', 'HOTEL_ROOM', 'OTHER'],
      index: true,
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true, index: true },
      state: String,
      country: { type: String, required: true, index: true },
      postalCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    maxGuests: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
      index: true,
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    amenities: [
      {
        type: String,
      },
    ],
    images: [
      {
        url: { type: String, required: true },
        caption: String,
        order: { type: Number, default: 0 },
      },
    ],
    cancellationPolicy: {
      type: String,
      enum: ['FLEXIBLE', 'MODERATE', 'STRICT'],
      default: 'MODERATE',
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtering
propertySchema.index({ published: 1, pricePerNight: 1 });
propertySchema.index({ published: 1, maxGuests: 1, pricePerNight: 1 });
propertySchema.index({ 'location.city': 1, published: 1 });
propertySchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial index

export const Property = mongoose.model<IProperty>('Property', propertySchema);
