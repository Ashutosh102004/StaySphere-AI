import { Router } from 'express';
import * as bookingController from './booking.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/rbac.middleware';

const router = Router();

// Public route - check property availability
router.get('/properties/:propertyId/availability', bookingController.getPropertyAvailability);

// Protected routes - all users need to be authenticated
router.post(
  '/',
  authenticate,
  bookingController.createBooking
);

router.get(
  '/my-bookings',
  authenticate,
  bookingController.getMyBookings
);

router.get(
  '/:id',
  authenticate,
  bookingController.getBooking
);

// Host routes - view bookings for their properties
router.get(
  '/host/bookings',
  authenticate,
  authorize('HOST', 'ADMIN'),
  bookingController.getHostBookings
);

// Host/Admin routes - update booking status
router.patch(
  '/:id/status',
  authenticate,
  authorize('HOST', 'ADMIN'),
  bookingController.updateBookingStatus
);

// All authenticated users can cancel their own bookings
// Hosts can cancel bookings for their properties
// Admins can cancel any booking
router.patch(
  '/:id/cancel',
  authenticate,
  bookingController.cancelBooking
);

export default router;
