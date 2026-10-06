// Payment API Integration Tests
// Tests the Payment controller/routes against a real Express app
// backed by an in-memory MongoDB instance.
// PaymentService is mocked to avoid external Razorpay dependencies.

import request from 'supertest';
import mongoose from 'mongoose';

jest.mock('@/modules/payments/payment.service', () => {
  const mockPaymentService = {
    createOrder: jest.fn(),
    verifyPayment: jest.fn(),
    handlePaymentFailure: jest.fn(),
    handleWebhookEvent: jest.fn(),
    getPaymentById: jest.fn(),
    getPaymentByBookingId: jest.fn(),
    refundPayment: jest.fn(),
    getPaymentStats: jest.fn(),
  };
  return {
    PaymentService: jest.fn().mockImplementation(() => mockPaymentService),
  };
});

import app from '@/app';
import { connectMongo, clearDatabase, disconnectMongo } from '@/__tests__/mongo';
import type { WebhookEventInput } from '@/modules/payments/payment.validation';

interface MockedPaymentService {
  createOrder: jest.Mock;
  verifyPayment: jest.Mock;
  handlePaymentFailure: jest.Mock;
  handleWebhookEvent: jest.Mock;
  getPaymentById: jest.Mock;
  getPaymentByBookingId: jest.Mock;
  refundPayment: jest.Mock;
  getPaymentStats: jest.Mock;
}

let hostToken: string;
let guestToken: string;
let PROPERTY_ID: string;
let BOOKING_ID: string;
let ORDER_ID: string;
let PAYMENT_ID: string;

const validPropertyData = {
  title: 'Test Property',
  description: 'A nice place to stay with enough length for validation',
  propertyType: 'APARTMENT',
  location: {
    address: '123 Test Street',
    city: 'Test City',
    country: 'Test Country',
  },
  maxGuests: 4,
  bedrooms: 2,
  bathrooms: 1,
  pricePerNight: 100,
  currency: 'USD',
  amenities: ['WiFi', 'Kitchen'],
  images: [{ url: 'http://example.com/image.jpg' }],
  cancellationPolicy: 'MODERATE',
};

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-jest-tests-only-999';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-jest-tests-only-888';
  process.env.JWT_ACCESS_EXPIRATION = '15m';
  process.env.JWT_REFRESH_EXPIRATION = '7d';
  process.env.NODE_ENV = 'test';

  await connectMongo();
});

afterAll(async () => {
  await disconnectMongo();
});

beforeEach(async () => {
  await clearDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

async function registerHostAndGetToken() {
  const { User } = await import('@/modules/users/user.model');

  await request(app).post('/api/v1/auth/register').send({
    email: 'host@test.com',
    password: 'Password123!',
    firstName: 'Host',
    lastName: 'User',
  });

  const hostUser = await User.findOne({ email: 'host@test.com' });
  const hostUserId = hostUser!._id.toString();
  await User.findByIdAndUpdate(hostUserId, { role: 'HOST' });

  const hostLogin = await request(app).post('/api/v1/auth/login').send({
    email: 'host@test.com',
    password: 'Password123!',
  });
  hostToken = hostLogin.body.data.accessToken;
}

async function registerGuestAndGetToken(email = 'guest@test.com') {
  await request(app).post('/api/v1/auth/register').send({
    email,
    password: 'Password123!',
    firstName: 'Guest',
    lastName: 'User',
  });

  const guestLogin = await request(app).post('/api/v1/auth/login').send({
    email,
    password: 'Password123!',
  });
  return guestLogin.body.data.accessToken as string;
}

async function createBooking(propertyId: string, token: string, checkInOffsetDays = 1) {
  const response = await request(app)
    .post('/api/v1/bookings/')
    .set('Authorization', `Bearer ${token}`)
    .send({
      propertyId,
      checkIn: new Date(Date.now() + checkInOffsetDays * 86400000).toISOString(),
      checkOut: new Date(Date.now() + (checkInOffsetDays + 1) * 86400000).toISOString(),
      guests: 2,
      guestDetails: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '1234567890' }],
    })
    .expect(201);

  return response.body.data.booking.id;
}

async function confirmBooking(bookingId: string) {
  await request(app)
    .patch(`/api/v1/bookings/${bookingId}/confirm`)
    .set('Authorization', `Bearer ${guestToken}`)
    .send({ paymentId: 'test_payment_id' })
    .expect(200);
}

