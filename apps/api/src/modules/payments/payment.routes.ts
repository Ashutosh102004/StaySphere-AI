import { Router, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import rateLimit from 'express-rate-limit';
import * as paymentController from './payment.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/rbac.middleware';
import { ApiResponse } from '@/utils/response';

const router = Router();

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 5000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: ExpressRequest): string => {
    const userId = req.user?.id;
    return typeof userId === 'string' ? userId : (req.ip ?? 'unknown');
  },
  handler: (_req: ExpressRequest, res: ExpressResponse) => {
    ApiResponse.error(res, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429);
  },
});

// Public webhook endpoint (no auth required, no rate limit)
router.post('/webhook', paymentController.handlePaymentCallback);

// Protected routes (auth required)
router.post(
  '/orders',
  authenticate,
  paymentLimiter,
  paymentController.createPaymentOrder
);

router.post(
  '/verify',
  authenticate,
  paymentLimiter,
  paymentController.verifyPayment
);

router.get(
  '/:paymentId',
  authenticate,
  paymentLimiter,
  paymentController.getPaymentStatus
);

router.get(
  '/booking/:bookingId',
  authenticate,
  paymentLimiter,
  paymentController.getPaymentByBooking
);

router.post(
  '/:paymentId/refund',
  authenticate,
  authorize('HOST', 'ADMIN'),
  paymentLimiter,
  paymentController.refundPayment
);

// Admin routes
router.get(
  '/admin/stats',
  authenticate,
  authorize('ADMIN'),
  paymentLimiter,
  paymentController.getPaymentStats
);

export default router;
