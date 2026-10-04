import { Payment, IPayment } from './payment.model';
import { Booking } from '../bookings/booking.model';
import { config } from '@/config/env';
import mongoose from 'mongoose';
import crypto from 'crypto';

interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id?: string;
  status: string;
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

export class PaymentService {
  private razorpayInstance: any;

  constructor() {
    // Initialize Razorpay if credentials are provided
    if (config.razorpay.keyId && config.razorpay.keySecret) {
      const Razorpay = require('razorpay');
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

    let razorpayOrder: RazorpayOrder;
    try {
      razorpayOrder = await this.razorpayInstance.orders.create(orderOptions);
    } catch (error: any) {
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
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

  async handleWebhookEvent(event: any): Promise<IPayment | null> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(event)) {
      throw new Error('Invalid webhook signature');
    }

    switch (event.event) {
      case 'payment.authorized':
        return await this.handlePaymentAuthorized(event.payload.payment);
      case 'payment.failed':
        return await this.handlePaymentFailed(event.payload.payment);
      case 'refund.created':
        return await this.handleRefundCreated(event.payload.refund);
      default:
        return null;
    }
  }

  private async handlePaymentAuthorized(paymentPayload: any): Promise<IPayment> {
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

  private async handlePaymentFailed(paymentPayload: any): Promise<IPayment> {
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

  private async handleRefundCreated(refundPayload: any): Promise<IPayment> {
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

  private verifyWebhookSignature(event: any): boolean {
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
    } catch (error: any) {
      throw new Error(`Failed to initiate refund: ${error.message}`);
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

  async getPaymentStats(): Promise<any> {
    const stats = await Payment.aggregate([
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
