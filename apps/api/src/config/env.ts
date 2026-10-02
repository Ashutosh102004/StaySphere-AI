import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/staysphere-ai',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'change-this-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-secret',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'kiro',
    model: process.env.AI_MODEL || 'claude-sonnet-4.5',
    apiKey: process.env.AI_API_KEY || '',
  },
  identity: {
    provider: process.env.IDENTITY_PROVIDER || 'mock',
    providerKey: process.env.IDENTITY_PROVIDER_KEY || '',
    webhookSecret: process.env.IDENTITY_WEBHOOK_SECRET || '',
  },
} as const;
