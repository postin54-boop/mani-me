// utils/optimizedApi.js - Optimized API layer for high-load scenarios
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';
import logger from './logger';

const API_BASE = `${API_BASE_URL}/api`;

// Create axios instance with optimized settings
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - clear auth and redirect to login
      await AsyncStorage.multiRemove(['token', 'user']);
      // You can emit an event here to trigger logout
    }
    return Promise.reject(error);
  }
);

// Cache management
const cache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const getCacheKey = (endpoint, params) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Fetch driver assignments with pagination
export const fetchDriverAssignmentsPaginated = async (driverId, type, page = 1, limit = 20) => {
  const cacheKey = getCacheKey('assignments', { driverId, type, page, limit });
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (isCacheValid(timestamp)) {
      return { data, fromCache: true };
    }
  }

  try {
    const response = await apiClient.get(`/drivers/${driverId}/assignments`, {
      params: { type, page, limit },
    });
    
    // Cache the response
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });
    
    return { data: response.data, fromCache: false };
  } catch (error) {
    logger.error('Error fetching assignments:', error);
    throw error;
  }
};

// Fetch alerts with caching
export const fetchDriverAlertsOptimized = async (driverId) => {
  const cacheKey = getCacheKey('alerts', { driverId });
  
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (isCacheValid(timestamp)) {
      return { data, fromCache: true };
    }
  }

  try {
    const response = await apiClient.get(`/notifications/driver/${driverId}`, {
      params: { limit: 50 },
    });
    
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });
    
    return { data: response.data, fromCache: false };
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    throw error;
  }
};

// Submit cash reconciliation with retry logic
export const submitCashReconciliationOptimized = async ({ driver_id, amount, photoUrl }, retries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await apiClient.post('/cash-reconciliation', {
        driverId: driver_id,
        amount,
        photoUrl,
      });
      return response.data;
    } catch (error) {
      lastError = error;
      logger.warn(`Cash reconciliation attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }
  
  throw lastError;
};

// Update pickup status with optimistic updates
export const updatePickupStatus = async (pickupId, status) => {
  try {
    const response = await apiClient.put(`/drivers/pickups/${pickupId}/status`, {
      status,
    });
    
    // Clear relevant caches
    clearCacheByPattern('assignments');
    
    return response.data;
  } catch (error) {
    logger.error('Error updating pickup status:', error);
    throw error;
  }
};

// Update delivery status
export const updateDeliveryStatus = async (deliveryId, status, proofData = null) => {
  try {
    const response = await apiClient.put(`/drivers/deliveries/${deliveryId}/status`, {
      status,
      ...proofData,
    });
    
    clearCacheByPattern('assignments');
    
    return response.data;
  } catch (error) {
    logger.error('Error updating delivery status:', error);
    throw error;
  }
};

// Clear cache by pattern
export const clearCacheByPattern = (pattern) => {
  const keysToDelete = [];
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
};

// Clear all cache
export const clearAllCache = () => {
  cache.clear();
};

// Batch API calls for efficiency
export const batchFetchDriverData = async (driverId, type) => {
  try {
    const [assignmentsResult, alertsResult] = await Promise.all([
      fetchDriverAssignmentsPaginated(driverId, type, 1, 20),
      fetchDriverAlertsOptimized(driverId),
    ]);
    
    return {
      assignments: assignmentsResult.data,
      alerts: alertsResult.data,
    };
  } catch (error) {
    logger.error('Error batch fetching driver data:', error);
    throw error;
  }
};

export default apiClient;
