import { z } from 'zod';

export const createPropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'COTTAGE', 'CABIN', 'HOTEL_ROOM', 'OTHER']),
  location: z.object({
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().optional(),
    coordinates: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
  }),
  maxGuests: z.number().int().min(1).max(20),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  pricePerNight: z.number().min(0),
  currency: z.string().default('INR'),
  amenities: z.array(z.string()).default([]),
  images: z
    .array(
      z.object({
        url: z.string().url('Invalid image URL'),
        caption: z.string().optional(),
        order: z.number().int().min(0).default(0),
      })
    )
    .default([]),
  cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']).default('MODERATE'),
});

export const updatePropertySchema = createPropertySchema.partial();

export const publishPropertySchema = z.object({
  published: z.boolean(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
