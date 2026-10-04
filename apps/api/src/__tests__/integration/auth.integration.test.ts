// Auth API Integration Tests
// Tests the Auth controller/routes against a real Express app
// backed by an in-memory MongoDB instance.

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '@/app';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Set test-only JWT secrets FIRST - must be >= 32 characters
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-jest-tests-only-999';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-jest-tests-only-888';
  process.env.JWT_ACCESS_EXPIRATION = '15m';
  process.env.JWT_REFRESH_EXPIRATION = '7d';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/staysphere-ai-test';
  process.env.NODE_ENV = 'test';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect mongoose to the test DB
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up any persisted data between tests
  const collections = Object.values(mongoose.connection.collections);
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

describe('Auth API Integration', () => {
  const registerPayload = {
    email: 'integration-test@example.com',
    password: 'Password123!',
    firstName: 'Integration',
    lastName: 'Tester',
  };

  const loginPayload = {
    email: 'integration-test@example.com',
    password: 'Password123!',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerPayload)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body).toHaveProperty('data.accessToken');
      expect(response.body.data.user.email).toBe(registerPayload.email);
      expect(response.body.data.user.role).toBe('GUEST');
    });

    it('should return 409 when registering with duplicate email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(registerPayload)
        .expect(201);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerPayload)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error.code', 'CONFLICT');
      expect(response.body.error.message).toContain('Email already registered');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(registerPayload)
        .expect(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginPayload)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data.accessToken');
      expect(response.body.data.user.email).toBe(loginPayload.email);
    });

    it('should return 401 with incorrect password', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(registerPayload)
        .expect(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ ...loginPayload, password: 'WrongPassword123!' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('Invalid email or password');
    });

    it('should return 401 with nonexistent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password123!' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('Invalid email or password');
    });

    it('should set refreshToken cookie on login', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(registerPayload)
        .expect(201);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginPayload)
        .expect(200);

      expect(response.headers['set-cookie']).toBeDefined();
      const cookie = response.headers['set-cookie'][0];
      expect(cookie).toContain('refreshToken');
      expect(cookie.toLowerCase()).toContain('httponly');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token with valid refresh cookie', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(registerPayload)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send(loginPayload)
        .expect(200);

      const refreshToken = loginResponse.headers['set-cookie'][0].match(/refreshToken=([^;]+)/)?.[1];
      expect(refreshToken).toBeDefined();

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data.accessToken');
    });

    it('should return 401 with missing refresh cookie', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(registerPayload)
        .expect(201);

      await request(app).post('/api/v1/auth/refresh').expect(401);
    });

    it('should return 401 with invalid refresh cookie', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(registerPayload)
        .expect(201);

      await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token-value')
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user data when authenticated', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(registerPayload)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send(loginPayload)
        .expect(200);

      const accessToken = loginResponse.body.data.accessToken;
      expect(accessToken).toBeDefined();

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user.email).toBe(registerPayload.email);
      expect(response.body.data.user.role).toBe('GUEST');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app).get('/api/v1/auth/me').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(registerPayload)
        .expect(201);

      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
