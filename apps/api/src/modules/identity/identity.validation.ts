import { z } from 'zod';

export const initiateVerificationSchema = z.object({
  provider: z.enum(['mock', 'trulioo', 'onfido']).default('mock'),
  redirectUrl: z.string().url().optional(),
});

export const initiateVerificationWithDocumentSchema = z.object({
  documentType: z.enum(['PASSPORT', 'NATIONAL_ID', 'DRIVING_LICENSE']),
  documentFront: z.string().min(1, 'Front document image is required'),
  documentBack: z.string().optional(),
  selfieImage: z.string().min(1, 'Selfie image is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  provider: z.enum(['mock', 'trulioo', 'onfido']).default('mock'),
});

export const handleVerificationCallbackSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  status: z.enum(['VERIFIED', 'FAILED', 'REVIEW_REQUIRED']),
  metadata: z.record(z.unknown()).optional(),
});

export const getVerificationStatusSchema = z.object({
  userId: z.string().min(1, 'User ID is required').optional(),
});

export const retryVerificationSchema = z.object({
  provider: z.enum(['mock', 'trulioo', 'onfido']).default('mock'),
});

export type InitiateVerificationInput = z.infer<typeof initiateVerificationSchema>;
export type InitiateVerificationWithDocumentInput = z.infer<typeof initiateVerificationWithDocumentSchema>;
export type HandleVerificationCallbackInput = z.infer<typeof handleVerificationCallbackSchema>;
export type GetVerificationStatusInput = z.infer<typeof getVerificationStatusSchema>;
export type RetryVerificationInput = z.infer<typeof retryVerificationSchema>;
