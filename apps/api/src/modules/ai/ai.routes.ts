import { Router, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import rateLimit from 'express-rate-limit';
import * as aiController from './ai.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { ApiResponse } from '@/utils/response';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: ExpressRequest): string => {
    const userId = req.user?.id;
    return typeof userId === 'string' ? userId : (req.ip ?? 'unknown');
  },
  handler: (_req: ExpressRequest, res: ExpressResponse) => {
    ApiResponse.error(res, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429);
  },
});

// Public routes - search and recommendations
router.get('/search', aiController.smartSearch);
router.get('/recommendations', aiController.getRecommendations);
router.post('/price/optimize', aiController.optimizePrice);

// Protected routes - require authentication
router.post('/chat', authenticate, chatLimiter, aiController.chat);
router.get('/conversations', authenticate, aiController.getConversations);
router.get('/conversations/:conversationId/messages', authenticate, aiController.getConversationMessages);

// Property description generation (host only)
router.post('/generate-description', authenticate, aiController.generateDescription);

export default router;