import { User, IUser } from '../users/user.model';
import { Property } from '../properties/property.model';
import { Booking, IBooking } from '../bookings/booking.model';
import { Review } from '../reviews/review.model';
import { IProperty } from '../properties/property.model';
import { FilterQuery } from 'mongoose';
import {
  UpdateUserRoleInput,
  UpdateUserStatusInput,
  PropertyModerationInput,
  GetAnalyticsInput,
} from './admin.validation';

export class AdminService {
  // ========== User Management ==========

  async getAllUsers(
    page: number = 1,
    limit: number = 20,
    role?: string,
    search?: string
  ): Promise<{ users: IUser[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IUser> = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return {
      users,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string): Promise<IUser | null> {
    const user = await User.findById(userId).select('-passwordHash');
    return user;
  }

  async updateUserRole(data: UpdateUserRoleInput): Promise<IUser | null> {
    const user = await User.findByIdAndUpdate(
      data.userId,
      { role: data.role },
      { new: true }
    ).select('-passwordHash');

    return user;
  }

  async updateUserStatus(data: UpdateUserStatusInput): Promise<IUser | null> {
    const updateData: Partial<IUser> = {};
    if (data.emailVerified !== undefined) {
      updateData.emailVerified = data.emailVerified;
    }

    const user = await User.findByIdAndUpdate(
      data.userId,
      updateData,
      { new: true }
    ).select('-passwordHash');

    return user;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user) return false;

    // Prevent deleting the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
    }

    // Delete user's properties
    await Property.deleteMany({ hostId: userId });

    // Delete user's bookings
    await Booking.deleteMany({ guestId: userId });

    // Delete user's reviews
    await Review.deleteMany({ userId: userId });

    // Delete the user
    const result = await User.deleteOne({ _id: userId });
    return result.deletedCount > 0;
  }

  // ========== Property Moderation ==========

  async getAllProperties(
    page: number = 1,
    limit: number = 20,
    status?: 'published' | 'unpublished' | 'hidden',
    search?: string
  ) {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IProperty> = {};

    if (status === 'published') {
      query.published = true;
      query.hidden = false;
    } else if (status === 'unpublished') {
      query.published = false;
    } else if (status === 'hidden') {
      query.hidden = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
      ];
    }

    const [properties, total] = await Promise.all([
      Property.find(query)
        .populate('hostId', 'email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Property.countDocuments(query),
    ]);

    return {
      properties,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async moderateProperty(
    data: PropertyModerationInput
  ) {
    const property = await Property.findById(data.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    let update: Partial<IProperty> & { hidden?: boolean } = {};

    switch (data.action) {
      case 'approve':
        update = { published: true, hidden: false };
        break;
      case 'reject':
        update = { published: false, hidden: true };
        break;
      case 'hide':
        update = { hidden: true };
        break;
      case 'unhide':
        update = { hidden: false };
        break;
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      data.propertyId,
      update,
      { new: true }
    ).populate('hostId', 'email');

    return updatedProperty;
  }

  async deleteProperty(propertyId: string): Promise<boolean> {
    // Delete associated bookings, reviews, etc.
    await Booking.deleteMany({ propertyId });
    await Review.deleteMany({ propertyId });

    const result = await Property.deleteOne({ _id: propertyId });
    return result.deletedCount > 0;
  }

  // ========== Booking Oversight ==========

  async getAllBookings(
    page: number = 1,
    limit: number = 20,
    status?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IBooking> = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('propertyId', 'title location')
        .populate('guestId', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

    return {
      bookings,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async forceCancelBooking(
    bookingId: string,
    reason?: string
  ): Promise<IBooking | null> {
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'CANCELLED' as const,
        cancellationReason: reason || 'Cancelled by admin',
      },
      { new: true }
    );

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  }

  // ========== System Analytics ==========

  async getAnalytics(data: GetAnalyticsInput) {
    const { startDate, endDate } = data;
    // period parameter reserved for future detailed analytics

    // Build date filter
    const now = new Date();
    const dateFilter: { $gte: Date; $lte?: Date } = {
      $gte: startDate
        ? new Date(startDate)
        : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      ...(endDate ? { $lte: new Date(endDate) } : {}),
    };

    // Get counts
    const [
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue,
      activeHosts,
      newUsersThisMonth,
      newPropertiesThisMonth,
      bookingsThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments({ published: true }),
      Booking.countDocuments({ status: 'COMPLETED' }),
      Booking.aggregate([
        { $match: { status: 'COMPLETED', createdAt: dateFilter } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      User.countDocuments({ role: 'HOST' }),
      User.countDocuments({
        role: { $in: ['HOST', 'ADMIN', 'SUPPORT'] },
        createdAt: dateFilter,
      }),
      Property.countDocuments({ createdAt: dateFilter }),
      Booking.countDocuments({ createdAt: dateFilter }),
    ]);

    // Get booking status distribution
    const bookingStatusDistribution = await Booking.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Get property distribution by city
    const propertyDistribution = await Property.aggregate([
      { $group: { _id: '$location.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get average property rating
    const averagePropertyRating = await Property.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);

    return {
      overview: {
        totalUsers,
        totalProperties,
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        activeHosts,
      },
      growth: {
        newUsers: newUsersThisMonth,
        newProperties: newPropertiesThisMonth,
        bookingsThisMonth,
      },
      bookingStatus: bookingStatusDistribution.reduce(
        (acc: Record<string, number>, item) => {
          acc[item._id] = item.count;
          return acc;
        },
        {} as Record<string, number>
      ),
      propertyDistribution,
      averagePropertyRating:
        averagePropertyRating[0]?.avgRating?.toFixed(1) || 'N/A',
      dateRange: {
        from: dateFilter.$gte,
        to: dateFilter.$lte || now,
      },
    };
  }

  // ========== Dashboard Stats ==========

  async getDashboardStats() {
    const [
      totalUsers,
      totalHosts,
      totalProperties,
      publishedProperties,
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      totalReviews,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'HOST' }),
      Property.countDocuments(),
      Property.countDocuments({ published: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'COMPLETED' }),
      Booking.countDocuments({ status: 'PENDING' }),
      Booking.countDocuments({ status: 'CANCELLED' }),
      Review.countDocuments(),
    ]);

    // Calculate revenue from completed bookings
    const revenueResult = await Booking.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    return {
      users: {
        total: totalUsers,
        hosts: totalHosts,
      },
      properties: {
        total: totalProperties,
        published: publishedProperties,
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        pending: pendingBookings,
        cancelled: cancelledBookings,
      },
      reviews: {
        total: totalReviews,
      },
      revenue: {
        total: revenueResult[0]?.total || 0,
      },
    };
  }
}