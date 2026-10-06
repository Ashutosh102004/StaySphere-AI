// Booking API Integration Tests
// Tests the Booking controller/routes against a real Express app
// backed by an in-memory MongoDB instance.

import request from 'supertest';
import mongoose from 'mongoose';

import app from '@/app';
import { connectMongo, clearDatabase, disconnectMongo } from '@/__tests__/mongo';

let guestToken: string;
let hostToken: string;
let hostUserId: string;
let PROPERTY_ID: mongoose.Types.ObjectId;

const validBookingData = {
  propertyId: '',
  checkIn: new Date(Date.now() + 86400000).toISOString(),
  checkOut: new Date(Date.now() + 2 * 86400000).toISOString(),
  guests: 2,
  guestDetails: [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
    },
  ],
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

async function setupFixtures() {
  const { User } = await import('@/modules/users/user.model');

  // Register host
  await request(app).post('/api/v1/auth/register').send({
    email: 'host@test.com',
    password: 'Password123!',
    firstName: 'Host',
    lastName: 'User',
  });

  // Update host role to HOST BEFORE login (so token includes HOST role)
  const hostUser = await User.findOne({ email: 'host@test.com' });
  hostUserId = hostUser!._id.toString();
  await User.findByIdAndUpdate(hostUserId, { role: 'HOST' });

  // Host login (after role update so token has correct role)
  const hostLogin = await request(app).post('/api/v1/auth/login').send({
    email: 'host@test.com',
    password: 'Password123!',
  });
  hostToken = hostLogin.body.data.accessToken;

  // Create property owned by host
  const { Property } = await import('@/modules/properties/property.model');
  const prop = await Property.create({
    hostId: new mongoose.Types.ObjectId(hostUserId),
    title: 'Test Property',
    description: 'A nice place to stay',
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
    published: true,
  });
  PROPERTY_ID = prop._id;
  validBookingData.propertyId = PROPERTY_ID.toString();

  // Register guest
  await request(app).post('/api/v1/auth/register').send({
    email: 'guest@test.com',
    password: 'Password123!',
    firstName: 'Guest',
    lastName: 'User',
  });

  // Guest login
  const guestLogin = await request(app).post('/api/v1/auth/login').send({
    email: 'guest@test.com',
    password: 'Password123!',
  });
  guestToken = guestLogin.body.data.accessToken;
}

describe('Booking API Integration', () => {
  beforeEach(async () => {
    await setupFixtures();
  });

  describe('POST /api/v1/bookings/', () => {
    it('should create a booking when authenticated as guest', async () => {
      const response = await request(app)
        .post('/api/v1/bookings/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(validBookingData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.booking).toMatchObject({
        propertyId: PROPERTY_ID.toString(),
        guests: validBookingData.guests,
        status: 'PENDING',
      });
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .post('/api/v1/bookings/')
        .send(validBookingData)
        .expect(401);
    });
  });

  describe('GET /api/v1/bookings/my-bookings', () => {
    it('should return guest bookings when authenticated', async () => {
      await request(app)
        .post('/api/v1/bookings/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(validBookingData);

      const response = await request(app)
        .get('/api/v1/bookings/my-bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].propertyId).toMatchObject({
        _id: PROPERTY_ID.toString(),
      });
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/v1/bookings/my-bookings')
        .expect(401);
    });
  });

  describe('GET /api/v1/bookings/host/bookings', () => {
    it('should return host property bookings when authenticated as host', async () => {
      await request(app)
        .post('/api/v1/bookings/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(validBookingData);

      const response = await request(app)
        .get('/api/v1/bookings/host/bookings')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].propertyId).toMatchObject({
        _id: PROPERTY_ID.toString(),
      });
    });

    it('should return 403 when authenticated as guest', async () => {
      await request(app)
        .get('/api/v1/bookings/host/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/v1/bookings/host/bookings')
        .expect(401);
    });
  });

  describe('PATCH /api/v1/bookings/:id/status', () => {
    let bookingId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/v1/bookings/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(validBookingData);

      bookingId = createResponse.body.data.booking.id;
    });

    it('should allow host to confirm booking for their property', async () => {
      const response = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(response.body.data.booking.status).toBe('CONFIRMED');
    });

    it('should allow guest to cancel their own booking', async () => {
      const response = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ cancellationReason: 'Changed plans' })
        .expect(200);

      expect(response.body.data.booking.status).toBe('CANCELLED');
    });

    it('should prevent guest from setting CONFIRMED status', async () => {
      await request(app)
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(403);
    });

    it('should return 404 for non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .patch(`/api/v1/bookings/${fakeId}/status`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(404);
    });
  });

  describe('PATCH /api/v1/bookings/:id/confirm', () => {
    let bookingId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/v1/bookings/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(validBookingData);

      bookingId = createResponse.body.data.booking.id;
    });

    it('should allow guest to confirm booking with valid paymentId', async () => {
      const response = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ paymentId: 'test_payment_id_123' })
        .expect(200);

      expect(response.body.data.booking.status).toBe('CONFIRMED');
    });

    it('should return 400 when paymentId is missing', async () => {
      await request(app)
        .patch(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({})
        .expect(400);
    });

    it('should return error when confirming non-PENDING booking', async () => {
      await request(app)
        .patch(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ paymentId: 'test_payment_id_123' });

      await request(app)
        .patch(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ paymentId: 'test_payment_id_456' })
        .expect(400);
    });
  });

  describe('PATCH /api/v1/bookings/:id/complete', () => {
    let bookingId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/v1/bookings/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(validBookingData);

      bookingId = createResponse.body.data.booking.id;

      await request(app)
        .patch(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ paymentId: 'test_payment_id' });
    });

    it('should allow host to complete confirmed booking', async () => {
      const response = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/complete`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ notes: 'Guest left early' })
        .expect(200);

      expect(response.body.data.booking.status).toBe('COMPLETED');
    });

    it('should prevent guest from completing booking', async () => {
      await request(app)
        .patch(`/api/v1/bookings/${bookingId}/complete`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ notes: 'Not allowed' })
        .expect(403);
    });

    it('should return error when completing non-CONFIRMED booking', async () => {
      // bookingId from beforeEach is already confirmed, so we need one that isn't
      // Create a booking and NOT confirm it - then try to complete (should fail since it's PENDING)
      const uniqueBookingData = {
        ...validBookingData,
        checkIn: new Date(Date.now() + 5 * 86400000).toISOString(),
        checkOut: new Date(Date.now() + 7 * 86400000).toISOString(),
      };
      const createResponse = await request(app)
        .post('/api/v1/bookings/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(uniqueBookingData)
        .expect(201);

      const pendingBookingId = createResponse.body.data.booking.id;

      // Attempt to complete a PENDING booking should fail with 400
      const response = await request(app)
        .patch(`/api/v1/bookings/${pendingBookingId}/complete`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ notes: 'Too early' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});