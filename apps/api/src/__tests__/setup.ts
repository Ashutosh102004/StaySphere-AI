// Global test setup — runs ONCE before all test files.
// Sets test-only JWT secrets so env.ts validation passes.
// NEVER uses production .env, real MongoDB, or external services.

process.env.JWT_ACCESS_SECRET = 'test-access-secret-for-jest-tests-only-999';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-jest-tests-only-888';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_EXPIRATION = '7d';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/staysphere-ai-test';
process.env.NODE_ENV = 'test';
process.env.RAZORPAY_KEY_ID = 'test-razorpay-key-id';
process.env.RAZORPAY_KEY_SECRET = 'test-razorpay-key-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test-razorpay-webhook-secret';
process.env.AI_BASE_URL = 'https://ai.test.invalid/v1';
process.env.AI_API_KEY = 'test-ai-api-key';