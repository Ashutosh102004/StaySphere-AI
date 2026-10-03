import { z } from 'zod';

export const chatMessageSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, 'Message is required').max(4000, 'Message too long'),
  context: z
    .object({
      propertyId: z.string().optional(),
      bookingId: z.string().optional(),
    })
    .optional(),
});

export const generateDescriptionSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  style: z.enum(['professional', 'friendly', 'luxury', 'budget']).default('professional'),
});

export const searchPropertiesSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500),
  location: z.string().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  guests: z.number().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).default(20),
});

export const getRecommendationsSchema = z.object({
  userId: z.string().optional(),
  propertyId: z.string().optional(),
  limit: z.number().min(1).max(20).default(10),
  priceRange: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .optional(),
});

export const optimizePriceSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  checkIn: z.string().min(1, 'Check-in date is required'),
  checkOut: z.string().min(1, 'Check-out date is required'),
  competitors: z
    .array(
      z.object({
        price: z.number(),
        rating: z.number(),
      })
    )
    .optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type GenerateDescriptionInput = z.infer<typeof generateDescriptionSchema>;
export type SearchPropertiesInput = z.infer<typeof searchPropertiesSchema>;
export type GetRecommendationsInput = z.infer<typeof getRecommendationsSchema>;
export type OptimizePriceInput = z.infer<typeof optimizePriceSchema>;