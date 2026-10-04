import { Wishlist, IWishlist } from './wishlist.model';
import { Property } from '../properties/property.model';
import { AddToWishlistInput, RemoveFromWishlistInput } from './wishlist.validation';

export class WishlistService {
  async addToWishlist(userId: string, data: AddToWishlistInput): Promise<IWishlist> {
    // Verify property exists
    const property = await Property.findById(data.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
      userId,
      propertyId: data.propertyId,
    });

    if (existing) {
      throw new Error('Property already in wishlist');
    }

    const wishlistItem = new Wishlist({
      userId,
      propertyId: data.propertyId,
    });

    await wishlistItem.save();
    return wishlistItem;
  }

  async removeFromWishlist(userId: string, data: RemoveFromWishlistInput): Promise<boolean> {
    const result = await Wishlist.findOneAndDelete({
      userId,
      propertyId: data.propertyId,
    });

    return !!result;
  }

  async getUserWishlist(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    sort: 'newest' | 'oldest' = 'newest'
  ): Promise<{ items: IWishlist[]; total: number }> {
    const sortOrder = sort === 'newest' ? -1 : 1;

    const total = await Wishlist.countDocuments({ userId });
    const items = await Wishlist.find({ userId })
      .populate('propertyId', 'title price location images rating')
      .sort({ createdAt: sortOrder })
      .limit(limit)
      .skip(offset);

    return { items, total };
  }

  async isInWishlist(userId: string, propertyId: string): Promise<boolean> {
    const item = await Wishlist.findOne({
      userId,
      propertyId,
    });

    return !!item;
  }

  async getWishlistCount(userId: string): Promise<number> {
    return Wishlist.countDocuments({ userId });
  }

  async clearWishlist(userId: string): Promise<{ deletedCount: number }> {
    const result = await Wishlist.deleteMany({ userId });
    return { deletedCount: result.deletedCount };
  }

  async getWishlistItems(userId: string): Promise<string[]> {
    const items = await Wishlist.find({ userId }, 'propertyId');
    return items.map(item => item.propertyId.toString());
  }

  async getUsersWishlistingProperty(propertyId: string): Promise<string[]> {
    const items = await Wishlist.find({ propertyId }, 'userId');
    return items.map(item => item.userId.toString());
  }

  async getWishlistStats(): Promise<{
    totalWishlists: number;
    avgItemsPerUser: number;
    mostWishlisted: Array<{ propertyId: string; count: number }>;
  }> {
    const totalWishlists = await Wishlist.countDocuments();

    const userStats = await Wishlist.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          avgCount: { $avg: '$count' },
        },
      },
    ]);

    const avgItemsPerUser = userStats[0]?.avgCount || 0;

    const mostWishlisted = await Wishlist.aggregate([
      {
        $group: {
          _id: '$propertyId',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          propertyId: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    return {
      totalWishlists,
      avgItemsPerUser,
      mostWishlisted: mostWishlisted as Array<{ propertyId: string; count: number }>,
    };
  }
}
