import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/auth-context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface SearchPropertiesInput {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  amenities?: string[];
  propertyType?: string;
  page?: number;
  limit?: number;
}

interface CreatePropertyInput {
  title: string;
  description: string;
  propertyType: string;
  location: {
    address: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  pricePerNight: number;
  cancellationPolicy: 'FLEXIBLE' | 'MODERATE' | 'STRICT';
  images?: string[];
}

interface UpdatePropertyInput extends Partial<CreatePropertyInput> {
  id: string;
}

export function useProperty() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const axiosConfig = {
    headers: { Authorization: `Bearer ${accessToken}` },
  };

  // Search properties
  const useSearchProperties = (input: SearchPropertiesInput) => {
    return useQuery({
      queryKey: ['properties-search', input],
      queryFn: async () => {
        const response = await axios.get(`${API_URL}/properties/search`, {
          params: {
            location: input.location,
            minPrice: input.minPrice,
            maxPrice: input.maxPrice,
            guests: input.guests,
            amenities: input.amenities?.join(','),
            propertyType: input.propertyType,
            page: input.page || 1,
            limit: input.limit || 20,
          },
        });
        return response.data.data;
      },
    });
  };

  // Get property by ID
  const usePropertyById = (propertyId: string) => {
    return useQuery({
      queryKey: ['property', propertyId],
      queryFn: async () => {
        const response = await axios.get(`${API_URL}/properties/${propertyId}`);
        return response.data.data.property;
      },
      enabled: !!propertyId,
    });
  };

  // Get user's properties
  const useMyProperties = (page = 1, limit = 20) => {
    return useQuery({
      queryKey: ['my-properties', page, limit],
      queryFn: async () => {
        const response = await axios.get(`${API_URL}/properties/my/properties`, {
          ...axiosConfig,
          params: { page, limit },
        });
        return response.data.data;
      },
    });
  };

  // Create property mutation
  const useCreateProperty = () => {
    return useMutation({
      mutationFn: async (input: CreatePropertyInput) => {
        const response = await axios.post(
          `${API_URL}/properties`,
          input,
          axiosConfig
        );
        return response.data.data.property;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      },
    });
  };

  // Update property mutation
  const useUpdateProperty = () => {
    return useMutation({
      mutationFn: async (input: UpdatePropertyInput) => {
        const { id, ...data } = input;
        const response = await axios.patch(
          `${API_URL}/properties/${id}`,
          data,
          axiosConfig
        );
        return response.data.data.property;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['property', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      },
    });
  };

  // Delete property mutation
  const useDeleteProperty = () => {
    return useMutation({
      mutationFn: async (propertyId: string) => {
        await axios.delete(`${API_URL}/properties/${propertyId}`, axiosConfig);
        return propertyId;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      },
    });
  };

  // Publish property mutation
  const usePublishProperty = () => {
    return useMutation({
      mutationFn: async (propertyId: string) => {
        const response = await axios.patch(
          `${API_URL}/properties/${propertyId}/publish`,
          { published: true },
          axiosConfig
        );
        return response.data.data.property;
      },
      onSuccess: (_, propertyId) => {
        queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      },
    });
  };

  // Unpublish property mutation
  const useUnpublishProperty = () => {
    return useMutation({
      mutationFn: async (propertyId: string) => {
        const response = await axios.patch(
          `${API_URL}/properties/${propertyId}/publish`,
          { published: false },
          axiosConfig
        );
        return response.data.data.property;
      },
      onSuccess: (_, propertyId) => {
        queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
        queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      },
    });
  };

  return {
    useSearchProperties,
    usePropertyById,
    useMyProperties,
    useCreateProperty,
    useUpdateProperty,
    useDeleteProperty,
    usePublishProperty,
    useUnpublishProperty,
  };
}
