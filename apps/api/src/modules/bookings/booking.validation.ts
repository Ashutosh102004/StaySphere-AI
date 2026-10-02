import { z } from 'zod';

const guestDetailSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(20),
});

export const createBookingSchema = z
  .object({
    propertyId: z.string().min(1, 'Property ID is required'),
    checkIn: z.string().datetime('Invalid check-in date'),
    checkOut: z.string().datetime('Invalid check-out date'),
    guests: z.number().int().min(1, 'At least 1 guest is required'),
    guestDetails: z.array(guestDetailSchema).min(1, 'At least one guest detail is required'),
  })
  .refine(
    (data) => {
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      return checkOut > checkIn;
    },
    {
      message: 'Check-out date must be after check-in date',
      path: ['checkOut'],
    }
  )
  .refine(
    (data) => {
      const checkIn = new Date(data.checkIn);
      const now = new Date();
      return checkIn >= now;
    },
    {
      message: 'Check-in date must be in the future',
      path: ['checkIn'],
    }
  );

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']),
});

export const cancelBookingSchema = z.object({
  cancellationReason: z.string().min(10, 'Cancellation reason must be at least 10 characters').max(500).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
