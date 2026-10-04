import { Router } from 'express';
import * as paymentController from './payment.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/rbac.middleware';

const router = Router();

// Public webhook endpoint (no auth required)
router.post('/webhook', paymentController.handlePaymentCallback);

// Protected routes (auth required)
router.post(
  '/orders',
  authenticate,
  paymentController.createPaymentOrder
);

router.post(
  '/verify',
  authenticate,
  paymentController.verifyPayment
);

router.get(
  '/:paymentId',
  authenticate,
  paymentController.getPaymentStatus
);

router.get(
  '/booking/:bookingId',
  authenticate,
  paymentController.getPaymentByBooking
);

router.post(
  '/:paymentId/refund',
  authenticate,
  authorize('HOST', 'ADMIN'),
  paymentController.refundPayment
);

// Admin routes
router.get(
  '/admin/stats',
  authenticate,
  authorize('ADMIN'),
  paymentController.getPaymentStats
);

export default router;
