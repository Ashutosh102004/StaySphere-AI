import { Notification, INotification } from './notification.model';
import { CreateNotificationInput } from './notification.validation';

export class NotificationService {
  async createNotification(data: CreateNotificationInput): Promise<INotification> {
    const notification = new Notification({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      read: false,
    });

    await notification.save();
    return notification;
  }

  async getNotificationById(notificationId: string): Promise<INotification | null> {
    return Notification.findById(notificationId);
  }

  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<{ notifications: INotification[]; total: number }> {
    const query: { userId: string; read?: boolean } = { userId };

    if (unreadOnly) {
      query.read = false;
    }

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    return { notifications, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      userId,
      read: false,
    });
  }

  async markAsRead(notificationId: string): Promise<INotification | null> {
    return Notification.findByIdAndUpdate(
      notificationId,
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );
  }

  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await Notification.updateMany(
      { userId, read: false },
      {
        read: true,
        readAt: new Date(),
      }
    );

    return { modifiedCount: result.modifiedCount };
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    const result = await Notification.findByIdAndDelete(notificationId);
    return !!result;
  }

  async deleteUserNotifications(userId: string): Promise<{ deletedCount: number }> {
    const result = await Notification.deleteMany({ userId });
    return { deletedCount: result.deletedCount };
  }

  async sendBookingNotification(
    userId: string,
    bookingId: string,
    type: 'BOOKING_CREATED' | 'BOOKING_CONFIRMED' | 'BOOKING_COMPLETED' | 'BOOKING_CANCELLED'
  ): Promise<INotification> {
    const titles: Record<string, string> = {
      BOOKING_CREATED: 'Booking Created',
      BOOKING_CONFIRMED: 'Booking Confirmed',
      BOOKING_COMPLETED: 'Booking Completed',
      BOOKING_CANCELLED: 'Booking Cancelled',
    };

    const messages: Record<string, string> = {
      BOOKING_CREATED: 'Your booking has been created successfully',
      BOOKING_CONFIRMED: 'Your booking has been confirmed',
      BOOKING_COMPLETED: 'Your booking has been completed',
      BOOKING_CANCELLED: 'Your booking has been cancelled',
    };

    return this.createNotification({
      userId,
      type,
      title: titles[type],
      message: messages[type],
      data: { bookingId },
    });
  }

  async sendPaymentNotification(
    userId: string,
    paymentId: string,
    status: 'PAYMENT_SUCCESSFUL' | 'PAYMENT_FAILED' | 'PAYMENT_REFUNDED'
  ): Promise<INotification> {
    const titles: Record<string, string> = {
      PAYMENT_SUCCESSFUL: 'Payment Successful',
      PAYMENT_FAILED: 'Payment Failed',
      PAYMENT_REFUNDED: 'Payment Refunded',
    };

    const messages: Record<string, string> = {
      PAYMENT_SUCCESSFUL: 'Your payment has been processed successfully',
      PAYMENT_FAILED: 'Your payment could not be processed',
      PAYMENT_REFUNDED: 'Your payment has been refunded',
    };

    return this.createNotification({
      userId,
      type: status,
      title: titles[status],
      message: messages[status],
      data: { paymentId },
    });
  }

  async sendPropertyNotification(
    userId: string,
    propertyId: string,
    type: 'PROPERTY_PUBLISHED' | 'PROPERTY_UNPUBLISHED' | 'PROPERTY_FLAGGED'
  ): Promise<INotification> {
    const titles: Record<string, string> = {
      PROPERTY_PUBLISHED: 'Property Published',
      PROPERTY_UNPUBLISHED: 'Property Unpublished',
      PROPERTY_FLAGGED: 'Property Flagged',
    };

    const messages: Record<string, string> = {
      PROPERTY_PUBLISHED: 'Your property has been published',
      PROPERTY_UNPUBLISHED: 'Your property has been unpublished',
      PROPERTY_FLAGGED: 'Your property has been flagged for review',
    };

    return this.createNotification({
      userId,
      type,
      title: titles[type],
      message: messages[type],
      data: { propertyId },
    });
  }

  async sendReviewNotification(
    userId: string,
    reviewId: string,
    authorName: string
  ): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'REVIEW_RECEIVED',
      title: 'New Review',
      message: `${authorName} left a review on your property`,
      data: { reviewId, authorName },
    });
  }

  async sendAvailabilityNotification(
    userId: string,
    propertyId: string,
    message: string
  ): Promise<INotification> {
    return this.createNotification({
      userId,
      type: 'AVAILABILITY_UPDATED',
      title: 'Availability Updated',
      message,
      data: { propertyId },
    });
  }
}
