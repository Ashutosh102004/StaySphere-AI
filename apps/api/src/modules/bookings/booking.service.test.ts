import { BookingService } from '@/modules/bookings/booking.service';
import { Property } from '@/modules/properties/property.model';
import { Availability } from '@/modules/availability/availability.model';
import { Booking } from '@/modules/bookings/booking.model';
import { AvailabilityService } from '@/modules/availability/availability.service';

// Mock dependencies
jest.mock('@/modules/properties/property.model');
// The module-level `new AvailabilityService()` in booking.service.ts runs at import
// time, so the constructor must return a stable shared instance from the factory.
jest.mock('@/modules/availability/availability.service', () => {
  const instance = {
    validateStayDuration: jest.fn(),
    validateLeadTime: jest.fn(),
    validateAdvanceNotice: jest.fn(),
    getEffectivePrice: jest.fn(),
  };
  return {
    __esModule: true,
    AvailabilityService: jest.fn().mockImplementation(() => instance),
    __sharedInstance: instance,
  };
});

// Generate valid 24-char ObjectIds (hex strings)
const mockPropertyId = '653a1b2c3d4e5f6a7b8c9d0e';
const mockGuestId = '653a1b2c3d4e5f6a7b8c9d0f';
const mockHostId = '653a1b2c3d4e5f6a7b8c9d10';
const mockBookingId = '653a1b2c3d4e5f6a7b8c9d11';

interface MockAvailabilityService {
  validateStayDuration: jest.Mock;
  validateLeadTime: jest.Mock;
  validateAdvanceNotice: jest.Mock;
  getEffectivePrice: jest.Mock;
}

interface MockBooking {
  _id: string;
  propertyId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: 'PENDING' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUND_PENDING' | 'REFUNDED' | 'FAILED';
  expiresAt: Date;
  guestDetails: { firstName: string; lastName: string; email: string; phone: string }[];
  createdAt: Date;
  updatedAt: Date;
  save: jest.Mock;
  populate: jest.Mock;
}

// The shared AvailabilityService instance the module under test actually uses.
// Access the shared instance from the mock.
const mockAvailabilityService = (
  AvailabilityService as unknown as { __sharedInstance?: MockAvailabilityService }
).__sharedInstance ?? new AvailabilityService() as unknown as MockAvailabilityService;

const mockProperty = {
  _id: mockPropertyId,
  title: 'Test Property',
  published: true,
  maxGuests: 4,
  hostId: mockHostId,
};

// Fresh booking per call so status mutations don't leak between tests.
const createMockBooking = (overrides: Partial<MockBooking> = {}) => ({
  _id: mockBookingId,
  propertyId: mockPropertyId,
  guestId: mockGuestId,
  checkIn: new Date('2024-01-15'),
  checkOut: new Date('2024-01-18'),
  guests: 2,
  totalPrice: 300,
  status: 'PENDING',
  expiresAt: new Date('2024-01-15T00:15:00.000Z'),
  guestDetails: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn(),
  populate: jest.fn(),
  ...overrides,
});

const mockPropertyFindOne = jest.fn();
const mockBookingCreate = jest.fn();
const mockBookingFindOne = jest.fn();
const mockBookingFindById = jest.fn();
const mockAvailabilityCreate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  (Property.findOne as jest.Mock) = mockPropertyFindOne;
  (Booking.create as jest.Mock) = mockBookingCreate;
  (Booking.findOne as jest.Mock) = mockBookingFindOne;
  (Booking.findById as jest.Mock) = mockBookingFindById;
  (Availability.create as jest.Mock) = mockAvailabilityCreate;

  // clearAllMocks wipes the shared availability instance's method returns,
  // so re-establish their defaults here.
  (mockAvailabilityService.validateStayDuration as jest.Mock).mockResolvedValue({ valid: true });
  (mockAvailabilityService.validateLeadTime as jest.Mock).mockResolvedValue({ valid: true });
  (mockAvailabilityService.validateAdvanceNotice as jest.Mock).mockResolvedValue({ valid: true });
  (mockAvailabilityService.getEffectivePrice as jest.Mock).mockResolvedValue(100);
});

