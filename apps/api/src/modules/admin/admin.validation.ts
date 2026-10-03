import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['GUEST', 'HOST', 'SUPPORT', 'ADMIN']),
});

export const updateUserStatusSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  emailVerified: z.boolean().optional(),
  // Add more fields as needed for user management
});

export const propertyModerationSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  action: z.enum(['approve', 'reject', 'hide', 'unhide']),
  reason: z.string().max(500).optional(),
});

export const getAnalyticsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type PropertyModerationInput = z.infer<typeof propertyModerationSchema>;
export type GetAnalyticsInput = z.infer<typeof getAnalyticsSchema>;