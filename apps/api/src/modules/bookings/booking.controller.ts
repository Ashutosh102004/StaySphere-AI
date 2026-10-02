import { Request, Response } from 'express';
import { BookingService } from './booking.service';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  cancelBookingSchema,
} from './booking.validation';
import { asyncHandler } from '@/utils/async-handler';
import { ApiResponse } from '@/utils/response';

const bookingService = new BookingService();

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createBookingSchema.parse(req.body);
  const booking = await bookingService.createBooking(req.user!.id, validatedData);

  return ApiResponse.success(
    res,
    {
      booking: {
        id: booking._id,
        propertyId: booking.propertyId,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        status: booking.status,
        expiresAt: booking.expiresAt,
        guestDetails: booking.guestDetails,
        createdAt: booking.createdAt,
      },
    },
    'Booking created successfully. Please complete payment within 15 minutes.',
    201
  );
});

export const getBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const canAccess = await bookingService.canUserAccessBooking(
    id,
    req.user!.id,
    req.user!.role
  );

  if (!canAccess) {
    return ApiResponse.error(
      res,
      'You do not have permission to view this booking',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const booking = await bookingService.getBookingById(id, req.user!.id);

  if (!booking) {
    return ApiResponse.error(res, 'Booking not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, { booking });
});

export const getMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;

  const result = await bookingService.getBookingsByGuest(
    req.user!.id,
    page,
    limit,
    status
  );

  return ApiResponse.success(res, {
    bookings: result.bookings,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

export const getHostBookings = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;

  const result = await bookingService.getBookingsByHost(
    req.user!.id,
    page,
    limit,
    status
  );

  return ApiResponse.success(res, {
    bookings: result.bookings,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

export const updateBookingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = updateBookingStatusSchema.parse(req.body);

    const booking = await bookingService.updateBookingStatus(
      id,
      status,
      req.user!.id,
      req.user!.role
    );

    if (!booking) {
      return ApiResponse.error(res, 'Booking not found', 'NOT_FOUND', 404);
    }

    return ApiResponse.success(
      res,
      { booking },
      `Booking status updated to ${status}`
    );
  }
);

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { cancellationReason } = cancelBookingSchema.parse(req.body);

  const booking = await bookingService.cancelBooking(
    id,
    req.user!.id,
    req.user!.role,
    cancellationReason
  );

  if (!booking) {
    return ApiResponse.error(res, 'Booking not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, { booking }, 'Booking cancelled successfully');
});

export const getPropertyAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const { propertyId } = req.params;
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return ApiResponse.error(
        res,
        'Invalid date format. Use ISO 8601 format.',
        'VALIDATION_ERROR',
        400
      );
    }

    if (endDate <= startDate) {
      return ApiResponse.error(
        res,
        'End date must be after start date',
        'VALIDATION_ERROR',
        400
      );
    }

    const availability = await bookingService.getPropertyAvailability(
      propertyId,
      startDate,
      endDate
    );

    return ApiResponse.success(res, {
      propertyId,
      startDate,
      endDate,
      available: availability.available,
      bookedDates: availability.bookedDates,
    });
  }
);
