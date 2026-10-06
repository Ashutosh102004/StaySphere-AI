import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '@/utils/response';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  void next;
  console.error('Error:', err);

  if (err instanceof ZodError) {
    return ApiResponse.validationError(res, err.errors);
  }

  if (err instanceof Error) {
    if (err.message === 'Email already registered') {
      return ApiResponse.error(res, err.message, 'CONFLICT', 409);
    }

    if (err.message === 'Invalid email or password') {
      return ApiResponse.error(res, err.message, 'AUTHENTICATION_ERROR', 401);
    }

    if (err.message === 'Invalid token' || err.message === 'Invalid refresh token') {
      return ApiResponse.error(res, err.message, 'AUTHENTICATION_ERROR', 401);
    }

    if (err.message === 'User not found') {
      return ApiResponse.error(res, err.message, 'NOT_FOUND', 404);
    }

    // Handle business logic errors that should return 400
    if (
      err.message.includes('Cannot confirm booking in') &&
      err.message.includes('status. Must be in PENDING status.')
    ) {
      return ApiResponse.error(res, err.message, 'BAD_REQUEST', 400);
    }

    if (
      err.message.includes('Cannot complete booking in') &&
      err.message.includes('status. Must be in CONFIRMED status.')
    ) {
      return ApiResponse.error(res, err.message, 'BAD_REQUEST', 400);
    }

    if (err.message === 'Only the host or admin can update booking status') {
      return ApiResponse.error(res, err.message, 'FORBIDDEN', 403);
    }

    if (err.message === 'Only the guest can confirm this booking') {
      return ApiResponse.error(res, err.message, 'FORBIDDEN', 403);
    }

    if (err.message === 'Only the host or admin can complete this booking') {
      return ApiResponse.error(res, err.message, 'FORBIDDEN', 403);
    }

    if (err.message === 'Property not found or not available for booking') {
      return ApiResponse.error(res, err.message, 'NOT_FOUND', 404);
    }

    if (err.message === 'Property can accommodate maximum') {
      return ApiResponse.error(res, err.message, 'BAD_REQUEST', 400);
    }

    if (err.message === 'Property is not available for the selected dates') {
      return ApiResponse.error(res, err.message, 'BAD_REQUEST', 400);
    }

    if (
      err.message === 'Invalid stay duration' ||
      err.message === 'Lead time requirement not met' ||
      err.message === 'Advance notice requirement not met'
    ) {
      return ApiResponse.error(res, err.message, 'BAD_REQUEST', 400);
    }

    if (err.message === 'You do not have permission to delete this review') {
      return ApiResponse.error(res, err.message, 'FORBIDDEN', 403);
    }

    if (err.message === 'Booking not found or does not belong to you') {
      return ApiResponse.error(res, err.message, 'BAD_REQUEST', 400);
    }

    if (err.message === 'You can only review completed bookings') {
      return ApiResponse.error(res, err.message, 'BAD_REQUEST', 400);
    }

    if (err.message === 'Property does not match the booking') {
      return ApiResponse.error(res, err.message, 'BAD_REQUEST', 400);
    }

    if (err.message === 'You have already reviewed this booking') {
      return ApiResponse.error(res, err.message, 'BAD_REQUEST', 400);
    }
  }

  return ApiResponse.error(res, 'Internal server error', 'INTERNAL_SERVER_ERROR', 500);
};
