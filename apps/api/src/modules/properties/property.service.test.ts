import { PropertyService } from '@/modules/properties/property.service';
import { Property } from '@/modules/properties/property.model';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('@/modules/properties/property.model');

describe('PropertyService', () => {
  let propertyService: PropertyService;

  const mockHostId = '653a1b2c3d4e5f6a7b8c9d0e';
  const mockHostId2 = '653a1b2c3d4e5f6a7b8c9d0f';
  const mockPropertyId = '653a1b2c3d4e5f6a7b8c9d10';

  const mockProperty = {
    _id: new mongoose.Types.ObjectId(mockPropertyId),
    hostId: new mongoose.Types.ObjectId(mockHostId),
    title: 'Test Property',
    description: 'A beautiful test property',
    propertyType: 'HOUSE',
    location: {
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
    },
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    pricePerNight: 100,
    currency: 'INR',
    amenities: ['wifi', 'parking'],
    images: [],
    cancellationPolicy: 'MODERATE',
    published: false,
    reviewCount: 0,
  };

  const createData = {
    title: 'Test Property',
    description: 'A beautiful test property',
    propertyType: 'HOUSE' as const,
    location: {
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
    },
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    pricePerNight: 100,
    currency: 'INR',
    amenities: ['wifi', 'parking'],
    images: [],
    cancellationPolicy: 'MODERATE' as const,
  };

  beforeEach(() => {
    propertyService = new PropertyService();
    jest.clearAllMocks();
  });

  describe('createProperty', () => {
    it('should create a property with hostId and defaults', async () => {
      const createdProperty = { ...mockProperty, _id: mockPropertyId };
      (Property.create as jest.Mock).mockResolvedValue(createdProperty);

      const result = await propertyService.createProperty(mockHostId, createData);

      expect(result).toEqual(createdProperty);
      expect(Property.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createData,
          hostId: new mongoose.Types.ObjectId(mockHostId),
          published: false,
          reviewCount: 0,
        })
      );
    });
  });

  describe('getPropertyById', () => {
    it('should return property by id with host populated', async () => {
      (Property.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProperty),
      });

      const result = await propertyService.getPropertyById(mockPropertyId);

      expect(result).toEqual(mockProperty);
      expect(Property.findById).toHaveBeenCalledWith(mockPropertyId);
    });

    it('should return null when property not found', async () => {
      (Property.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const result = await propertyService.getPropertyById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getPublicPropertyById', () => {
    it('should return published property by id', async () => {
      const publishedProperty = { ...mockProperty, published: true };
      (Property.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(publishedProperty),
      });

      const result = await propertyService.getPublicPropertyById(mockPropertyId);

      expect(result).toEqual(publishedProperty);
      expect(Property.findOne).toHaveBeenCalledWith({
        _id: mockPropertyId,
        published: true,
      });
    });

    it('should return null for unpublished property', async () => {
      (Property.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const result = await propertyService.getPublicPropertyById(mockPropertyId);

      expect(result).toBeNull();
    });
  });

  describe('getPropertiesByHost', () => {
    it('should return paginated properties for host', async () => {
      const properties = [mockProperty];
      (Property.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(properties),
      });
      (Property.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await propertyService.getPropertiesByHost(mockHostId, 1, 20);

      expect(result).toEqual({
        properties,
        total: 1,
        totalPages: 1,
      });
      expect(Property.find).toHaveBeenCalledWith({
        hostId: new mongoose.Types.ObjectId(mockHostId),
      });
    });

    it('should handle empty results', async () => {
      (Property.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      (Property.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await propertyService.getPropertiesByHost(mockHostId, 1, 20);

      expect(result).toEqual({
        properties: [],
        total: 0,
        totalPages: 0,
      });
    });
  });

  describe('updateProperty', () => {
    it('should update property when host owns it', async () => {
      const updateData = { title: 'Updated Title' };
      const updatedProperty = { ...mockProperty, ...updateData };
      (Property.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedProperty);

      const result = await propertyService.updateProperty(mockPropertyId, mockHostId, updateData);

      expect(result).toEqual(updatedProperty);
      expect(Property.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: mockPropertyId,
          hostId: new mongoose.Types.ObjectId(mockHostId),
        },
        updateData,
        { new: true, runValidators: true }
      );
    });

    it('should return null when property not found or not owned by host', async () => {
      (Property.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await propertyService.updateProperty(mockPropertyId, mockHostId, { title: 'New' });

      expect(result).toBeNull();
    });
  });

  describe('deleteProperty', () => {
    it('should delete property when host owns it', async () => {
      (Property.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await propertyService.deleteProperty(mockPropertyId, mockHostId);

      expect(result).toBe(true);
      expect(Property.deleteOne).toHaveBeenCalledWith({
        _id: mockPropertyId,
        hostId: new mongoose.Types.ObjectId(mockHostId),
      });
    });

    it('should return false when property not found or not owned by host', async () => {
      (Property.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      const result = await propertyService.deleteProperty(mockPropertyId, mockHostId);

      expect(result).toBe(false);
    });
  });

  describe('publishProperty', () => {
    it('should publish/unpublish property when host owns it', async () => {
      const publishedProperty = { ...mockProperty, published: true };
      (Property.findOneAndUpdate as jest.Mock).mockResolvedValue(publishedProperty);

      const result = await propertyService.publishProperty(mockPropertyId, mockHostId, true);

      expect(result).toEqual(publishedProperty);
      expect(Property.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: mockPropertyId,
          hostId: new mongoose.Types.ObjectId(mockHostId),
        },
        { published: true },
        { new: true }
      );
    });

    it('should return null when property not found or not owned by host', async () => {
      (Property.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await propertyService.publishProperty(mockPropertyId, mockHostId, true);

      expect(result).toBeNull();
    });
  });

  describe('searchProperties', () => {
    it('should search with all filters', async () => {
      const filters = {
        city: 'Test',
        country: 'Country',
        minPrice: 50,
        maxPrice: 200,
        maxGuests: 4,
        propertyType: 'HOUSE',
        amenities: ['wifi'],
        page: 1,
        limit: 10,
        sortBy: 'pricePerNight',
        order: 'asc' as const,
      };

      const properties = [mockProperty];
      (Property.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(properties),
      });
      (Property.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await propertyService.searchProperties(filters);

      expect(result).toEqual({
        properties,
        total: 1,
        totalPages: 1,
      });
      expect(Property.find).toHaveBeenCalledWith(
        expect.objectContaining({
          published: true,
          'location.city': expect.any(RegExp),
          'location.country': expect.any(RegExp),
          pricePerNight: { $gte: 50, $lte: 200 },
          maxGuests: { $gte: 4 },
          propertyType: 'HOUSE',
          amenities: { $all: ['wifi'] },
        })
      );
    });

    it('should search with minimal filters', async () => {
      (Property.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockProperty]),
      });
      (Property.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await propertyService.searchProperties({});

      expect(result).toEqual({
        properties: [mockProperty],
        total: 1,
        totalPages: 1,
      });
      expect(Property.find).toHaveBeenCalledWith({ published: true });
    });

    it('should handle pagination correctly', async () => {
      (Property.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockProperty]),
      });
      (Property.countDocuments as jest.Mock).mockResolvedValue(25);

      const result = await propertyService.searchProperties({ page: 2, limit: 10 });

      expect(result).toEqual({
        properties: [mockProperty],
        total: 25,
        totalPages: 3,
      });
    });
  });

  describe('canUserModifyProperty', () => {
    it('should return true for admin', async () => {
      const result = await propertyService.canUserModifyProperty(mockPropertyId, 'any-user', 'ADMIN');
      expect(result).toBe(true);
      expect(Property.findById).not.toHaveBeenCalled();
    });

    it('should return true when user is host', async () => {
      (Property.findById as jest.Mock).mockResolvedValue({
        hostId: new mongoose.Types.ObjectId(mockHostId),
      });

      const result = await propertyService.canUserModifyProperty(mockPropertyId, mockHostId, 'HOST');

      expect(result).toBe(true);
      expect(Property.findById).toHaveBeenCalledWith(mockPropertyId);
    });

    it('should return false when user is not host', async () => {
      (Property.findById as jest.Mock).mockResolvedValue({
        hostId: new mongoose.Types.ObjectId(mockHostId2),
      });

      const result = await propertyService.canUserModifyProperty(mockPropertyId, mockHostId, 'GUEST');

      expect(result).toBe(false);
    });

    it('should return false when property not found', async () => {
      (Property.findById as jest.Mock).mockResolvedValue(null);

      const result = await propertyService.canUserModifyProperty('nonexistent', mockHostId, 'HOST');

      expect(result).toBe(false);
    });
  });
});