import { Router } from 'express';
import * as wishlistController from './wishlist.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/rbac.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's wishlist
router.get('/', wishlistController.getUserWishlist);

// Get wishlist count
router.get('/count/items', wishlistController.getWishlistCount);

// Check if property is in wishlist
router.get(
  '/:propertyId/check',
  wishlistController.checkInWishlist
);

// Add to wishlist
router.post('/', wishlistController.addToWishlist);

// Remove from wishlist
router.delete('/', wishlistController.removeFromWishlist);

// Clear all wishlist items
router.delete(
  '/clear/all',
  wishlistController.clearWishlist
);

// Admin: Get wishlist statistics
router.get(
  '/admin/stats',
  authorize('ADMIN'),
  wishlistController.getWishlistStats
);

export default router;
