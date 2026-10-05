import { AvailabilityService } from '@/modules/availability/availability.service';
import { Property } from '@/modules/properties/property.model';
import { Availability } from '@/modules/availability/availability.model';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('@/modules/properties/property.model');
jest.mock('@/modules/availability/availability.model');

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  const mockPropertyId = '653a1b2c3d4e5f6a7b8c9d0e';
  const mockHostId = '653a1b2c3d4e5f6a7b8c9d0f';

  const mockProperty = {
    _id: mockPropertyId,
    hostId: new mongoose.Types.ObjectId(mockHostId),
    pricePerNight: 100,
  };

  beforeEach(() => {
    service = new AvailabilityService();
    jest.clearAllMocks();
    (Property.findById as jest.Mock).mockResolvedValue(mockProperty);
  });

  describe('createAvailability', () => {
    it('should create an availability record', async () => {
      const created = { propertyId: mockPropertyId, available: true };
      (Availability.create as jest.Mock).mockResolvedValue(created);

      const result = await service.createAvailability({
        propertyId: mockPropertyId,
        startDate: '2024-01-01',
        endDate: '2024-01-10',
        available: true,
        customPrice: 150,
      } as any);

      expect(result).toEqual(created);
      expect(Availability.create).toHaveBeenCalled();
    });

    it('should reject when end date is before start date', async () => {
      await expect(
        service.createAvailability({
          propertyId: mockPropertyId,
          startDate: '2024-01-10',
          endDate: '2024-01-01',
          available: true,
        } as any)
      ).rejects.toThrow('End date must be after start date');
    });

    it('should reject when property not found', async () => {
      (Property.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createAvailability({
          propertyId: mockPropertyId,
          startDate: '2024-01-01',
          endDate: '2024-01-10',
          available: true,
        } as any)
      ).rejects.toThrow('Property not found');
    });
  });

  describe('getAvailabilityById', () => {
    it('should return availability by id', async () => {
      const record = { _id: '653a1b2c3d4e5f6a7b8c9d01', available: true };
      (Availability.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(record),
      });

      const result = await service.getAvailabilityById('653a1b2c3d4e5f6a7b8c9d01');

      expect(result).toEqual(record);
      expect(Availability.findById).toHaveBeenCalledWith('653a1b2c3d4e5f6a7b8c9d01');
    });
  });

  describe('getAvailabilitiesByProperty', () => {
    it('should return paginated availabilities', async () => {
      const records = [{ _id: '1' }];
      (Availability.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(records),
      });
      (Availability.countDocuments as jest.Mock).mockResolvedValue(5);

      const result = await service.getAvailabilitiesByProperty(mockPropertyId, 1, 20);

      expect(result).toEqual({
        availabilities: records,
        total: 5,
        totalPages: 1,
      });
      expect(Availability.countDocuments).toHaveBeenCalledWith({
        propertyId: new mongoose.Types.ObjectId(mockPropertyId),
      });
    });
  });

  describe('queryAvailability', () => {
    it('should report available when no blocking periods', async () => {
      (Availability.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const result = await service.queryAvailability(
        mockPropertyId,
        new Date('2024-01-01'),
        new Date('2024-01-10')
      );

      expect(result.available).toBe(true);
      expect(result.periods).toEqual([]);
    });

    it('should report unavailable when fully blocked', async () => {
      const blocked = {
        available: false,
        startDate: new Date('2023-12-01'),
        endDate: new Date('2024-02-01'),
      };
      (Availability.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([blocked]),
      });

      const result = await service.queryAvailability(
        mockPropertyId,
        new Date('2024-01-01'),
        new Date('2024-01-10')
      );

      expect(result.available).toBe(false);
    });
  });

  describe('updateAvailability', () => {
    it('should update when host owns the property', async () => {
      const record = { propertyId: new mongoose.Types.ObjectId(mockPropertyId) };
      const updated = { ...record, available: false };
      (Availability.findById as jest.Mock).mockResolvedValue(record);
      (Availability.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const result = await service.updateAvailability('653a1b2c3d4e5f6a7b8c9d01', mockHostId, {
        available: false,
      } as any);

      expect(result).toEqual(updated);
      expect(Availability.findByIdAndUpdate).toHaveBeenCalledWith(
        '653a1b2c3d4e5f6a7b8c9d01',
        { available: false },
        { new: true, runValidators: true }
      );
    });

    it('should return null when availability not found', async () => {
      (Availability.findById as jest.Mock).mockResolvedValue(null);

      const result = await service.updateAvailability('653a1b2c3d4e5f6a7b8c9d01', mockHostId, {
        available: false,
      } as any);

      expect(result).toBeNull();
    });

    it('should reject when user does not own the property', async () => {
      const record = { propertyId: new mongoose.Types.ObjectId(mockPropertyId) };
      (Availability.findById as jest.Mock).mockResolvedValue(record);
      (Property.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateAvailability('653a1b2c3d4e5f6a7b8c9d01', mockHostId, {
          available: false,
        } as any)
      ).rejects.toThrow('You do not have permission to modify this availability');
    });
  });

  describe('deleteAvailability', () => {
    it('should delete when host owns the property', async () => {
      const record = { propertyId: new mongoose.Types.ObjectId(mockPropertyId) };
      (Availability.findById as jest.Mock).mockResolvedValue(record);
      (Availability.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await service.deleteAvailability('653a1b2c3d4e5f6a7b8c9d01', mockHostId);

      expect(result).toBe(true);
      expect(Availability.deleteOne).toHaveBeenCalledWith({
        _id: '653a1b2c3d4e5f6a7b8c9d01',
      });
    });

    it('should return false when availability not found', async () => {
      (Availability.findById as jest.Mock).mockResolvedValue(null);

      const result = await service.deleteAvailability('653a1b2c3d4e5f6a7b8c9d01', mockHostId);

      expect(result).toBe(false);
    });
  });

  describe('blockDates', () => {
    it('should create a blocked period', async () => {
      const blocked = { available: false };
      (Availability.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
      (Availability.create as jest.Mock).mockResolvedValue(blocked);

      const result = await service.blockDates(mockHostId, {
        propertyId: mockPropertyId,
        startDate: '2024-01-01',
        endDate: '2024-01-10',
      } as any);

      expect(result).toEqual(blocked);
      expect(Availability.create).toHaveBeenCalled();
    });

    it('should reject when user does not own the property', async () => {
      (Property.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.blockDates(mockHostId, {
          propertyId: mockPropertyId,
          startDate: '2024-01-01',
          endDate: '2024-01-10',
        } as any)
      ).rejects.toThrow('Property not found');
    });
  });

  describe('unblockDates', () => {
    it('should return deleted count of unblocked periods', async () => {
      (Availability.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });

      const result = await service.unblockDates(mockHostId, {
        propertyId: mockPropertyId,
        startDate: '2024-01-01',
        endDate: '2024-01-10',
      } as any);

      expect(result).toEqual({ deletedCount: 2 });
      expect(Availability.deleteMany).toHaveBeenCalled();
    });
  });

  describe('setPricing', () => {
    it('should create a pricing period', async () => {
      const pricing = { customPrice: 200 };
      (Availability.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
      (Availability.create as jest.Mock).mockResolvedValue(pricing);

      const result = await service.setPricing(mockHostId, {
        propertyId: mockPropertyId,
        startDate: '2024-01-01',
        endDate: '2024-01-10',
        customPrice: 200,
      } as any);

      expect(result).toEqual(pricing);
    });
  });

  describe('canUserModifyProperty', () => {
    it('should return true for admin', async () => {
      const result = await service.canUserModifyProperty(mockPropertyId, 'any', 'ADMIN');
      expect(result).toBe(true);
      expect(Property.findById).not.toHaveBeenCalled();
    });

    it('should return true for the host', async () => {
      const result = await service.canUserModifyProperty(mockPropertyId, mockHostId, 'HOST');
      expect(result).toBe(true);
    });

    it('should return false when property not found', async () => {
      (Property.findById as jest.Mock).mockResolvedValue(null);
      const result = await service.canUserModifyProperty(mockPropertyId, mockHostId, 'HOST');
      expect(result).toBe(false);
    });
  });

  describe('getEffectivePrice', () => {
    it('should return custom price when a pricing record exists', async () => {
      (Availability.findOne as jest.Mock).mockResolvedValue({ customPrice: 250 });

      const result = await service.getEffectivePrice(mockPropertyId, new Date('2024-01-05'));

      expect(result).toBe(250);
      expect(Availability.findOne).toHaveBeenCalled();
    });

    it('should fall back to property base price', async () => {
      (Availability.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getEffectivePrice(mockPropertyId, new Date('2024-01-05'));

      expect(result).toBe(100);
    });

    it('should return null when property not found', async () => {
      (Property.findById as jest.Mock).mockResolvedValue(null);

      const result = await service.getEffectivePrice(mockPropertyId, new Date('2024-01-05'));

      expect(result).toBeNull();
      expect(Availability.findOne).not.toHaveBeenCalled();
    });
  });

  describe('validateStayDuration', () => {
    const checkIn = new Date('2024-01-01');
    const checkOut = new Date('2024-01-04'); // 3 nights

    it('should be valid when no requirements exist', async () => {
      (Availability.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.validateStayDuration(mockPropertyId, checkIn, checkOut);

      expect(result).toEqual({ valid: true });
    });

    it('should fail when below minimum stay', async () => {
      (Availability.findOne as jest.Mock).mockResolvedValue({ minStay: 5 });

      const result = await service.validateStayDuration(mockPropertyId, checkIn, checkOut);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Minimum stay');
    });

    it('should fail when above maximum stay', async () => {
      (Availability.findOne as jest.Mock).mockResolvedValue({ maxStay: 2 });

      const result = await service.validateStayDuration(mockPropertyId, checkIn, checkOut);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Maximum stay');
    });
  });

  describe('validateLeadTime', () => {
    it('should be valid when no lead time requirement exists', async () => {
      (Availability.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.validateLeadTime(mockPropertyId, new Date('2024-01-01'));

      expect(result).toEqual({ valid: true });
    });

    it('should fail when lead time not met', async () => {
      (Availability.findOne as jest.Mock).mockResolvedValue({ leadDays: 30 });
      // checkIn far in the future => booking must be made well before now
      const result = await service.validateLeadTime(
        mockPropertyId,
        new Date('2030-01-01')
      );

      expect(result.valid).toBe(false);
    });
  });

  describe('validateAdvanceNotice', () => {
    it('should be valid when no notice requirement exists', async () => {
      (Availability.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.validateAdvanceNotice(mockPropertyId, new Date('2024-01-01'));

      expect(result).toEqual({ valid: true });
    });

    it('should fail when advance notice not met', async () => {
      (Availability.findOne as jest.Mock).mockResolvedValue({ advanceNoticeDays: 30 });
      const result = await service.validateAdvanceNotice(
        mockPropertyId,
        new Date('2030-01-01')
      );

      expect(result.valid).toBe(false);
    });
  });
});