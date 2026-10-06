import { Router, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import rateLimit from 'express-rate-limit';
import * as adminController from './admin.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/rbac.middleware';
import { ApiResponse } from '@/utils/response';

const router = Router();

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 5000 : 5,
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

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));
router.use(adminLimiter);

// ========== Dashboard ==========
router.get('/dashboard/stats', adminController.getDashboardStats);

// ========== User Management ==========
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserById);
router.patch('/users/:userId/role', adminController.updateUserRole);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

// ========== Property Moderation ==========
router.get('/properties', adminController.getAllProperties);
router.patch('/properties/:propertyId/moderate', adminController.moderateProperty);
router.delete('/properties/:propertyId', adminController.adminDeleteProperty);

// ========== Booking Oversight ==========
router.get('/bookings', adminController.getAllBookings);
router.patch('/bookings/:bookingId/cancel', adminController.forceCancelBooking);

// ========== Analytics ==========
router.get('/analytics', adminController.getAnalytics);

export default router;
