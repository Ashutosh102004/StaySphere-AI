import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface BlockDatesInput {
  propertyId: string;
  startDate: Date;
  endDate: Date;
}

interface SetPricingInput {
  propertyId: string;
  startDate: Date;
  endDate: Date;
  customPrice: number;
}

interface SetStayRequirementsInput {
  propertyId: string;
  startDate: Date;
  endDate: Date;
  minStay: number;
  maxStay: number;
}

interface SetLeadTimeInput {
  propertyId: string;
  startDate: Date;
  endDate: Date;
  leadDays: number;
}

interface SetAdvanceNoticeInput {
  propertyId: string;
  startDate: Date;
  endDate: Date;
  advanceNoticeDays: number;
}

export function useAvailability(propertyId: string) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  // Get property availabilities
  const useAvailabilities = (page = 1, limit = 50) => {
    return useQuery({
      queryKey: ['availabilities', propertyId, page, limit],
      queryFn: async () => {
        const response = await axios.get(
          `${API_URL}/availability/properties/${propertyId}/availabilities`,
          { ...axiosConfig, params: { page, limit } }
        );
        return response.data.data;
      },
    });
  };

  // Query availability for date range (for guests)
  const useAvailabilityQuery = (startDate: Date, endDate: Date) => {
    return useQuery({
      queryKey: ['availability-query', propertyId, startDate, endDate],
      queryFn: async () => {
        const response = await axios.get(
          `${API_URL}/availability/properties/${propertyId}/query`,
          {
            params: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          }
        );
        return response.data.data;
      },
    });
  };

  // Get effective price for a date
  const useEffectivePrice = (date: Date) => {
    return useQuery({
      queryKey: ['effective-price', propertyId, date],
      queryFn: async () => {
        const response = await axios.get(
          `${API_URL}/availability/properties/${propertyId}/effective-price`,
          {
            params: {
              date: date.toISOString(),
            },
          }
        );
        return response.data.data.effectivePrice;
      },
    });
  };

  // Block dates mutation
  const useBlockDates = () => {
    return useMutation({
      mutationFn: async (input: BlockDatesInput) => {
        const response = await axios.post(
          `${API_URL}/availability/block/dates`,
          {
            propertyId: input.propertyId,
            startDate: input.startDate.toISOString(),
            endDate: input.endDate.toISOString(),
          },
          axiosConfig
        );
        return response.data.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['availabilities', propertyId] });
      },
    });
  };

  // Unblock dates mutation
  const useUnblockDates = () => {
    return useMutation({
      mutationFn: async (input: BlockDatesInput) => {
        const response = await axios.post(
          `${API_URL}/availability/unblock/dates`,
          {
            propertyId: input.propertyId,
            startDate: input.startDate.toISOString(),
            endDate: input.endDate.toISOString(),
          },
          axiosConfig
        );
        return response.data.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['availabilities', propertyId] });
      },
    });
  };

  // Set pricing mutation
  const useSetPricing = () => {
    return useMutation({
      mutationFn: async (input: SetPricingInput) => {
        const response = await axios.post(
          `${API_URL}/availability/pricing/set`,
          {
            propertyId: input.propertyId,
            startDate: input.startDate.toISOString(),
            endDate: input.endDate.toISOString(),
            customPrice: input.customPrice,
          },
          axiosConfig
        );
        return response.data.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['availabilities', propertyId] });
      },
    });
  };

  // Set stay requirements mutation
  const useSetStayRequirements = () => {
    return useMutation({
      mutationFn: async (input: SetStayRequirementsInput) => {
        const response = await axios.post(
          `${API_URL}/availability/requirements/stay`,
          {
            propertyId: input.propertyId,
            startDate: input.startDate.toISOString(),
            endDate: input.endDate.toISOString(),
            minStay: input.minStay,
            maxStay: input.maxStay,
          },
          axiosConfig
        );
        return response.data.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['availabilities', propertyId] });
      },
    });
  };

  // Set lead time mutation
  const useSetLeadTime = () => {
    return useMutation({
      mutationFn: async (input: SetLeadTimeInput) => {
        const response = await axios.post(
          `${API_URL}/availability/requirements/lead-time`,
          {
            propertyId: input.propertyId,
            startDate: input.startDate.toISOString(),
            endDate: input.endDate.toISOString(),
            leadDays: input.leadDays,
          },
          axiosConfig
        );
        return response.data.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['availabilities', propertyId] });
      },
    });
  };

  // Set advance notice mutation
  const useSetAdvanceNotice = () => {
    return useMutation({
      mutationFn: async (input: SetAdvanceNoticeInput) => {
        const response = await axios.post(
          `${API_URL}/availability/requirements/advance-notice`,
          {
            propertyId: input.propertyId,
            startDate: input.startDate.toISOString(),
            endDate: input.endDate.toISOString(),
            advanceNoticeDays: input.advanceNoticeDays,
          },
          axiosConfig
        );
        return response.data.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['availabilities', propertyId] });
      },
    });
  };

  // Validate stay duration
  const useValidateStayDuration = (checkIn: Date, checkOut: Date) => {
    return useQuery({
      queryKey: ['validate-stay', propertyId, checkIn, checkOut],
      queryFn: async () => {
        const response = await axios.get(
          `${API_URL}/availability/properties/${propertyId}/validate/stay-duration`,
          {
            params: {
              checkIn: checkIn.toISOString(),
              checkOut: checkOut.toISOString(),
            },
          }
        );
        return response.data.data;
      },
      enabled: !!(checkIn && checkOut),
    });
  };

  return {
    useAvailabilities,
    useAvailabilityQuery,
    useEffectivePrice,
    useBlockDates,
    useUnblockDates,
    useSetPricing,
    useSetStayRequirements,
    useSetLeadTime,
    useSetAdvanceNotice,
    useValidateStayDuration,
  };
}
