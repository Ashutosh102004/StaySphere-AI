import { Router } from 'express';
import * as adminController from './admin.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/rbac.middleware';

const router = Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

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