import { z } from 'zod';

export const addToWishlistSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
});

export const removeFromWishlistSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
});

export const getWishlistSchema = z.object({
  limit: z.number().default(20).optional(),
  offset: z.number().default(0).optional(),
  sort: z.enum(['newest', 'oldest']).default('newest').optional(),
});

export const checkWishlistSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
});

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;
export type RemoveFromWishlistInput = z.infer<typeof removeFromWishlistSchema>;
export type GetWishlistInput = z.infer<typeof getWishlistSchema>;
export type CheckWishlistInput = z.infer<typeof checkWishlistSchema>;
