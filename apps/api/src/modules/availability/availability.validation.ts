import { z } from 'zod';

export const createAvailabilitySchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  available: z.boolean().default(true),
  customPrice: z.number().min(0, 'Custom price must be non-negative').optional(),
});

export const updateAvailabilitySchema = z.object({
  available: z.boolean().optional(),
  customPrice: z.number().min(0, 'Custom price must be non-negative').optional(),
});

export const bulkCreateAvailabilitySchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  available: z.boolean().default(true),
  customPrice: z.number().min(0, 'Custom price must be non-negative').optional(),
});

export const blockDatesSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
});

export const unblockDatesSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
});

export const setPricingSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  customPrice: z.number().min(0, 'Custom price must be non-negative'),
});

export const queryAvailabilitySchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
});

export const setStayRequirementsSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  minStay: z.number().int().min(1, 'Minimum stay must be at least 1 day').optional(),
  maxStay: z.number().int().min(1, 'Maximum stay must be at least 1 day').optional(),
});

export const setLeadTimeSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  leadDays: z.number().int().min(0, 'Lead days must be non-negative'),
});

export const setAdvanceNoticeSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  advanceNoticeDays: z.number().int().min(0, 'Advance notice must be non-negative'),
});

export const createSeasonSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  seasonName: z.string().min(1, 'Season name is required').max(50),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  customPrice: z.number().min(0, 'Price must be non-negative'),
  minStay: z.number().int().min(1).optional(),
  maxStay: z.number().int().min(1).optional(),
  leadDays: z.number().int().min(0).optional(),
  advanceNoticeDays: z.number().int().min(0).optional(),
});

export const bulkSetPricingSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  dates: z.array(
    z.object({
      date: z.string().datetime('Invalid date format'),
      price: z.number().min(0, 'Price must be non-negative'),
    })
  ).min(1, 'At least one date is required'),
});

export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type BulkCreateAvailabilityInput = z.infer<typeof bulkCreateAvailabilitySchema>;
export type BlockDatesInput = z.infer<typeof blockDatesSchema>;
export type UnblockDatesInput = z.infer<typeof unblockDatesSchema>;
export type SetPricingInput = z.infer<typeof setPricingSchema>;
export type QueryAvailabilityInput = z.infer<typeof queryAvailabilitySchema>;
export type SetStayRequirementsInput = z.infer<typeof setStayRequirementsSchema>;
export type SetLeadTimeInput = z.infer<typeof setLeadTimeSchema>;
export type SetAdvanceNoticeInput = z.infer<typeof setAdvanceNoticeSchema>;
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type BulkSetPricingInput = z.infer<typeof bulkSetPricingSchema>;
