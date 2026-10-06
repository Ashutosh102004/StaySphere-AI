import { Router, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from './auth.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { ApiResponse } from '@/utils/response';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 5000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: ExpressRequest): string => {
    return process.env.NODE_ENV === 'test' ? 'test-client' : (req.ip ?? 'unknown');
  },
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req: ExpressRequest, res: ExpressResponse) => {
    ApiResponse.error(res, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429);
  },
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authLimiter, authController.refresh);
router.get('/me', authenticate, authController.me);

export default router;
