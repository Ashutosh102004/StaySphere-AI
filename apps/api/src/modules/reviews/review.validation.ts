import { z } from 'zod';

export const createReviewSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(2000, 'Comment must be at most 2000 characters')
    .optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
  comment: z
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(2000, 'Comment must be at most 2000 characters')
    .optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
