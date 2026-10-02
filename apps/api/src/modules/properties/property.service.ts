import { Property, IProperty } from './property.model';
import { CreatePropertyInput, UpdatePropertyInput } from './property.validation';
import mongoose from 'mongoose';

export class PropertyService {
  async createProperty(
    hostId: string,
    data: CreatePropertyInput
  ): Promise<IProperty> {
    const property = await Property.create({
      ...data,
      hostId: new mongoose.Types.ObjectId(hostId),
      published: false,
      reviewCount: 0,
    });

    return property;
  }

  async getPropertyById(propertyId: string): Promise<IProperty | null> {
    const property = await Property.findById(propertyId).populate('hostId', 'email role');
    return property;
  }

  async getPublicPropertyById(propertyId: string): Promise<IProperty | null> {
    const property = await Property.findOne({
      _id: propertyId,
      published: true,
    }).populate('hostId', 'email');
    return property;
  }

  async getPropertiesByHost(
    hostId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ properties: IProperty[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      Property.find({ hostId: new mongoose.Types.ObjectId(hostId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Property.countDocuments({ hostId: new mongoose.Types.ObjectId(hostId) }),
    ]);

    return {
      properties,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateProperty(
    propertyId: string,
    hostId: string,
    data: UpdatePropertyInput
  ): Promise<IProperty | null> {
    const property = await Property.findOneAndUpdate(
      {
        _id: propertyId,
        hostId: new mongoose.Types.ObjectId(hostId),
      },
      data,
      { new: true, runValidators: true }
    );

    return property;
  }

  async deleteProperty(propertyId: string, hostId: string): Promise<boolean> {
    const result = await Property.deleteOne({
      _id: propertyId,
      hostId: new mongoose.Types.ObjectId(hostId),
    });

    return result.deletedCount > 0;
  }

  async publishProperty(
    propertyId: string,
    hostId: string,
    published: boolean
  ): Promise<IProperty | null> {
    const property = await Property.findOneAndUpdate(
      {
        _id: propertyId,
        hostId: new mongoose.Types.ObjectId(hostId),
      },
      { published },
      { new: true }
    );

    return property;
  }

  async searchProperties(filters: {
    city?: string;
    country?: string;
    minPrice?: number;
    maxPrice?: number;
    maxGuests?: number;
    propertyType?: string;
    amenities?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<{ properties: IProperty[]; total: number; totalPages: number }> {
    const {
      city,
      country,
      minPrice,
      maxPrice,
      maxGuests,
      propertyType,
      amenities,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = filters;

    const query: any = { published: true };

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    if (country) {
      query['location.country'] = new RegExp(country, 'i');
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pricePerNight = {};
      if (minPrice !== undefined) query.pricePerNight.$gte = minPrice;
      if (maxPrice !== undefined) query.pricePerNight.$lte = maxPrice;
    }

    if (maxGuests) {
      query.maxGuests = { $gte: maxGuests };
    }

    if (propertyType) {
      query.propertyType = propertyType;
    }

    if (amenities && amenities.length > 0) {
      query.amenities = { $all: amenities };
    }

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [properties, total] = await Promise.all([
      Property.find(query)
        .sort({ [sortBy]: sortOrder })
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

  async canUserModifyProperty(propertyId: string, userId: string, userRole: string): Promise<boolean> {
    if (userRole === 'ADMIN') {
      return true;
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return false;
    }

    return property.hostId.toString() === userId;
  }
}
