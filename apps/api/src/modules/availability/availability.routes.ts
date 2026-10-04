import { Router } from 'express';
import * as availabilityController from './availability.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/rbac.middleware';

const router = Router();

// Public route - query availability (no auth required)
router.get('/properties/:propertyId/query', availabilityController.queryAvailability);

// Public route - get effective price for a date
router.get('/properties/:propertyId/price', availabilityController.getEffectivePrice);

// Protected routes (HOST, ADMIN only)
router.post(
  '/',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.createAvailability
);

router.get(
  '/:id',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.getAvailability
);

router.get(
  '/properties/:propertyId/list',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.getPropertyAvailabilities
);

router.patch(
  '/:id',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.updateAvailability
);

router.delete(
  '/:id',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.deleteAvailability
);

// Date blocking endpoints (HOST, ADMIN only)
router.post(
  '/block/dates',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.blockDates
);

router.delete(
  '/block/dates',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.unblockDates
);

// Validation endpoints (public)
router.get(
  '/properties/:propertyId/validate/stay-duration',
  availabilityController.validateStayDuration
);

router.get(
  '/properties/:propertyId/validate/lead-time',
  availabilityController.validateLeadTime
);

router.get(
  '/properties/:propertyId/validate/advance-notice',
  availabilityController.validateAdvanceNotice
);

// Stay requirements endpoints (HOST, ADMIN only)
router.post(
  '/requirements/stay',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.setStayRequirements
);

// Lead time endpoints (HOST, ADMIN only)
router.post(
  '/requirements/lead-time',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.setLeadTime
);

// Advance notice endpoints (HOST, ADMIN only)
router.post(
  '/requirements/advance-notice',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.setAdvanceNotice
);

// Seasonal pricing endpoints (HOST, ADMIN only)
router.post(
  '/seasons/create',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.createSeason
);

router.get(
  '/seasons/properties/:propertyId',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.getSeasons
);

// Bulk pricing endpoints (HOST, ADMIN only)
router.post(
  '/pricing/bulk',
  authenticate,
  authorize('HOST', 'ADMIN'),
  availabilityController.bulkSetPricing
);

export default router;
