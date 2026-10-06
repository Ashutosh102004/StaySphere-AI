import { Payment, IPayment } from './payment.model';
import { Booking } from '../bookings/booking.model';
import { config } from '@/config/env';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import type { Orders } from 'razorpay/dist/types/orders';
import { WebhookEventInput } from './payment.validation';

interface PaymentAuthorizedPayload {
  id: string;
  order_id: string;
  status: string;
}

interface PaymentFailedPayload {
  order_id: string;
  error_description: string;
}

interface RefundCreatedPayload {
  payment_id: string;
  status: string;
}

export class PaymentService {
  private razorpayInstance: Razorpay | null = null;

  constructor() {
    // Initialize Razorpay if credentials are provided
    if (config.razorpay.keyId && config.razorpay.keySecret) {
      this.razorpayInstance = new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
      });
    }
  }

  async createOrder(bookingId: string, amount: number, currency: string = 'INR'): Promise<IPayment> {
    if (!this.razorpayInstance) {
      throw new Error('Razorpay is not configured');
    }

    // Verify booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId,
        guestId: booking.guestId.toString(),
        propertyId: booking.propertyId.toString(),
      },
    };

    let razorpayOrder: Orders.RazorpayOrder;
    try {
      razorpayOrder = await this.razorpayInstance.orders.create(orderOptions);
    } catch (error: unknown) {
      throw new Error(
        `Failed to create Razorpay order: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Save payment record
    const payment = await Payment.create({
      bookingId: new mongoose.Types.ObjectId(bookingId),
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency,
      status: 'PENDING',
      metadata: {
        orderCreatedAt: new Date(razorpayOrder.created_at * 1000),
      },
    });

    return payment;
  }

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<IPayment> {
    // Verify Razorpay signature
    const isSignatureValid = this.verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isSignatureValid) {
      throw new Error('Invalid payment signature');
    }

    // Find payment record
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    // Update payment record
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'COMPLETED';
    await payment.save();

    return payment;
  }

  async handlePaymentFailure(
    razorpayOrderId: string,
    failureReason: string
  ): Promise<IPayment> {
    const payment = await Payment.findOne({ razorpayOrderId });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    payment.status = 'FAILED';
    payment.failureReason = failureReason;
    await payment.save();

    return payment;
  }

  async handleWebhookEvent(event: WebhookEventInput): Promise<IPayment | null> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(event)) {
      throw new Error('Invalid webhook signature');
    }

    switch (event.event) {
      case 'payment.authorized':
        return await this.handlePaymentAuthorized(
          event.payload.payment as PaymentAuthorizedPayload
        );
      case 'payment.failed':
        return await this.handlePaymentFailed(event.payload.payment as PaymentFailedPayload);
      case 'refund.created':
        return await this.handleRefundCreated(event.payload.refund as RefundCreatedPayload);
      default:
        return null;
    }
  }

  private async handlePaymentAuthorized(paymentPayload: PaymentAuthorizedPayload): Promise<IPayment> {
    const { id: paymentId, order_id: orderId, status } = paymentPayload;

    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    payment.razorpayPaymentId = paymentId;
    payment.status = status === 'captured' ? 'COMPLETED' : 'PROCESSING';
    await payment.save();

    return payment;
  }

  private async handlePaymentFailed(paymentPayload: PaymentFailedPayload): Promise<IPayment> {
    const { order_id: orderId, error_description } = paymentPayload;

    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    payment.status = 'FAILED';
    payment.failureReason = error_description;
    await payment.save();

    return payment;
  }

  private async handleRefundCreated(refundPayload: RefundCreatedPayload): Promise<IPayment> {
    const { payment_id: paymentId, status } = refundPayload;

    const payment = await Payment.findOne({ razorpayPaymentId: paymentId });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    payment.status = status === 'processed' ? 'REFUNDED' : 'REFUND_PENDING';
    await payment.save();

    return payment;
  }

  private verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    const message = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(message)
      .digest('hex');

    return expectedSignature === signature;
  }

  private verifyWebhookSignature(event: WebhookEventInput): boolean {
    const webhookSignature = event.headers?.['x-razorpay-signature'];
    if (!webhookSignature) {
      return false;
    }

    const payload = JSON.stringify(event.body);
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(payload)
      .digest('hex');

    return expectedSignature === webhookSignature;
  }

  async getPaymentById(paymentId: string): Promise<IPayment | null> {
    return Payment.findById(paymentId)
      .populate('bookingId', 'checkIn checkOut totalPrice guestId')
      .exec();
  }

  async getPaymentByBookingId(bookingId: string): Promise<IPayment | null> {
    return Payment.findOne({
      bookingId: new mongoose.Types.ObjectId(bookingId),
    })
      .populate('bookingId', 'checkIn checkOut totalPrice')
      .exec();
  }

  async refundPayment(paymentId: string): Promise<IPayment> {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new Error('Only completed payments can be refunded');
    }

    if (!payment.razorpayPaymentId) {
      throw new Error('No Razorpay payment ID found for refund');
    }

    if (!this.razorpayInstance) {
      throw new Error('Razorpay is not configured');
    }

    try {
      const refund = await this.razorpayInstance.payments.refund(
        payment.razorpayPaymentId,
        {
          amount: Math.round(payment.amount * 100), // In paise
        }
      );

      payment.status = 'REFUND_PENDING';
      payment.metadata = {
        ...payment.metadata,
        refundId: refund.id,
        refundCreatedAt: new Date(),
      };
      await payment.save();

      return payment;
    } catch (error: unknown) {
      throw new Error(
        `Failed to initiate refund: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getPaymentStatus(orderId: string): Promise<IPayment | null> {
    return Payment.findOne({ razorpayOrderId: orderId });
  }

  async listPaymentsByStatus(status: string, limit: number = 50): Promise<IPayment[]> {
    return Payment.find({ status })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('bookingId', 'checkIn checkOut totalPrice')
      .exec();
  }

  async getPaymentStats(): Promise<{ _id: IPayment['status']; count: number; totalAmount: number }[]> {
    const stats = await Payment.aggregate<{ _id: IPayment['status']; count: number; totalAmount: number }>([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    return stats;
  }
}
