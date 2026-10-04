import { Availability, IAvailability } from './availability.model';
import { Property } from '../properties/property.model';
import {
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
  BlockDatesInput,
  UnblockDatesInput,
  SetPricingInput,
  SetStayRequirementsInput,
  SetLeadTimeInput,
  SetAdvanceNoticeInput,
  CreateSeasonInput,
  BulkSetPricingInput,
} from './availability.validation';
import mongoose from 'mongoose';

export class AvailabilityService {
  async createAvailability(data: CreateAvailabilityInput): Promise<IAvailability> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Validate dates
    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Verify property exists
    const property = await Property.findById(data.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    const availability = await Availability.create({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate,
      endDate,
      available: data.available,
      customPrice: data.customPrice,
    });

    return availability;
  }

  async getAvailabilityById(availabilityId: string): Promise<IAvailability | null> {
    return Availability.findById(availabilityId).populate('propertyId', 'title location pricePerNight');
  }

  async getAvailabilitiesByProperty(
    propertyId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ availabilities: IAvailability[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [availabilities, total] = await Promise.all([
      Availability.find({ propertyId: new mongoose.Types.ObjectId(propertyId) })
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit),
      Availability.countDocuments({ propertyId: new mongoose.Types.ObjectId(propertyId) }),
    ]);

    return {
      availabilities,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async queryAvailability(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ available: boolean; periods: IAvailability[] }> {
    // Find all availability records that overlap with the query range
    const periods = await Availability.find({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    }).sort({ startDate: 1 });

    // Check if the entire range is available
    const available = this.isRangeFullyAvailable(startDate, endDate, periods);

    return {
      available,
      periods,
    };
  }

  async updateAvailability(
    availabilityId: string,
    hostId: string,
    data: UpdateAvailabilityInput
  ): Promise<IAvailability | null> {
    const availability = await Availability.findById(availabilityId);

    if (!availability) {
      return null;
    }

    // Verify host owns the property
    const property = await Property.findById(availability.propertyId);
    if (!property || property.hostId.toString() !== hostId) {
      throw new Error('You do not have permission to modify this availability');
    }

    const updated = await Availability.findByIdAndUpdate(availabilityId, data, {
      new: true,
      runValidators: true,
    });

    return updated;
  }

  async deleteAvailability(availabilityId: string, hostId: string): Promise<boolean> {
    const availability = await Availability.findById(availabilityId);

    if (!availability) {
      return false;
    }

    // Verify host owns the property
    const property = await Property.findById(availability.propertyId);
    if (!property || property.hostId.toString() !== hostId) {
      throw new Error('You do not have permission to delete this availability');
    }

    const result = await Availability.deleteOne({ _id: availabilityId });
    return result.deletedCount > 0;
  }

  async blockDates(hostId: string, data: BlockDatesInput): Promise<IAvailability> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Verify dates
    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Verify property exists and host owns it
    const property = await Property.findById(data.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    if (property.hostId.toString() !== hostId) {
      throw new Error('You do not have permission to modify this property');
    }

    // Remove overlapping records and create new blocked period
    await Availability.deleteMany({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });

    const blocked = await Availability.create({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate,
      endDate,
      available: false,
    });

    return blocked;
  }

  async unblockDates(hostId: string, data: UnblockDatesInput): Promise<{ deletedCount: number }> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Verify dates
    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Verify property exists and host owns it
    const property = await Property.findById(data.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    if (property.hostId.toString() !== hostId) {
      throw new Error('You do not have permission to modify this property');
    }

    // Delete blocked periods in the range
    const result = await Availability.deleteMany({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      available: false,
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });

    return { deletedCount: result.deletedCount };
  }

  async setPricing(hostId: string, data: SetPricingInput): Promise<IAvailability> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Verify dates
    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Verify property exists and host owns it
    const property = await Property.findById(data.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    if (property.hostId.toString() !== hostId) {
      throw new Error('You do not have permission to modify this property');
    }

    // Remove overlapping records and create new pricing period
    await Availability.deleteMany({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });

    const pricing = await Availability.create({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate,
      endDate,
      available: true,
      customPrice: data.customPrice,
    });

    return pricing;
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

  private isRangeFullyAvailable(
    startDate: Date,
    endDate: Date,
    periods: IAvailability[]
  ): boolean {
    // If no periods, property is available
    if (periods.length === 0) {
      return true;
    }

    // Check if any period blocks the entire range
    for (const period of periods) {
      if (!period.available && period.startDate <= startDate && period.endDate >= endDate) {
        return false;
      }
    }

    return true;
  }

  async getEffectivePrice(
    propertyId: string,
    date: Date
  ): Promise<number | null> {
    const property = await Property.findById(propertyId);
    if (!property) {
      return null;
    }

    // Find availability record for this date with custom pricing
    const record = await Availability.findOne({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      startDate: { $lte: date },
      endDate: { $gt: date },
      customPrice: { $exists: true, $ne: null },
    });

    if (record && record.customPrice) {
      return record.customPrice;
    }

    // Return property's base price
    return property.pricePerNight;
  }

  async setStayRequirements(hostId: string, data: SetStayRequirementsInput): Promise<IAvailability> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    const property = await Property.findById(data.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    if (property.hostId.toString() !== hostId) {
      throw new Error('You do not have permission to modify this property');
    }

    if (data.minStay && data.maxStay && data.minStay > data.maxStay) {
      throw new Error('Minimum stay cannot exceed maximum stay');
    }

    // Remove overlapping records and create new stay requirement record
    await Availability.deleteMany({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });

    const requirements = await Availability.create({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate,
      endDate,
      available: true,
      minStay: data.minStay,
      maxStay: data.maxStay,
    });

    return requirements;
  }

  async setLeadTime(hostId: string, data: SetLeadTimeInput): Promise<IAvailability> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    const property = await Property.findById(data.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    if (property.hostId.toString() !== hostId) {
      throw new Error('You do not have permission to modify this property');
    }

    // Remove overlapping records and create new lead time record
    await Availability.deleteMany({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });

    const leadTime = await Availability.create({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate,
      endDate,
      available: true,
      leadDays: data.leadDays,
    });

    return leadTime;
  }

  async setAdvanceNotice(hostId: string, data: SetAdvanceNoticeInput): Promise<IAvailability> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    const property = await Property.findById(data.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    if (property.hostId.toString() !== hostId) {
      throw new Error('You do not have permission to modify this property');
    }

    // Remove overlapping records and create new advance notice record
    await Availability.deleteMany({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });

    const notice = await Availability.create({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate,
      endDate,
      available: true,
      advanceNoticeDays: data.advanceNoticeDays,
    });

    return notice;
  }

  async createSeason(hostId: string, data: CreateSeasonInput): Promise<IAvailability> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    const property = await Property.findById(data.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    if (property.hostId.toString() !== hostId) {
      throw new Error('You do not have permission to modify this property');
    }

    if (data.minStay && data.maxStay && data.minStay > data.maxStay) {
      throw new Error('Minimum stay cannot exceed maximum stay');
    }

    // Remove overlapping records
    await Availability.deleteMany({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });

    const season = await Availability.create({
      propertyId: new mongoose.Types.ObjectId(data.propertyId),
      startDate,
      endDate,
      available: true,
      customPrice: data.customPrice,
      minStay: data.minStay,
      maxStay: data.maxStay,
      leadDays: data.leadDays,
      advanceNoticeDays: data.advanceNoticeDays,
      seasonName: data.seasonName,
    });

    return season;
  }

  async getSeasonsBySeason(propertyId: string): Promise<IAvailability[]> {
    return Availability.find({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      seasonName: { $exists: true, $ne: null },
    }).sort({ startDate: 1 });
  }

  async bulkSetPricing(hostId: string, data: BulkSetPricingInput): Promise<IAvailability[]> {
    const property = await Property.findById(data.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    if (property.hostId.toString() !== hostId) {
      throw new Error('You do not have permission to modify this property');
    }

    const created: IAvailability[] = [];

    for (const datePrice of data.dates) {
      const date = new Date(datePrice.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      // Remove existing record for this day
      await Availability.deleteMany({
        propertyId: new mongoose.Types.ObjectId(data.propertyId),
        startDate: { $lte: date },
        endDate: { $gt: date },
      });

      // Create new pricing for this day
      const record = await Availability.create({
        propertyId: new mongoose.Types.ObjectId(data.propertyId),
        startDate: date,
        endDate: nextDay,
        available: true,
        customPrice: datePrice.price,
      });

      created.push(record);
    }

    return created;
  }

  async validateStayDuration(
    propertyId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<{ valid: boolean; reason?: string }> {
    // Calculate stay duration
    const durationDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Find applicable stay requirements
    const requirements = await Availability.findOne({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      startDate: { $lte: checkIn },
      endDate: { $gte: checkOut },
      $or: [
        { minStay: { $exists: true, $ne: null } },
        { maxStay: { $exists: true, $ne: null } },
      ],
    });

    if (!requirements) {
      return { valid: true };
    }

    if (requirements.minStay && durationDays < requirements.minStay) {
      return {
        valid: false,
        reason: `Minimum stay requirement is ${requirements.minStay} nights`,
      };
    }

    if (requirements.maxStay && durationDays > requirements.maxStay) {
      return {
        valid: false,
        reason: `Maximum stay limit is ${requirements.maxStay} nights`,
      };
    }

    return { valid: true };
  }

  async validateLeadTime(
    propertyId: string,
    checkInDate: Date
  ): Promise<{ valid: boolean; reason?: string }> {
    // Find applicable lead time requirement
    const leadTime = await Availability.findOne({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      startDate: { $lte: checkInDate },
      endDate: { $gt: checkInDate },
      leadDays: { $exists: true, $ne: null },
    });

    if (!leadTime || !leadTime.leadDays) {
      return { valid: true };
    }

    const now = new Date();
    const requiredBookingDate = new Date(checkInDate);
    requiredBookingDate.setDate(requiredBookingDate.getDate() - leadTime.leadDays);

    if (now < requiredBookingDate) {
      const daysUntilAllowed = Math.ceil(
        (requiredBookingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        valid: false,
        reason: `Booking must be made at least ${leadTime.leadDays} days in advance (available in ${daysUntilAllowed} days)`,
      };
    }

    return { valid: true };
  }

  async validateAdvanceNotice(
    propertyId: string,
    checkInDate: Date
  ): Promise<{ valid: boolean; reason?: string }> {
    // Find applicable advance notice requirement
    const notice = await Availability.findOne({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      startDate: { $lte: checkInDate },
      endDate: { $gt: checkInDate },
      advanceNoticeDays: { $exists: true, $ne: null },
    });

    if (!notice || !notice.advanceNoticeDays) {
      return { valid: true };
    }

    const now = new Date();
    const requiredNoticeDate = new Date(checkInDate);
    requiredNoticeDate.setDate(requiredNoticeDate.getDate() - notice.advanceNoticeDays);

    if (now < requiredNoticeDate) {
      const daysUntilAllowed = Math.ceil(
        (requiredNoticeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        valid: false,
        reason: `${notice.advanceNoticeDays} days advance notice required (available in ${daysUntilAllowed} days)`,
      };
    }

    return { valid: true };
  }
}
