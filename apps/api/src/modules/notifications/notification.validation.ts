import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.string().min(1, 'Notification type is required'),
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().min(1, 'Message is required').max(1000),
  data: z.record(z.unknown()).optional(),
});

export const markAsReadSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
});

export const markAllAsReadSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const getNotificationsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  limit: z.number().default(20).optional(),
  offset: z.number().default(0).optional(),
  unreadOnly: z.boolean().default(false).optional(),
});

export const deleteNotificationSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type MarkAllAsReadInput = z.infer<typeof markAllAsReadSchema>;
export type GetNotificationsInput = z.infer<typeof getNotificationsSchema>;
export type DeleteNotificationInput = z.infer<typeof deleteNotificationSchema>;
