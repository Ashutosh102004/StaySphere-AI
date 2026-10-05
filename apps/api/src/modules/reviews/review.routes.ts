import { Router } from 'express';
import * as reviewController from './review.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// Public routes - specific routes first to avoid shadowing
router.get('/properties/:propertyId/reviews', reviewController.getPropertyReviews);
router.get('/properties/:propertyId/reviews/stats', reviewController.getReviewStats);

// Protected routes - specific routes first
router.get('/my-reviews', authenticate, reviewController.getMyReviews);
router.get('/can-review/:bookingId', authenticate, reviewController.canReviewBooking);
router.post('/', authenticate, reviewController.createReview);
router.patch('/:id', authenticate, reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

// Generic catch-all last
router.get('/:id', reviewController.getReview);

export default router;