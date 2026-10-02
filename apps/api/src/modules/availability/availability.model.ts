import mongoose, { Schema, Document } from 'mongoose';

export interface IAvailability extends Document {
  propertyId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  available: boolean;
  customPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySchema = new Schema<IAvailability>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    available: {
      type: Boolean,
      default: true,
      index: true,
    },
    customPrice: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient date range queries
availabilitySchema.index({ propertyId: 1, startDate: 1, endDate: 1 });
availabilitySchema.index({ propertyId: 1, available: 1 });

// Validation: endDate must be after startDate
availabilitySchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

export const Availability = mongoose.model<IAvailability>('Availability', availabilitySchema);
