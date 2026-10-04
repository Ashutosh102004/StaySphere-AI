import { Router } from 'express';
import * as identityController from './identity.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/rbac.middleware';

const router = Router();

// Initiate verification (auth required)
router.post(
  '/initiate',
  authenticate,
  identityController.initiateVerification
);

// Initiate verification with document upload (auth required)
router.post(
  '/verify-with-document',
  authenticate,
  identityController.initiateVerificationWithDocument
);

// Handle verification callback (public - from verification provider)
router.post(
  '/callback',
  identityController.handleVerificationCallback
);

// Get verification status (auth required)
router.get(
  '/status',
  authenticate,
  identityController.getVerificationStatus
);

// Retry verification (auth required)
router.post(
  '/retry',
  authenticate,
  identityController.retryVerification
);

// Admin: Get verification statistics
router.get(
  '/admin/stats',
  authenticate,
  authorize('ADMIN'),
  identityController.getVerificationStats
);

export default router;
