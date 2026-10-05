// Property API Integration Tests
// Tests the Property controller/routes against a real Express app
// backed by an in-memory MongoDB instance.

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '@/app';

let mongoServer: MongoMemoryServer;
let hostToken: string;
let hostUserId: string;
let guestToken: string;

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
}

async function registerGuestAndGetToken() {
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

describe('Property API Integration', () => {
  beforeEach(async () => {
    await registerHostAndGetToken();
  });

  describe('POST /api/v1/properties/', () => {
    it('should create a property when authenticated as host', async () => {
      const response = await request(app)
        .post('/api/v1/properties/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(validPropertyData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.property).toMatchObject({
        title: validPropertyData.title,
        description: validPropertyData.description,
        propertyType: validPropertyData.propertyType,
        location: validPropertyData.location,
        maxGuests: validPropertyData.maxGuests,
        bedrooms: validPropertyData.bedrooms,
        bathrooms: validPropertyData.bathrooms,
        pricePerNight: validPropertyData.pricePerNight,
        currency: validPropertyData.currency,
        amenities: validPropertyData.amenities,
        images: validPropertyData.images,
        cancellationPolicy: validPropertyData.cancellationPolicy,
        published: false,
      });

      expect(response.body.data.property).toHaveProperty('id');
      expect(response.body.data.property).toHaveProperty('createdAt');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .post('/api/v1/properties/')
        .send(validPropertyData)
        .expect(401);
    });

    it('should return 403 when authenticated as guest', async () => {
      await registerGuestAndGetToken();
      await request(app)
        .post('/api/v1/properties/')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(validPropertyData)
        .expect(403);
    });
  });

  describe('GET /api/v1/properties/my/properties', () => {
    it('should return host properties when authenticated as host', async () => {
      // Create a property
      const createResponse = await request(app)
        .post('/api/v1/properties/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(validPropertyData)
        .expect(201);

      const propertyId = createResponse.body.data.property.id;

      const response = await request(app)
        .get('/api/v1/properties/my/properties')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body.data.properties).toHaveLength(1);
      expect(response.body.data.properties[0]).toMatchObject({
        title: validPropertyData.title,
        description: validPropertyData.description,
      });
      // getMyProperties returns raw documents using _id as the id field in the response
      expect(response.body.data.properties[0]._id).toBe(propertyId);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/v1/properties/my/properties')
        .expect(401);
    });

    it('should return 403 when authenticated as guest', async () => {
      await registerGuestAndGetToken();
      await request(app)
        .get('/api/v1/properties/my/properties')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/properties/:id', () => {
    it('should return property when authenticated as host owner', async () => {
      const createResponse = await request(app)
        .post('/api/v1/properties/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(validPropertyData)
        .expect(201);

      const propertyId = createResponse.body.data.property.id;

      // Publish the property since GET /:id is public and uses getPublicPropertyById
      await request(app)
        .patch(`/api/v1/properties/${propertyId}/publish`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ published: true })
        .expect(200);

      const response = await request(app)
        .get(`/api/v1/properties/${propertyId}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body.data.property).toMatchObject({
        id: propertyId,
        title: validPropertyData.title,
      });
    });

    it('should return property when authenticated as guest', async () => {
      await registerGuestAndGetToken();
      const createResponse = await request(app)
        .post('/api/v1/properties/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(validPropertyData)
        .expect(201);

      const propertyId = createResponse.body.data.property.id;

      // Publish the property since GET /:id is public and uses getPublicPropertyById
      await request(app)
        .patch(`/api/v1/properties/${propertyId}/publish`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ published: true })
        .expect(200);

      const response = await request(app)
        .get(`/api/v1/properties/${propertyId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      expect(response.body.data.property).toMatchObject({
        id: propertyId,
        title: validPropertyData.title,
      });
    });

    it('should return property without authentication (public)', async () => {
      const createResponse = await request(app)
        .post('/api/v1/properties/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(validPropertyData)
        .expect(201);

      const propertyId = createResponse.body.data.property.id;

      // Publish the property to make it available publicly
      await request(app)
        .patch(`/api/v1/properties/${propertyId}/publish`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ published: true })
        .expect(200);

      const response = await request(app)
        .get(`/api/v1/properties/${propertyId}`)
        .expect(200);

      expect(response.body.data.property).toMatchObject({
        id: propertyId,
        title: validPropertyData.title,
      });
    });

    it('should return 404 for non-existent property', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/v1/properties/${fakeId}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/properties/:id', () => {
    it('should update property when authenticated as host owner', async () => {
      const createResponse = await request(app)
        .post('/api/v1/properties/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(validPropertyData)
        .expect(201);

      const propertyId = createResponse.body.data.property.id;

      const updateData = {
        title: 'Updated Property Title',
        pricePerNight: 150,
      };

      const response = await request(app)
        .patch(`/api/v1/properties/${propertyId}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.property).toMatchObject({
        id: propertyId,
        title: updateData.title,
        pricePerNight: updateData.pricePerNight,
      });
    });

    it('should return 403 when authenticated as guest trying to update', async () => {
      await registerGuestAndGetToken();
      const createResponse = await request(app)
        .post('/api/v1/properties/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(validPropertyData)
        .expect(201);

      const propertyId = createResponse.body.data.property.id;

      const updateData = {
        title: 'Updated Property Title',
      };

      await request(app)
        .patch(`/api/v1/properties/${propertyId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('DELETE /api/v1/properties/:id', () => {
    it('should delete property when authenticated as host owner', async () => {
      const createResponse = await request(app)
        .post('/api/v1/properties/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(validPropertyData)
        .expect(201);

      const propertyId = createResponse.body.data.property.id;

      const response = await request(app)
        .delete(`/api/v1/properties/${propertyId}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toBe('Property deleted successfully');

      // Verify property is deleted
      await request(app)
        .get(`/api/v1/properties/${propertyId}`)
        .expect(404);
    });

    it('should return 403 when authenticated as guest trying to delete', async () => {
      await registerGuestAndGetToken();
      const createResponse = await request(app)
        .post('/api/v1/properties/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(validPropertyData)
        .expect(201);

      const propertyId = createResponse.body.data.property.id;

      await request(app)
        .delete(`/api/v1/properties/${propertyId}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });
  });

  describe('PATCH /api/v1/properties/:id/publish', () => {
    it('should publish property when authenticated as host owner', async () => {
      const createResponse = await request(app)
        .post('/api/v1/properties/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(validPropertyData)
        .expect(201);

      const propertyId = createResponse.body.data.property.id;

      const response = await request(app)
        .patch(`/api/v1/properties/${propertyId}/publish`)
        .set('Authorization', `Bearer ${hostToken}`)
        .send({ published: true })
        .expect(200);

      expect(response.body.data.property).toMatchObject({
        id: propertyId,
        published: true,
      });
    });

    it('should return 403 when authenticated as guest trying to publish', async () => {
      await registerGuestAndGetToken();
      const createResponse = await request(app)
        .post('/api/v1/properties/')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(validPropertyData)
        .expect(201);

      const propertyId = createResponse.body.data.property.id;

      await request(app)
        .patch(`/api/v1/properties/${propertyId}/publish`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ published: true })
        .expect(403);
    });
  });
});