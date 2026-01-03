import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

/**
 * Custom hook to fetch grocery items with caching
 */
export function useGroceryItems(category = 'grocery') {
  return useQuery({
    queryKey: ['groceryItems', category],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/grocery/items?category=${category}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

/**
 * Custom hook to fetch packaging items with caching
 */
export function usePackagingItems() {
  return useQuery({
    queryKey: ['packagingItems'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/packaging/items`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}

/**
 * Custom hook to fetch user orders with caching
 */
export function useOrders(userId) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/orders`);
      return response.data;
    },
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 2 * 60 * 1000, // 2 minutes for orders
    cacheTime: 5 * 60 * 1000,
  });
}

/**
 * Custom hook to fetch shipment tracking info
 */
export function useShipmentTracking(trackingNumber) {
  return useQuery({
    queryKey: ['shipment', trackingNumber],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/shipments/track/${trackingNumber}`);
      return response.data;
    },
    enabled: !!trackingNumber,
    staleTime: 1 * 60 * 1000, // 1 minute for tracking
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  });
}

/**
 * Mutation hook for creating grocery orders
 */
export function useCreateGroceryOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData) => {
      const response = await axios.post(`${API_BASE_URL}/api/grocery/orders`, orderData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate orders cache to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['groceryItems'] });
    },
  });
}

/**
 * Mutation hook for creating packaging orders
 */
export function useCreatePackagingOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData) => {
      const response = await axios.post(`${API_BASE_URL}/api/packaging/orders`, orderData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['packagingItems'] });
    },
  });
}

/**
 * Mutation hook for creating shipments
 */
export function useCreateShipment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shipmentData) => {
      const response = await axios.post(`${API_BASE_URL}/api/shipments`, shipmentData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
