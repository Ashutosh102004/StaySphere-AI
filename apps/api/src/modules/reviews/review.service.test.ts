import { ReviewService } from '@/modules/reviews/review.service';
import { Review } from '@/modules/reviews/review.model';
import { Property } from '@/modules/properties/property.model';
import { Booking } from '@/modules/bookings/booking.model';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('@/modules/reviews/review.model');
jest.mock('@/modules/properties/property.model');
jest.mock('@/modules/bookings/booking.model');

describe('ReviewService', () => {
  let service: ReviewService;

  const mockUserId = '653a1b2c3d4e5f6a7b8c9d0e';
  const mockPropertyId = '653a1b2c3d4e5f6a7b8c9d0f';
  const mockBookingId = '653a1b2c3d4e5f6a7b8c9d10';

  const mockBooking = {
    _id: mockBookingId,
    propertyId: new mongoose.Types.ObjectId(mockPropertyId),
    guestId: new mongoose.Types.ObjectId(mockUserId),
    status: 'COMPLETED',
  };

  const mockReview = {
    _id: '653a1b2c3d4e5f6a7b8c9d11',
    propertyId: new mongoose.Types.ObjectId(mockPropertyId),
    userId: new mongoose.Types.ObjectId(mockUserId),
    bookingId: new mongoose.Types.ObjectId(mockBookingId),
    rating: 5,
    comment: 'Excellent stay!',
    save: jest.fn(),
  };

  beforeEach(() => {
    service = new ReviewService();
    jest.clearAllMocks();
    // updatePropertyRating is called from create/update/delete; default to empty
    // so it takes the "no reviews" branch unless a test overrides it.
    (Review.find as jest.Mock).mockResolvedValue([]);
    (Property.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);
  });

  describe('createReview', () => {
    it('should create a review for a completed booking', async () => {
      (Booking.findOne as jest.Mock).mockResolvedValue(mockBooking);
      (Review.findOne as jest.Mock).mockResolvedValue(null);
      (Review.create as jest.Mock).mockResolvedValue(mockReview);

      const result = await service.createReview(mockUserId, {
        propertyId: mockPropertyId,
        bookingId: mockBookingId,
        rating: 5,
        comment: 'Excellent stay!',
      });

      expect(result).toEqual(mockReview);
      expect(Booking.findOne).toHaveBeenCalledWith({
        _id: mockBookingId,
        guestId: new mongoose.Types.ObjectId(mockUserId),
      });
      expect(Review.create).toHaveBeenCalledWith({
        propertyId: new mongoose.Types.ObjectId(mockPropertyId),
        userId: new mongoose.Types.ObjectId(mockUserId),
        bookingId: new mongoose.Types.ObjectId(mockBookingId),
        rating: 5,
        comment: 'Excellent stay!',
      });
    });

    it('should reject when booking not found or does not belong to user', async () => {
      (Booking.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createReview(mockUserId, {
          propertyId: mockPropertyId,
          bookingId: mockBookingId,
          rating: 5,
        })
      ).rejects.toThrow('Booking not found or does not belong to you');
    });

    it('should reject when booking is not completed', async () => {
      (Booking.findOne as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: 'CONFIRMED',
      });

      await expect(
        service.createReview(mockUserId, {
          propertyId: mockPropertyId,
          bookingId: mockBookingId,
          rating: 5,
        })
      ).rejects.toThrow('You can only review completed bookings');
    });

    it('should reject when property does not match booking', async () => {
      (Booking.findOne as jest.Mock).mockResolvedValue(mockBooking);

      await expect(
        service.createReview(mockUserId, {
          propertyId: 'different-property-id',
          bookingId: mockBookingId,
          rating: 5,
        })
      ).rejects.toThrow('Property does not match the booking');
    });

    it('should reject when review already exists for booking', async () => {
      (Booking.findOne as jest.Mock).mockResolvedValue(mockBooking);
      (Review.findOne as jest.Mock).mockResolvedValue({ _id: 'existing-review' });

      await expect(
        service.createReview(mockUserId, {
          propertyId: mockPropertyId,
          bookingId: mockBookingId,
          rating: 5,
        })
      ).rejects.toThrow('You have already reviewed this booking');
    });
  });

  describe('updatePropertyRating', () => {
    it('should update property rating with reviews', async () => {
      (Review.find as jest.Mock).mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
      ]);

      await service.updatePropertyRating(mockPropertyId);

      expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPropertyId,
        { rating: 4.0, reviewCount: 3 }
      );
    });

    it('should clear rating when no reviews exist', async () => {
      (Review.find as jest.Mock).mockResolvedValue([]);

      await service.updatePropertyRating(mockPropertyId);

      expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPropertyId,
        { rating: undefined, reviewCount: 0 }
      );
    });
  });

  describe('getReviewById', () => {
    it('should return review with populated fields', async () => {
      const populatedReview = { ...mockReview };
      (Review.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(populatedReview),
          }),
        }),
      });

      const result = await service.getReviewById(mockReview._id);

      expect(result).toEqual(populatedReview);
      expect(Review.findById).toHaveBeenCalledWith(mockReview._id);
    });

    it('should return null when review not found', async () => {
      (Review.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      const result = await service.getReviewById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getReviewsByProperty', () => {
    it('should return paginated reviews with average rating', async () => {
      const reviews = [{ rating: 5 }];
      (Review.find as jest.Mock)
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(reviews),
        })
        .mockResolvedValue([{ rating: 5 }]);
      (Review.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.getReviewsByProperty(mockPropertyId);

      expect(result.reviews).toEqual(reviews);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.averageRating).toBe(5.0);
    });

    it('should filter by minimum rating', async () => {
      (Review.find as jest.Mock)
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([{ rating: 5 }]),
        })
        .mockResolvedValue([{ rating: 5 }]);
      (Review.countDocuments as jest.Mock).mockResolvedValue(1);

      await service.getReviewsByProperty(mockPropertyId, 1, 20, 4);

      expect(Review.find).toHaveBeenCalledWith(
        expect.objectContaining({ rating: { $gte: 4 } })
      );
    });
  });

  describe('getReviewsByUser', () => {
    it('should return paginated reviews by user', async () => {
      (Review.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockReview]),
      });
      (Review.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.getReviewsByUser(mockUserId);

      expect(result.reviews).toEqual([mockReview]);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('updateReview', () => {
    it('should update review rating and comment', async () => {
      (Review.findOne as jest.Mock).mockResolvedValue(mockReview);

      const result = await service.updateReview(mockReview._id, mockUserId, {
        rating: 4,
        comment: 'Updated comment',
      });

      expect(result).toEqual(mockReview);
      expect(mockReview.rating).toBe(4);
      expect(mockReview.comment).toBe('Updated comment');
      expect(mockReview.save).toHaveBeenCalled();
    });

    it('should return null when review not found', async () => {
      (Review.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.updateReview('nonexistent', mockUserId, {
        rating: 4,
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteReview', () => {
    it('should delete review when user is owner', async () => {
      (Review.findById as jest.Mock).mockResolvedValue(mockReview);
      (Review.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await service.deleteReview(mockReview._id, mockUserId, 'GUEST');

      expect(result).toBe(true);
      expect(Review.deleteOne).toHaveBeenCalledWith({ _id: mockReview._id });
    });

    it('should delete review when user is admin', async () => {
      (Review.findById as jest.Mock).mockResolvedValue(mockReview);
      (Review.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await service.deleteReview(mockReview._id, 'different-user', 'ADMIN');

      expect(result).toBe(true);
    });

    it('should reject when user is not owner or admin', async () => {
      (Review.findById as jest.Mock).mockResolvedValue(mockReview);

      await expect(
        service.deleteReview(mockReview._id, 'different-user', 'GUEST')
      ).rejects.toThrow('You do not have permission to delete this review');
    });

    it('should return false when review not found', async () => {
      (Review.findById as jest.Mock).mockResolvedValue(null);

      const result = await service.deleteReview('nonexistent', mockUserId, 'GUEST');

      expect(result).toBe(false);
    });
  });

  describe('canUserReviewBooking', () => {
    it('should return true for completed booking without review', async () => {
      (Booking.findOne as jest.Mock).mockResolvedValue(mockBooking);
      (Review.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.canUserReviewBooking(mockUserId, mockBookingId);

      expect(result).toBe(true);
    });

    it('should return false when booking not found', async () => {
      (Booking.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.canUserReviewBooking(mockUserId, mockBookingId);

      expect(result).toBe(false);
    });

    it('should return false when review already exists', async () => {
      (Booking.findOne as jest.Mock).mockResolvedValue(mockBooking);
      (Review.findOne as jest.Mock).mockResolvedValue({ _id: 'existing-review' });

      const result = await service.canUserReviewBooking(mockUserId, mockBookingId);

      expect(result).toBe(false);
    });

    it('should return false for non-completed booking', async () => {
      (Booking.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.canUserReviewBooking(mockUserId, mockBookingId);

      expect(result).toBe(false);
    });
  });

  describe('getReviewStats', () => {
    it('should return review statistics', async () => {
      (Review.find as jest.Mock).mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
        { rating: 4 },
      ]);

      const result = await service.getReviewStats(mockPropertyId);

      expect(result.totalReviews).toBe(5);
      expect(result.averageRating).toBe(4.2);
      expect(result.ratingDistribution).toEqual({
        1: 0, 2: 0, 3: 1, 4: 2, 5: 2,
      });
    });

    it('should return zero stats when no reviews exist', async () => {
      (Review.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getReviewStats(mockPropertyId);

      expect(result.totalReviews).toBe(0);
      expect(result.averageRating).toBe(0);
      expect(result.ratingDistribution).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
      });
    });
  });
});