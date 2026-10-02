import { Router } from 'express';
import * as propertyController from './property.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/rbac.middleware';

const router = Router();

// Public routes
router.get('/search', propertyController.searchProperties);
router.get('/:id', propertyController.getProperty);

// Protected routes (HOST, ADMIN)
router.post(
  '/',
  authenticate,
  authorize('HOST', 'ADMIN'),
  propertyController.createProperty
);

router.get(
  '/my/properties',
  authenticate,
  authorize('HOST', 'ADMIN'),
  propertyController.getMyProperties
);

router.patch(
  '/:id',
  authenticate,
  authorize('HOST', 'ADMIN'),
  propertyController.updateProperty
);

router.delete(
  '/:id',
  authenticate,
  authorize('HOST', 'ADMIN'),
  propertyController.deleteProperty
);

router.patch(
  '/:id/publish',
  authenticate,
  authorize('HOST', 'ADMIN'),
  propertyController.publishProperty
);

export default router;
