import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  currency: z.string().default('INR').optional(),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
  razorpaySignature: z.string().min(1, 'Signature is required'),
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  reason: z.string().max(500).optional(),
});

export const webhookEventSchema = z.object({
  event: z.string(),
  entity: z.object({}).passthrough(),
  payload: z.object({}).passthrough(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type WebhookEventInput = z.infer<typeof webhookEventSchema>;
