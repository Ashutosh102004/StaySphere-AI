import { Request, Response } from 'express';
import { ReviewService } from './review.service';
import { createReviewSchema, updateReviewSchema } from './review.validation';
import { asyncHandler } from '@/utils/async-handler';
import { ApiResponse } from '@/utils/response';

const reviewService = new ReviewService();

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createReviewSchema.parse(req.body);
  const review = await reviewService.createReview(req.user!.id, validatedData);

  return ApiResponse.success(
    res,
    {
      review: {
        id: review._id,
        propertyId: review.propertyId,
        bookingId: review.bookingId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      },
    },
    'Review submitted successfully',
    201
  );
});

export const getReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const review = await reviewService.getReviewById(id);

  if (!review) {
    return ApiResponse.error(res, 'Review not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, { review });
});

export const getPropertyReviews = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const minRating = req.query.minRating ? parseInt(req.query.minRating as string) : undefined;

  const result = await reviewService.getReviewsByProperty(
    propertyId,
    page,
    limit,
    minRating
  );

  return ApiResponse.success(res, {
    reviews: result.reviews,
    averageRating: result.averageRating,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

export const getMyReviews = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await reviewService.getReviewsByUser(req.user!.id, page, limit);

  return ApiResponse.success(res, {
    reviews: result.reviews,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateReviewSchema.parse(req.body);

  const review = await reviewService.updateReview(id, req.user!.id, validatedData);

  if (!review) {
    return ApiResponse.error(
      res,
      'Review not found or you do not have permission to edit it',
      'NOT_FOUND',
      404
    );
  }

  return ApiResponse.success(res, { review }, 'Review updated successfully');
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await reviewService.deleteReview(id, req.user!.id, req.user!.role);

  if (!deleted) {
    return ApiResponse.error(res, 'Review not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, null, 'Review deleted successfully');
});

export const getReviewStats = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params;

  const stats = await reviewService.getReviewStats(propertyId);

  return ApiResponse.success(res, { stats });
});

export const canReviewBooking = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  const canReview = await reviewService.canUserReviewBooking(req.user!.id, bookingId);

  return ApiResponse.success(res, { canReview });
});