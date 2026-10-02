import { Booking, IBooking } from './booking.model';
import { Property } from '../properties/property.model';
import { CreateBookingInput } from './booking.validation';
import mongoose from 'mongoose';

export class BookingService {
  async createBooking(
    guestId: string,
    data: CreateBookingInput
  ): Promise<IBooking> {
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);

    // Verify property exists and is published
    const property = await Property.findOne({
      _id: data.propertyId,
      published: true,
    });

    if (!property) {
      throw new Error('Property not found or not available for booking');
    }

    // Check if guest count exceeds property capacity
    if (data.guests > property.maxGuests) {
      throw new Error(
        `Property can accommodate maximum ${property.maxGuests} guests`
      );
    }

    // Check for booking conflicts
    const hasConflict = await this.checkDateConflict(
      data.propertyId,
      checkIn,
      checkOut
    );

    if (hasConflict) {
      throw new Error('Property is not available for the selected dates');
    }

    // Calculate total price
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = nights * property.pricePerNight;

    // Create booking
    const booking = await Booking.create({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      guestId: new mongoose.Types.ObjectId(guestId),
      checkIn,
      checkOut,
      guests: data.guests,
      totalPrice,
      status: 'PENDING',
      guestDetails: data.guestDetails,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes to complete payment
    });

    return booking;
  }

  async checkDateConflict(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const query: any = {
      propertyId: new mongoose.Types.ObjectId(propertyId),
      status: { $in: ['PENDING', 'CONFIRMED'] },
      $or: [
        // New booking starts during existing booking
        { checkIn: { $lte: checkIn }, checkOut: { $gt: checkIn } },
        // New booking ends during existing booking
        { checkIn: { $lt: checkOut }, checkOut: { $gte: checkOut } },
        // New booking encompasses existing booking
        { checkIn: { $gte: checkIn }, checkOut: { $lte: checkOut } },
      ],
    };

    if (excludeBookingId) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
    }

    const conflictingBooking = await Booking.findOne(query);
    return !!conflictingBooking;
  }

  async getBookingById(
    bookingId: string,
    userId?: string
  ): Promise<IBooking | null> {
    const query: any = { _id: bookingId };

    const booking = await Booking.findOne(query)
      .populate('propertyId', 'title location pricePerNight images')
      .populate('guestId', 'email');

    // Authorization check: only guest, host, or admin can view
    if (booking && userId) {
      const property = await Property.findById(booking.propertyId);
      const isGuest = booking.guestId.toString() === userId;
      const isHost = property?.hostId.toString() === userId;

      if (!isGuest && !isHost) {
        return null; // Will be caught by controller for admin check
      }
    }

    return booking;
  }

  async getBookingsByGuest(
    guestId: string,
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{ bookings: IBooking[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const query: any = { guestId: new mongoose.Types.ObjectId(guestId) };

    if (status) {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('propertyId', 'title location pricePerNight images')
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

  async getBookingsByHost(
    hostId: string,
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{ bookings: IBooking[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    // Find all properties owned by this host
    const hostProperties = await Property.find({
      hostId: new mongoose.Types.ObjectId(hostId),
    }).select('_id');

    const propertyIds = hostProperties.map((p) => p._id);

    const query: any = { propertyId: { $in: propertyIds } };

    if (status) {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('propertyId', 'title location pricePerNight')
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

  async updateBookingStatus(
    bookingId: string,
    status: string,
    userId: string,
    userRole: string
  ): Promise<IBooking | null> {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return null;
    }

    // Authorization: only host or admin can confirm/complete
    if (status === 'CONFIRMED' || status === 'COMPLETED') {
      const property = await Property.findById(booking.propertyId);
      const isHost = property?.hostId.toString() === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isHost && !isAdmin) {
        throw new Error('Only the host or admin can update booking status');
      }
    }

    booking.status = status as any;
    await booking.save();

    return booking;
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    userRole: string,
    cancellationReason?: string
  ): Promise<IBooking | null> {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return null;
    }

    // Can't cancel if already cancelled or completed
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new Error(`Cannot cancel a ${booking.status.toLowerCase()} booking`);
    }

    // Authorization: guest, host, or admin can cancel
    const property = await Property.findById(booking.propertyId);
    const isGuest = booking.guestId.toString() === userId;
    const isHost = property?.hostId.toString() === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isGuest && !isHost && !isAdmin) {
      throw new Error('You do not have permission to cancel this booking');
    }

    booking.status = 'CANCELLED';
    booking.cancellationReason = cancellationReason;
    await booking.save();

    return booking;
  }

  async canUserAccessBooking(
    bookingId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    if (userRole === 'ADMIN') {
      return true;
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return false;
    }

    const isGuest = booking.guestId.toString() === userId;
    if (isGuest) {
      return true;
    }

    const property = await Property.findById(booking.propertyId);
    const isHost = property?.hostId.toString() === userId;

    return isHost;
  }

  async getPropertyAvailability(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ available: boolean; bookedDates: Date[] }> {
    const bookings = await Booking.find({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      status: { $in: ['PENDING', 'CONFIRMED'] },
      $or: [
        { checkIn: { $lte: endDate }, checkOut: { $gte: startDate } },
      ],
    }).select('checkIn checkOut');

    const bookedDates: Date[] = [];
    bookings.forEach((booking) => {
      const current = new Date(booking.checkIn);
      while (current < booking.checkOut) {
        bookedDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    });

    return {
      available: bookings.length === 0,
      bookedDates,
    };
  }
}
