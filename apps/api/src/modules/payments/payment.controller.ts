import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { BookingService } from '../bookings/booking.service';
import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
  refundPaymentSchema,
  webhookEventSchema,
} from './payment.validation';
import { asyncHandler } from '@/utils/async-handler';
import { ApiResponse } from '@/utils/response';

const paymentService = new PaymentService();
const bookingService = new BookingService();

export const createPaymentOrder = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createPaymentOrderSchema.parse(req.body);

  const canAccess = await bookingService.canUserAccessBooking(
    validatedData.bookingId,
    req.user!.id,
    req.user!.role
  );

  if (!canAccess) {
    return ApiResponse.error(
      res,
      'You do not have permission to pay for this booking',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const payment = await paymentService.createOrder(
    validatedData.bookingId,
    validatedData.amount,
    validatedData.currency
  );

  return ApiResponse.success(
    res,
    {
      payment: {
        id: payment._id,
        bookingId: payment.bookingId.toString(),
        razorpayOrderId: payment.razorpayOrderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
    },
    'Payment order created successfully',
    201
  );
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = verifyPaymentSchema.parse(req.body);

  const payment = await paymentService.verifyPayment(
    validatedData.razorpayOrderId,
    validatedData.razorpayPaymentId,
    validatedData.razorpaySignature
  );

  if (!payment) {
    return ApiResponse.error(res, 'Payment verification failed', 'PAYMENT_ERROR', 400);
  }

  // Confirm booking after successful payment
  try {
    await bookingService.confirmBooking(payment.bookingId.toString(), req.user!.id, {
      paymentId: validatedData.razorpayPaymentId,
    });
  } catch (error: unknown) {
    return ApiResponse.error(
      res,
      error instanceof Error ? error.message : 'Failed to confirm booking',
      'BOOKING_ERROR',
      400
    );
  }

  return ApiResponse.success(
    res,
    {
      payment: {
        id: payment._id,
        status: payment.status,
        razorpayPaymentId: payment.razorpayPaymentId,
      },
    },
    'Payment verified and booking confirmed successfully'
  );
});

export const handlePaymentCallback = asyncHandler(async (req: Request, res: Response) => {
  const webhookEvent = webhookEventSchema.parse(req.body);

  try {
    await paymentService.handleWebhookEvent(webhookEvent);
    return ApiResponse.success(res, {}, 'Webhook processed successfully', 200);
  } catch (error: unknown) {
    return ApiResponse.error(
      res,
      error instanceof Error ? error.message : 'Failed to process webhook',
      'WEBHOOK_ERROR',
      400
    );
  }
});

export const refundPayment = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = refundPaymentSchema.parse(req.body);

  const payment = await paymentService.getPaymentById(validatedData.paymentId);

  if (!payment) {
    return ApiResponse.error(res, 'Payment not found', 'NOT_FOUND', 404);
  }

  // Authorization: only host/admin can refund
  const booking = await bookingService.getBookingById(payment.bookingId.toString(), req.user!.id);
  if (!booking) {
    return ApiResponse.error(
      res,
      'You do not have permission to refund this payment',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const refundedPayment = await paymentService.refundPayment(validatedData.paymentId);

  return ApiResponse.success(
    res,
    {
      payment: {
        id: refundedPayment._id,
        status: refundedPayment.status,
        amount: refundedPayment.amount,
      },
    },
    'Refund initiated successfully'
  );
});

export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { paymentId } = req.params;

  const payment = await paymentService.getPaymentById(paymentId);

  if (!payment) {
    return ApiResponse.error(res, 'Payment not found', 'NOT_FOUND', 404);
  }

  // Authorization check
  const canAccess = await bookingService.canUserAccessBooking(
    payment.bookingId.toString(),
    req.user!.id,
    req.user!.role
  );

  if (!canAccess) {
    return ApiResponse.error(
      res,
      'You do not have permission to view this payment',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  return ApiResponse.success(res, {
    payment: {
      id: payment._id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      razorpayOrderId: payment.razorpayOrderId,
      createdAt: payment.createdAt,
    },
  });
});

export const getPaymentByBooking = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  const canAccess = await bookingService.canUserAccessBooking(
    bookingId,
    req.user!.id,
    req.user!.role
  );

  if (!canAccess) {
    return ApiResponse.error(
      res,
      'You do not have permission to view this booking',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const payment = await paymentService.getPaymentByBookingId(bookingId);

  if (!payment) {
    return ApiResponse.error(res, 'Payment not found for this booking', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, {
    payment: {
      id: payment._id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      razorpayOrderId: payment.razorpayOrderId,
      createdAt: payment.createdAt,
    },
  });
});

export const getPaymentStats = asyncHandler(async (req: Request, res: Response) => {
  // Admin only
  if (req.user!.role !== 'ADMIN') {
    return ApiResponse.error(
      res,
      'Only admins can view payment statistics',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const stats = await paymentService.getPaymentStats();

  return ApiResponse.success(res, {
    stats,
  });
});