describe('BookingService', () => {
  let bookingService: BookingService;

  beforeEach(() => {
    bookingService = new BookingService();
  });

  describe('calculateTotalPrice / getNightsCount', () => {
    it('should calculate correct total price for multi-night stay', async () => {
      const propertyId = mockPropertyId;
      const checkIn = new Date('2024-01-15');
      const checkOut = new Date('2024-01-18');

      // 100 per night for each requested date
      (mockAvailabilityService.getEffectivePrice as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(100);

      const totalPrice = await bookingService.calculateTotalPrice(
        propertyId,
        checkIn,
        checkOut
      );

      expect(totalPrice).toBe(300);
      expect(mockAvailabilityService.getEffectivePrice).toHaveBeenCalledTimes(3);
      expect(mockAvailabilityService.getEffectivePrice).toHaveBeenCalledWith(propertyId, expect.any(Date));
    });

    it('should calculate nights correctly', async () => {
      const checkIn = new Date('2024-01-15T10:00:00.000Z');
      const checkOut = new Date('2024-01-18T14:30:00.000Z');

      const nights = await bookingService.getNightsCount(checkIn, checkOut);

      // Jan 15 10:00 -> Jan 18 14:30 is slightly more than 3 days; Math.ceil gives 4
      expect(nights).toBe(4);
    });
  });

  describe('createBooking', () => {
    it('should successfully create a booking', async () => {
      const guestId = mockGuestId;
      const createData = {
        propertyId: mockPropertyId,
        checkIn: '2024-01-15T10:00:00.000Z',
        checkOut: '2024-01-18T14:30:00.000Z',
        guests: 2,
        guestDetails: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '1234567890' }],
      };

      const created = createMockBooking();
      (Property.findOne as jest.Mock).mockResolvedValue(mockProperty);
      (Booking.findOne as jest.Mock).mockResolvedValue(null);
      (Booking.create as jest.Mock).mockResolvedValue(created);

      const result = await bookingService.createBooking(guestId, createData);

      expect(result).toEqual(created);
      expect(Property.findOne).toHaveBeenCalledWith({ _id: createData.propertyId, published: true });
      expect(Booking.findOne).toHaveBeenCalled();
      expect(Booking.create).toHaveBeenCalled();
    });

    it('should reject when property is not found or not published', async () => {
      const guestId = mockGuestId;
      const createData = {
        propertyId: 'nonexistent',
        checkIn: '2024-01-15T10:00:00.000Z',
        checkOut: '2024-01-18T14:30:00.000Z',
        guests: 2,
        guestDetails: [],
      };

      (Property.findOne as jest.Mock).mockResolvedValue(null);

      await expect(bookingService.createBooking(guestId, createData)).rejects.toThrow('Property not found or not available for booking');
      expect(Property.findOne).toHaveBeenCalledWith({ _id: createData.propertyId, published: true });
    });

    it('should reject when guest count exceeds property limit', async () => {
      const guestId = mockGuestId;
      const createData = {
        propertyId: mockPropertyId,
        checkIn: '2024-01-15T10:00:00.000Z',
        checkOut: '2024-01-18T14:30:00.000Z',
        guests: 5,
        guestDetails: [],
      };

      (Property.findOne as jest.Mock).mockResolvedValue(mockProperty);

      await expect(bookingService.createBooking(guestId, createData)).rejects.toThrow('Property can accommodate maximum 4 guests');
      expect(Property.findOne).toHaveBeenCalledWith({ _id: createData.propertyId, published: true });
    });

    it('should reject when booking conflicts with existing bookings', async () => {
      const guestId = mockGuestId;
      const createData = {
        propertyId: mockPropertyId,
        checkIn: '2024-01-15T10:00:00.000Z',
        checkOut: '2024-01-18T14:30:00.000Z',
        guests: 2,
        guestDetails: [],
      };

      (Property.findOne as jest.Mock).mockResolvedValue(mockProperty);
      (Booking.findOne as jest.Mock).mockResolvedValue(createMockBooking());

      await expect(bookingService.createBooking(guestId, createData)).rejects.toThrow('Property is not available for the selected dates');
      expect(Booking.findOne).toHaveBeenCalled();
    });
  });

  describe('confirmBooking', () => {
    it('should successfully confirm a PENDING booking', async () => {
      const bookingId = mockBookingId;
      const userId = mockGuestId;
      const confirmData = { paymentId: 'payment-456' };

      const booking = createMockBooking();
      (Booking.findById as jest.Mock).mockResolvedValue(booking);

      const result = await bookingService.confirmBooking(bookingId, userId, confirmData);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('CONFIRMED');
      expect(result?.expiresAt).toBeUndefined();
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
      expect(booking.save).toHaveBeenCalled();
    });

    it('should reject confirmation of booking in wrong status', async () => {
      const bookingId = mockBookingId;
      const userId = mockGuestId;
      const confirmData = { paymentId: 'payment-456' };

      (Booking.findById as jest.Mock).mockResolvedValue(createMockBooking({ status: 'COMPLETED' }));

      await expect(bookingService.confirmBooking(bookingId, userId, confirmData)).rejects.toThrow('Cannot confirm booking in COMPLETED status. Must be in PENDING status.');
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
    });

    it('should reject when user is not the guest', async () => {
      const bookingId = mockBookingId;
      const userId = mockHostId; // not the guest
      const confirmData = { paymentId: 'payment-456' };

      (Booking.findById as jest.Mock).mockResolvedValue(createMockBooking({ guestId: '653a1b2c3d4e5f6a7b8c9d20' }));

      await expect(bookingService.confirmBooking(bookingId, userId, confirmData)).rejects.toThrow('Only the guest can confirm this booking');
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
    });
  });

  describe('completeBooking', () => {
    it('should successfully complete a CONFIRMED booking as host', async () => {
      const bookingId = mockBookingId;
      const userId = mockHostId;
      const userRole = 'HOST';
      const completeData = { notes: 'Great stay' };

      const booking = createMockBooking({ status: 'CONFIRMED' });
      (Booking.findById as jest.Mock).mockResolvedValue(booking);
      (Property.findById as jest.Mock).mockResolvedValue({ hostId: mockHostId });

      const result = await bookingService.completeBooking(bookingId, userId, userRole, completeData);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('COMPLETED');
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
      expect(Property.findById).toHaveBeenCalledWith(mockPropertyId);
      expect(booking.save).toHaveBeenCalled();
    });

    it('should reject completion of booking in wrong status', async () => {
      const bookingId = mockBookingId;
      const userId = mockHostId;
      const userRole = 'HOST';
      const completeData = { notes: 'Test' };

      (Booking.findById as jest.Mock).mockResolvedValue(createMockBooking({ status: 'PENDING' }));
      (Property.findById as jest.Mock).mockResolvedValue({ hostId: mockHostId });

      await expect(bookingService.completeBooking(bookingId, userId, userRole, completeData)).rejects.toThrow('Cannot complete booking in PENDING status. Must be in CONFIRMED status.');
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
    });

    it('should reject when user is not host/admin', async () => {
      const bookingId = mockBookingId;
      const userId = mockGuestId; // guest, not host
      const userRole = 'GUEST';
      const completeData = { notes: 'Test' };

      (Booking.findById as jest.Mock).mockResolvedValue(createMockBooking({ status: 'CONFIRMED' }));
      (Property.findById as jest.Mock).mockResolvedValue({ hostId: mockHostId });

      await expect(bookingService.completeBooking(bookingId, userId, userRole, completeData)).rejects.toThrow('Only the host or admin can complete this booking');
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
    });
  });

  describe('cancelBooking', () => {
    it('should successfully cancel booking as guest', async () => {
      const bookingId = mockBookingId;
      const userId = mockGuestId;
      const userRole = 'GUEST';
      const cancellationReason = 'Changed plans';

      const booking = createMockBooking();
      (Booking.findById as jest.Mock).mockResolvedValue(booking);
      (Property.findById as jest.Mock).mockResolvedValue({ hostId: mockHostId });

      const result = await bookingService.cancelBooking(bookingId, userId, userRole, cancellationReason);

      expect(result).not.toBeNull();
      expect(result?.status).toBe('CANCELLED');
      expect(result?.cancellationReason).toBe(cancellationReason);
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
      expect(Property.findById).toHaveBeenCalledWith(mockPropertyId);
      expect(booking.save).toHaveBeenCalled();
    });

    it('should reject cancel of already completed booking', async () => {
      const bookingId = mockBookingId;
      const userId = mockGuestId;
      const userRole = 'GUEST';

      (Booking.findById as jest.Mock).mockResolvedValue(createMockBooking({ status: 'COMPLETED' }));

      await expect(bookingService.cancelBooking(bookingId, userId, userRole)).rejects.toThrow('Cannot cancel a completed booking');
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
    });

    it('should reject when unauthorized user tries to cancel', async () => {
      const bookingId = mockBookingId;
      const userId = '653a1b2c3d4e5f6a7b8c9d30'; // not guest/host/admin
      const userRole = 'GUEST';

      (Booking.findById as jest.Mock).mockResolvedValue(createMockBooking());
      (Property.findById as jest.Mock).mockResolvedValue({ hostId: mockHostId });

      await expect(bookingService.cancelBooking(bookingId, userId, userRole)).rejects.toThrow('You do not have permission to cancel this booking');
      expect(Booking.findById).toHaveBeenCalledWith(bookingId);
    });
  });
});
