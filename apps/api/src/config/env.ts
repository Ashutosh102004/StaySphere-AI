import dotenv from 'dotenv';

dotenv.config();

const validateRequiredEnv = (varName: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${varName}. ` +
      `This is a security-critical variable and must be set before starting the application.`
    );
  }
  if (varName.includes('SECRET') && value.length < 32) {
    throw new Error(
      `${varName} must be at least 32 characters long for security. Current length: ${value.length}`
    );
  }
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/staysphere-ai',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwt: {
    accessSecret: validateRequiredEnv('JWT_ACCESS_SECRET', process.env.JWT_ACCESS_SECRET),
    refreshSecret: validateRequiredEnv('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET),
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
};
