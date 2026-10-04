import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface CreateBookingInput {
  propertyId: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  specialRequests?: string;
}

interface UpdateBookingStatusInput {
  bookingId: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

export function useBooking() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  // Get user's bookings
  const useMyBookings = (status?: string) => {
    return useQuery({
      queryKey: ['my-bookings', status],
      queryFn: async () => {
        const response = await axios.get(`${API_URL}/bookings/my-bookings`, {
          ...axiosConfig,
          params: status ? { status } : {},
        });
        return response.data.data.bookings;
      },
    });
  };

  // Get booking by ID
  const useBookingById = (bookingId: string) => {
    return useQuery({
      queryKey: ['booking', bookingId],
      queryFn: async () => {
        const response = await axios.get(`${API_URL}/bookings/${bookingId}`, axiosConfig);
        return response.data.data.booking;
      },
      enabled: !!bookingId,
    });
  };

  // Get host's bookings
  const useHostBookings = (page = 1, limit = 20) => {
    return useQuery({
      queryKey: ['host-bookings', page, limit],
      queryFn: async () => {
        const response = await axios.get(`${API_URL}/bookings/host/bookings`, {
          ...axiosConfig,
          params: { page, limit },
        });
        return response.data.data;
      },
    });
  };

  // Create booking mutation
  const useCreateBooking = () => {
    return useMutation({
      mutationFn: async (input: CreateBookingInput) => {
        const response = await axios.post(
          `${API_URL}/bookings`,
          {
            propertyId: input.propertyId,
            checkInDate: input.checkInDate.toISOString(),
            checkOutDate: input.checkOutDate.toISOString(),
            numberOfGuests: input.numberOfGuests,
            specialRequests: input.specialRequests,
          },
          axiosConfig
        );
        return response.data.data.booking;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      },
    });
  };

  // Update booking status mutation
  const useUpdateBookingStatus = () => {
    return useMutation({
      mutationFn: async (input: UpdateBookingStatusInput) => {
        const response = await axios.patch(
          `${API_URL}/bookings/${input.bookingId}/status`,
          { status: input.status },
          axiosConfig
        );
        return response.data.data.booking;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingId] });
        queryClient.invalidateQueries({ queryKey: ['host-bookings'] });
      },
    });
  };

  // Cancel booking mutation
  const useCancelBooking = () => {
    return useMutation({
      mutationFn: async (bookingId: string) => {
        const response = await axios.patch(
          `${API_URL}/bookings/${bookingId}/cancel`,
          {},
          axiosConfig
        );
        return response.data.data.booking;
      },
      onSuccess: (_, bookingId) => {
        queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
        queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      },
    });
  };

  return {
    useMyBookings,
    useBookingById,
    useHostBookings,
    useCreateBooking,
    useUpdateBookingStatus,
    useCancelBooking,
  };
}
