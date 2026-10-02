import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '@/utils/response';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    return ApiResponse.validationError(res, err.errors);
  }

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

  return ApiResponse.error(res, 'Internal server error', 'INTERNAL_SERVER_ERROR', 500);
};
