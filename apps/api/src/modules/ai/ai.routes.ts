import { Router } from 'express';
import * as aiController from './ai.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// Public routes - search and recommendations
router.get('/search', aiController.smartSearch);
router.get('/recommendations', aiController.getRecommendations);
router.post('/price/optimize', aiController.optimizePrice);

// Protected routes - require authentication
router.post('/chat', authenticate, aiController.chat);
router.get('/conversations', authenticate, aiController.getConversations);
router.get('/conversations/:conversationId/messages', authenticate, aiController.getConversationMessages);

// Property description generation (host only)
router.post('/generate-description', authenticate, aiController.generateDescription);

export default router;