async function completeBooking(bookingId: string) {
  await request(app)
    .patch(`/api/v1/bookings/${bookingId}/complete`)
    .set('Authorization', `Bearer ${hostToken}`)
    .send({ notes: 'Great stay' })
    .expect(200);
}

describe('Payment API Integration', () => {
  beforeEach(async () => {
    await registerHostAndGetToken();
    guestToken = await registerGuestAndGetToken();

    // Create published property
    const propResponse = await request(app)
      .post('/api/v1/properties/')
      .set('Authorization', `Bearer ${hostToken}`)
      .send(validPropertyData)
      .expect(201);

    PROPERTY_ID = propResponse.body.data.property.id;

    await request(app)
      .patch(`/api/v1/properties/${PROPERTY_ID}/publish`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ published: true })
      .expect(200);

    // Create and complete booking
    const bookingId = await createBooking(PROPERTY_ID, guestToken);
    await confirmBooking(bookingId);
    await completeBooking(bookingId);
    BOOKING_ID = bookingId;

    const { PaymentService } = await import('@/modules/payments/payment.service');
    const mockService = new PaymentService() as unknown as MockedPaymentService;
    mockService.createOrder.mockReset();
    mockService.verifyPayment.mockReset();
    mockService.handlePaymentFailure.mockReset();
    mockService.handleWebhookEvent.mockReset();
    mockService.getPaymentById.mockReset();
    mockService.getPaymentByBookingId.mockReset();
    mockService.refundPayment.mockReset();
    mockService.getPaymentStats.mockReset();
    mockService.createOrder.mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      bookingId: BOOKING_ID,
      razorpayOrderId: `order_${new mongoose.Types.ObjectId().toString()}`,
      amount: 100,
      currency: 'USD',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('POST /api/v1/payments/orders', () => {
    it('should create a payment order for a guest on their own booking', async () => {
      const { PaymentService } = await import('@/modules/payments/payment.service');
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        bookingId: BOOKING_ID,
        razorpayOrderId: 'order_' + Date.now(),
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockService = new PaymentService() as unknown as MockedPaymentService;
      mockService.createOrder.mockResolvedValueOnce(mockPayment);

      const response = await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: BOOKING_ID,
          amount: 100,
          currency: 'USD',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.payment).toMatchObject({
        bookingId: BOOKING_ID,
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
      });
      expect(response.body.data.payment).toHaveProperty('razorpayOrderId');
      ORDER_ID = response.body.data.payment.razorpayOrderId;
      PAYMENT_ID = response.body.data.payment.id;
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .post('/api/v1/payments/orders')
        .send({
          bookingId: BOOKING_ID,
          amount: 100,
          currency: 'USD',
        })
        .expect(401);
    });

    it("should return 403 when a guest tries to pay for another guest's booking", async () => {
      await request(app)
        .post('/api/v1/bookings/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          propertyId: PROPERTY_ID,
          checkIn: new Date(Date.now() + 86400000).toISOString(),
          checkOut: new Date(Date.now() + 2 * 86400000).toISOString(),
          guests: 2,
          guestDetails: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '1234567890' }],
        })
        .expect(201);

      const otherGuestToken = await registerGuestAndGetToken('other-guest@test.com');
      const otherGuestBookingId = await createBooking(PROPERTY_ID, otherGuestToken, 3);

      const response = await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: otherGuestBookingId,
          amount: 100,
          currency: 'USD',
        })
        .expect(403);

      expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should return 400 for missing bookingId', async () => {
      await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          amount: 100,
          currency: 'USD',
        })
        .expect(400);
    });

    it('should return 400 for amount below 1', async () => {
      await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: BOOKING_ID,
          amount: 0,
          currency: 'USD',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/payments/verify', () => {
    beforeEach(async () => {
      const { PaymentService } = await import('@/modules/payments/payment.service');
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        bookingId: BOOKING_ID,
        razorpayOrderId: 'order_' + Date.now(),
        razorpayPaymentId: 'pay_test_123',
        razorpaySignature: 'sig_test_123',
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      ORDER_ID = mockPayment.razorpayOrderId;
      PAYMENT_ID = mockPayment._id.toString();

      const mockService = new PaymentService() as unknown as MockedPaymentService;
      mockService.verifyPayment.mockResolvedValue(null);

      await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: BOOKING_ID,
          amount: 100,
          currency: 'USD',
        })
        .expect(201);
    });

    it('should return 400 when signature is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          razorpayOrderId: ORDER_ID,
          razorpayPaymentId: 'fake_payment_id',
          razorpaySignature: 'invalid_signature_xyz',
        })
        .expect(400);

      expect(response.body.error.code).toBe('PAYMENT_ERROR');
    });

    it('should return 400 when order id does not match any payment', async () => {
      const response = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          razorpayOrderId: 'fake_order_id',
          razorpayPaymentId: 'fake_payment_id',
          razorpaySignature: 'sig',
        })
        .expect(400);

      expect(response.body.error.code).toBe('PAYMENT_ERROR');
    });
  });

  describe('GET /api/v1/payments/:paymentId', () => {
    beforeEach(async () => {
      const { PaymentService } = await import('@/modules/payments/payment.service');
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        bookingId: BOOKING_ID,
        razorpayOrderId: 'order_' + Date.now(),
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockService = new PaymentService() as unknown as MockedPaymentService;
      mockService.getPaymentById.mockResolvedValue(mockPayment);

      const response = await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: BOOKING_ID,
          amount: 100,
          currency: 'USD',
        })
        .expect(201);

      PAYMENT_ID = response.body.data.payment.id;
    });

    it('should return payment status for a guest', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/${PAYMENT_ID}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      expect(response.body.data.payment.status).toBe('PENDING');
      expect(response.body.data.payment).toHaveProperty('razorpayOrderId');
      expect(response.body.data.payment).toHaveProperty('amount');
      expect(response.body.data.payment).toHaveProperty('currency');
    });

    it('should return 404 for non-existent payment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const { PaymentService } = await import('@/modules/payments/payment.service');
      const mockService = new PaymentService() as unknown as MockedPaymentService;
      mockService.getPaymentById.mockResolvedValueOnce(null);

      await request(app)
        .get(`/api/v1/payments/${fakeId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(404);
    });

    it("should return 403 when a guest tries to view another guest's payment", async () => {
      const { Payment } = await import('@/modules/payments/payment.model');
      const { PaymentService } = await import('@/modules/payments/payment.service');

      const otherGuestToken = await registerGuestAndGetToken('other-guest@test.com');
      const otherGuestBookingId = await createBooking(PROPERTY_ID, otherGuestToken, 3);
      const payment = await Payment.create({
        bookingId: new mongoose.Types.ObjectId(otherGuestBookingId),
        razorpayOrderId: `order_${new mongoose.Types.ObjectId().toString()}`,
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
      });
      const mockService = new PaymentService() as unknown as MockedPaymentService;
      mockService.getPaymentById.mockResolvedValueOnce(payment);

      await request(app)
        .get(`/api/v1/payments/${payment._id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/payments/booking/:bookingId', () => {
    beforeEach(async () => {
      const { PaymentService } = await import('@/modules/payments/payment.service');
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        bookingId: BOOKING_ID,
        razorpayOrderId: 'order_' + Date.now(),
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockService = new PaymentService() as unknown as MockedPaymentService;
      mockService.getPaymentByBookingId.mockResolvedValue(mockPayment);

      const response = await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: BOOKING_ID,
          amount: 100,
          currency: 'USD',
        })
        .expect(201);

      PAYMENT_ID = response.body.data.payment.id;
    });

    it('should return payment by booking for the guest', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/booking/${BOOKING_ID}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      expect(response.body.data.payment.status).toBe('PENDING');
      expect(response.body.data.payment).toHaveProperty('razorpayOrderId');
    });

    it('should return 404 when no payment exists for booking', async () => {
      const { PaymentService } = await import('@/modules/payments/payment.service');
      const mockService = new PaymentService() as unknown as MockedPaymentService;
      mockService.getPaymentByBookingId.mockResolvedValueOnce(null);

      const response = await request(app)
        .get(`/api/v1/payments/booking/${BOOKING_ID}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/payments/:paymentId/refund', () => {
    beforeEach(async () => {
      const { PaymentService } = await import('@/modules/payments/payment.service');
      const mockService = new PaymentService() as unknown as MockedPaymentService;
      mockService.getPaymentById.mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        bookingId: BOOKING_ID,
        razorpayOrderId: 'order_test',
        razorpayPaymentId: 'pay_test',
        amount: 100,
        currency: 'USD',
        status: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockService.refundPayment.mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        bookingId: BOOKING_ID,
        razorpayOrderId: 'order_test',
        razorpayPaymentId: 'pay_test',
        amount: 100,
        currency: 'USD',
        status: 'REFUND_PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: BOOKING_ID,
          amount: 100,
          currency: 'USD',
        })
        .expect(201);

      PAYMENT_ID = response.body.data.payment.id;
    });

    it('should return 403 when guest tries to refund', async () => {
      await request(app)
        .post(`/api/v1/payments/${PAYMENT_ID}/refund`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ reason: 'Changed plans' })
        .expect(403);
    });

    it('should return 400 when refunding a non-completed payment', async () => {
      const { Payment } = await import('@/modules/payments/payment.model');
      const payment = await Payment.findOne({});

      if (payment) {
        await request(app)
          .post(`/api/v1/payments/${payment._id}/refund`)
          .set('Authorization', `Bearer ${guestToken}`)
          .send({ reason: 'Changed plans' })
          .expect(400);
      }
    });
  });

  describe('POST /api/v1/payments/webhook', () => {
    it('should process a valid payment.authorized webhook', async () => {
      const { PaymentService } = await import('@/modules/payments/payment.service');
      const mockService = new PaymentService() as unknown as MockedPaymentService;
      mockService.handleWebhookEvent.mockImplementationOnce((event: WebhookEventInput) => {
        const paymentPayload = event.payload.payment as
          | { id?: string; order_id?: string; status?: string }
          | undefined;
        if (event.event === 'payment.authorized') {
          return Promise.resolve({
            _id: new mongoose.Types.ObjectId(),
            razorpayOrderId: paymentPayload?.order_id,
            razorpayPaymentId: paymentPayload?.id,
            status: paymentPayload?.status === 'captured' ? 'COMPLETED' : 'PROCESSING',
            amount: 100,
            currency: 'USD',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return Promise.resolve(null);
      });

      await request(app)
        .post('/api/v1/payments/orders')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: BOOKING_ID,
          amount: 100,
          currency: 'USD',
        })
        .expect(201);

      const webhookResponse = await request(app)
        .post('/api/v1/payments/webhook')
        .send({
          event: 'payment.authorized',
          entity: { data: {} },
          payload: {
            payment: {
              id: 'pay_webhook_test_123',
              order_id: 'order_webhook_test_456',
              status: 'captured',
            },
          },
          headers: {
            'x-razorpay-signature': 'fake_signature',
          },
        })
        .expect(200);

      expect(webhookResponse.body).toHaveProperty('success', true);
    });

    it('should return 400 for invalid webhook event format', async () => {
      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .send({
          event: 'payment.authorized',
          payload: {},
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/payments/admin/stats', () => {
    it('should return 403 when host tries to view admin stats', async () => {
      await request(app)
        .get('/api/v1/payments/admin/stats')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(403);
    });

    it('should return payment stats when authenticated as admin', async () => {
      const { User } = await import('@/modules/users/user.model');
      const adminUser = await User.findOne({ email: 'host@test.com' });
      if (adminUser) {
        await User.findByIdAndUpdate(adminUser._id, { role: 'ADMIN' });
        const adminLogin = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'host@test.com',
            password: 'Password123!',
          });
        const adminToken = adminLogin.body.data.accessToken;

        const { PaymentService } = await import('@/modules/payments/payment.service');
        const mockService = new PaymentService() as unknown as MockedPaymentService;
        mockService.getPaymentStats.mockResolvedValueOnce([
          { _id: 'PENDING', count: 1, totalAmount: 100 },
        ]);

        await request(app)
          .post('/api/v1/payments/orders')
          .set('Authorization', `Bearer ${guestToken}`)
          .send({
            bookingId: BOOKING_ID,
            amount: 100,
            currency: 'USD',
          })
          .expect(201);

        const response = await request(app)
          .get('/api/v1/payments/admin/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data.stats).toBeInstanceOf(Array);
      }
    });
  });
});