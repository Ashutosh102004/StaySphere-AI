// Review API Integration Tests
// Tests the Review controller/routes against a real Express app
// backed by an in-memory MongoDB instance.

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '@/app';

let mongoServer: MongoMemoryServer;
let hostToken: string;
let guestToken: string;
let hostUserId: string;
let PROPERTY_ID: string;
let BOOKING_ID: string;

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
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/staysphere-ai-test';
  process.env.NODE_ENV = 'test';

  mongoServer = await MongoMemoryServer.create();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  for (const collection of collections) {
    await collection.deleteMany({});
  }
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
  hostUserId = hostUser!._id.toString();
  await User.findByIdAndUpdate(hostUserId, { role: 'HOST' });

  const hostLogin = await request(app).post('/api/v1/auth/login').send({
    email: 'host@test.com',
    password: 'Password123!',
  });
  hostToken = hostLogin.body.data.accessToken;
}

async function registerGuestAndGetToken() {
  await request(app).post('/api/v1/auth/register').send({
    email: 'guest@test.com',
    password: 'Password123!',
    firstName: 'Guest',
    lastName: 'User',
  });

  const guestLogin = await request(app).post('/api/v1/auth/login').send({
    email: 'guest@test.com',
    password: 'Password123!',
  });
  guestToken = guestLogin.body.data.accessToken;
}

async function createBooking(propertyId: string) {
  const response = await request(app)
    .post('/api/v1/bookings/')
    .set('Authorization', `Bearer ${guestToken}`)
    .send({
      propertyId,
      checkIn: new Date(Date.now() + 86400000).toISOString(),
      checkOut: new Date(Date.now() + 2 * 86400000).toISOString(),
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

describe('Review API Integration', () => {
  beforeEach(async () => {
    await registerHostAndGetToken();
    await registerGuestAndGetToken();

    // Create property
    const propResponse = await request(app)
      .post('/api/v1/properties/')
      .set('Authorization', `Bearer ${hostToken}`)
      .send(validPropertyData)
      .expect(201);
    PROPERTY_ID = propResponse.body.data.property.id;

    // Publish property
    await request(app)
      .patch(`/api/v1/properties/${PROPERTY_ID}/publish`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ published: true })
      .expect(200);

    // Create and complete booking
    const bookingId = await createBooking(PROPERTY_ID);
    await confirmBooking(bookingId);
    await completeBooking(bookingId);
    BOOKING_ID = bookingId;
  });

  describe('POST /api/v1/reviews/', () => {
    it('should create a review when authenticated as guest', async () => {
      const response = await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'Excellent stay, highly recommend this property to everyone.',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.review).toMatchObject({
        propertyId: PROPERTY_ID,
        bookingId: BOOKING_ID,
        rating: 5,
        comment: 'Excellent stay, highly recommend this property to everyone.',
      });
      expect(response.body.data.review).toHaveProperty('id');
      expect(response.body.data.review).toHaveProperty('createdAt');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .post('/api/v1/reviews/')
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'Test comment.',
        })
        .expect(401);
    });

    it('should return 400 when authenticated as host (business error)', async () => {
      await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'Test comment.',
        })
        .expect(400);
    });

    it('should return 400 for rating below 1', async () => {
      await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 0,
          comment: 'Test comment.',
        })
        .expect(400);
    });

    it('should return 400 for rating above 5', async () => {
      await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 6,
          comment: 'Test comment.',
        })
        .expect(400);
    });

    it('should return 400 for comment shorter than 10 characters', async () => {
      await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'Short',
        })
        .expect(400);
    });

    it('should return 400 for missing propertyId', async () => {
      await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'Test comment for validation.',
        })
        .expect(400);
    });

    it('should return 400 for missing bookingId', async () => {
      await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          rating: 5,
          comment: 'Test comment for validation.',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/reviews/:id', () => {
    it('should return a review when it exists', async () => {
      const createResponse = await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'Great property!',
        })
        .expect(201);

      const reviewId = createResponse.body.data.review.id;

      const response = await request(app)
        .get(`/api/v1/reviews/${reviewId}`)
        .expect(200);

      expect(response.body.data.review).toMatchObject({
        rating: 5,
      });
    });

    it('should return 404 for non-existent review', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/v1/reviews/${fakeId}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/reviews/properties/:propertyId/reviews', () => {
    it('should return reviews for a property', async () => {
      await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 4,
          comment: 'Nice place to stay.',
        })
        .expect(201);

      const response = await request(app)
        .get(`/api/v1/reviews/properties/${PROPERTY_ID}/reviews`)
        .expect(200);

      expect(response.body.data.reviews).toHaveLength(1);
      expect(response.body.data.reviews[0].propertyId).toBe(PROPERTY_ID);
    });
  });

  describe('GET /api/v1/reviews/properties/:propertyId/reviews/stats', () => {
    it('should return review stats for a property', async () => {
      await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'Amazing place!',
        })
        .expect(201);

      const response = await request(app)
        .get(`/api/v1/reviews/properties/${PROPERTY_ID}/reviews/stats`)
        .expect(200);

      expect(response.body.data.stats).toHaveProperty('totalReviews', 1);
      expect(response.body.data.stats).toHaveProperty('averageRating', 5);
    });
  });

  describe('PATCH /api/v1/reviews/:id', () => {
    it('should update review when authenticated as owner', async () => {
      const createResponse = await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'Original comment.',
        })
        .expect(201);

      const reviewId = createResponse.body.data.review.id;

      const response = await request(app)
        .patch(`/api/v1/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ rating: 4, comment: 'Updated comment.' })
        .expect(200);

      expect(response.body.data.review.rating).toBe(4);
      expect(response.body.data.review.comment).toBe('Updated comment.');
    });

    it('should return 404 when non-owner tries to update', async () => {
      const createResponse = await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'Original comment.',
        })
        .expect(201);

      const reviewId = createResponse.body.data.review.id;

      await request(app)
        .patch(`/api/v1/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ rating: 1 })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/reviews/:id', () => {
    it('should delete review when authenticated as owner', async () => {
      const createResponse = await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'Delete me.',
        })
        .expect(201);

      const reviewId = createResponse.body.data.review.id;

      const response = await request(app)
        .delete(`/api/v1/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 403 when non-owner tries to delete', async () => {
      const createResponse = await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'Delete me.',
        })
        .expect(201);

      const reviewId = createResponse.body.data.review.id;

      await request(app)
        .delete(`/api/v1/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/reviews/can-review/:bookingId', () => {
    it('should return canReview true for a completed booking without a review', async () => {
      const response = await request(app)
        .get(`/api/v1/reviews/can-review/${BOOKING_ID}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      expect(response.body.data.canReview).toBe(true);
    });

    it('should return canReview false when review already exists', async () => {
      await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'Already reviewed.',
        })
        .expect(201);

      const response = await request(app)
        .get(`/api/v1/reviews/can-review/${BOOKING_ID}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      expect(response.body.data.canReview).toBe(false);
    });
  });

  describe('GET /api/v1/reviews/my-reviews', () => {
    it('should return the guest user reviews', async () => {
      await request(app)
        .post('/api/v1/reviews/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          propertyId: PROPERTY_ID,
          bookingId: BOOKING_ID,
          rating: 5,
          comment: 'My review.',
        })
        .expect(201);

      const response = await request(app)
        .get('/api/v1/reviews/my-reviews')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      expect(response.body.data.reviews).toHaveLength(1);
    });
  });
});