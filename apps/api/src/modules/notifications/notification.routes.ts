import { Router } from 'express';
import * as notificationController from './notification.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/rbac.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', notificationController.getUserNotifications);

// Get unread count
router.get('/count/unread', notificationController.getUnreadCount);

// Get notification by ID
router.get('/:notificationId', notificationController.getNotificationById);

// Mark notification as read
router.patch(
  '/:notificationId/read',
  notificationController.markAsRead
);

// Mark all as read
router.patch(
  '/read/all',
  notificationController.markAllAsRead
);

// Delete notification
router.delete(
  '/:notificationId',
  notificationController.deleteNotification
);

// Delete all notifications
router.delete(
  '/delete/all',
  notificationController.deleteAllNotifications
);

// Admin: Create notification (for admin-triggered notifications)
router.post(
  '/',
  authorize('ADMIN'),
  notificationController.createNotification
);

export default router;
