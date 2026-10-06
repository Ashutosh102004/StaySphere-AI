import { Review, IReview } from './review.model';
import { Property } from '../properties/property.model';
import { Booking } from '../bookings/booking.model';
import { CreateReviewInput, UpdateReviewInput } from './review.validation';
import mongoose from 'mongoose';

export class ReviewService {
  async createReview(
    userId: string,
    data: CreateReviewInput
  ): Promise<IReview> {
    // Verify booking exists and belongs to the user
    const booking = await Booking.findOne({
      _id: data.bookingId,
      guestId: new mongoose.Types.ObjectId(userId),
    });

    if (!booking) {
      throw new Error('Booking not found or does not belong to you');
    }

    // Check if booking is completed
    if (booking.status !== 'COMPLETED') {
      throw new Error('You can only review completed bookings');
    }

    // Verify property matches the booking
    if (booking.propertyId.toString() !== data.propertyId) {
      throw new Error('Property does not match the booking');
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ bookingId: data.bookingId });
    if (existingReview) {
      throw new Error('You have already reviewed this booking');
    }

    // Create review
    const review = await Review.create({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      userId: new mongoose.Types.ObjectId(userId),
      bookingId: new mongoose.Types.ObjectId(data.bookingId),
      rating: data.rating,
      comment: data.comment,
    });

    // Update property rating
    await this.updatePropertyRating(data.propertyId);

    return review;
  }

  async updatePropertyRating(propertyId: string): Promise<void> {
    const reviews = await Review.find({
      propertyId: new mongoose.Types.ObjectId(propertyId),
    });

    if (reviews.length === 0) {
      await Property.findByIdAndUpdate(propertyId, {
        rating: undefined,
        reviewCount: 0,
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Property.findByIdAndUpdate(propertyId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount: reviews.length,
    });
  }

  async getReviewById(reviewId: string): Promise<IReview | null> {
    const review = await Review.findById(reviewId)
      .populate('propertyId', 'title location')
      .populate('userId', 'email')
      .populate('bookingId', 'checkIn checkOut');

    return review;
  }

  async getReviewsByProperty(
    propertyId: string,
    page: number = 1,
    limit: number = 20,
    minRating?: number
  ): Promise<{ reviews: IReview[]; total: number; totalPages: number; averageRating: number }> {
    const skip = (page - 1) * limit;
    const query: { propertyId: mongoose.Types.ObjectId; rating?: { $gte: number } } = {
      propertyId: new mongoose.Types.ObjectId(propertyId),
    };

    if (minRating) {
      query.rating = { $gte: minRating };
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('userId', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query),
    ]);

    // Calculate average rating
    const allReviews = await Review.find({
      propertyId: new mongoose.Types.ObjectId(propertyId),
    });
    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    return {
      reviews,
      total,
      totalPages: Math.ceil(total / limit),
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  async getReviewsByUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: IReview[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ userId: new mongoose.Types.ObjectId(userId) })
        .populate('propertyId', 'title location pricePerNight images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
    ]);

    return {
      reviews,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateReview(
    reviewId: string,
    userId: string,
    data: UpdateReviewInput
  ): Promise<IReview | null> {
    const review = await Review.findOne({
      _id: reviewId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!review) {
      return null;
    }

    if (data.rating !== undefined) {
      review.rating = data.rating;
    }

    if (data.comment !== undefined) {
      review.comment = data.comment;
    }

    await review.save();

    // Update property rating
    await this.updatePropertyRating(review.propertyId.toString());

    return review;
  }

  async deleteReview(reviewId: string, userId: string, userRole: string): Promise<boolean> {
    const review = await Review.findById(reviewId);

    if (!review) {
      return false;
    }

    // Only the review author or admin can delete
    const isOwner = review.userId.toString() === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new Error('You do not have permission to delete this review');
    }

    const propertyId = review.propertyId.toString();
    await Review.deleteOne({ _id: reviewId });

    // Update property rating
    await this.updatePropertyRating(propertyId);

    return true;
  }

  async canUserReviewBooking(userId: string, bookingId: string): Promise<boolean> {
    const booking = await Booking.findOne({
      _id: bookingId,
      guestId: new mongoose.Types.ObjectId(userId),
      status: 'COMPLETED',
    });

    if (!booking) {
      return false;
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId });
    return !existingReview;
  }

  async getReviewStats(propertyId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const reviews = await Review.find({
      propertyId: new mongoose.Types.ObjectId(propertyId),
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const ratingDistribution: { [key: number]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((review) => {
      ratingDistribution[review.rating]++;
    });

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    };
  }
}
