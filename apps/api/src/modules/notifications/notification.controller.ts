import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import {
  createNotificationSchema,
  markAsReadSchema,
  deleteNotificationSchema,
} from './notification.validation';
import { asyncHandler } from '@/utils/async-handler';
import { ApiResponse } from '@/utils/response';

const notificationService = new NotificationService();

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createNotificationSchema.parse(req.body);

  const notification = await notificationService.createNotification(validatedData);

  return ApiResponse.success(
    res,
    {
      notification: {
        id: notification._id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: notification.read,
        createdAt: notification.createdAt,
      },
    },
    'Notification created successfully',
    201
  );
});

export const getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const unreadOnly = req.query.unreadOnly === 'true';

  const { notifications, total } = await notificationService.getUserNotifications(
    userId,
    limit,
    offset,
    unreadOnly
  );

  return ApiResponse.success(res, {
    notifications: notifications.map(n => ({
      id: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      read: n.read,
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
    pagination: {
      total,
      limit,
      offset,
    },
  });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const unreadCount = await notificationService.getUnreadCount(userId);

  return ApiResponse.success(res, {
    unreadCount,
  });
});

export const getNotificationById = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;

  const notification = await notificationService.getNotificationById(notificationId);

  if (!notification) {
    return ApiResponse.error(res, 'Notification not found', 'NOT_FOUND', 404);
  }

  // Authorization: only the recipient can view
  if (notification.userId.toString() !== req.user!.id && req.user!.role !== 'ADMIN') {
    return ApiResponse.error(
      res,
      'You do not have permission to view this notification',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  return ApiResponse.success(res, {
    notification: {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    },
  });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = markAsReadSchema.parse(req.body);

  const notification = await notificationService.getNotificationById(validatedData.notificationId);

  if (!notification) {
    return ApiResponse.error(res, 'Notification not found', 'NOT_FOUND', 404);
  }

  // Authorization
  if (notification.userId.toString() !== req.user!.id && req.user!.role !== 'ADMIN') {
    return ApiResponse.error(
      res,
      'You do not have permission to update this notification',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const updated = await notificationService.markAsRead(validatedData.notificationId);

  return ApiResponse.success(res, {
    notification: {
      id: updated!._id,
      read: updated!.read,
      readAt: updated!.readAt,
    },
  });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await notificationService.markAllAsRead(userId);

  return ApiResponse.success(res, {
    modifiedCount: result.modifiedCount,
  });
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = deleteNotificationSchema.parse({ notificationId: req.params.notificationId });

  const notification = await notificationService.getNotificationById(validatedData.notificationId);

  if (!notification) {
    return ApiResponse.error(res, 'Notification not found', 'NOT_FOUND', 404);
  }

  // Authorization
  if (notification.userId.toString() !== req.user!.id && req.user!.role !== 'ADMIN') {
    return ApiResponse.error(
      res,
      'You do not have permission to delete this notification',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  await notificationService.deleteNotification(validatedData.notificationId);

  return ApiResponse.success(res, {}, 'Notification deleted successfully');
});

export const deleteAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await notificationService.deleteUserNotifications(userId);

  return ApiResponse.success(res, {
    deletedCount: result.deletedCount,
  });
});
