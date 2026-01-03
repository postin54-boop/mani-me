import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import axiosRetry from 'axios-retry';
import logger from '../utils/logger';

// Get API URL from environment configuration
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || "http://192.168.0.138:4000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

logger.log('API initialized with baseURL:', API_BASE_URL);

// Configure axios-retry with exponential backoff
axiosRetry(api, {
  retries: 3, // Retry up to 3 times
  retryDelay: axiosRetry.exponentialDelay, // 1s, 2s, 4s
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response && error.response.status >= 500);
  },
  onRetry: (retryCount, error, requestConfig) => {
    logger.log(`Retry attempt ${retryCount} for ${requestConfig.url}`);
  },
});

// Add token to all requests
api.interceptors.request.use(
  async (config) => {
    // Check network connectivity before making request
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      const error = new Error('No internet connection');
      error.isNetworkError = true;
      error.isOffline = true;
      return Promise.reject(error);
    }

    try {
      // Try SecureStore first, fallback to AsyncStorage for backward compatibility
      let token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        token = await AsyncStorage.getItem('token');
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      logger.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      logger.warn('Received 401 - Token expired or invalid');
      
      // Clear stored auth data
      try {
        await SecureStore.deleteItemAsync('authToken');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
        
        // Emit event for auth state change (can be listened by UserContext)
        if (global.onAuthExpired) {
          global.onAuthExpired();
        }
      } catch (clearError) {
        logger.error('Error clearing auth data:', clearError);
      }
      
      // Add custom property to identify auth errors
      error.isAuthError = true;
      error.authErrorMessage = 'Your session has expired. Please login again.';
    }

    // Check if it's a network error
    if (error.isOffline || error.message === 'Network Error') {
      error.isNetworkError = true;
      logger.error('Network Error: Device is offline or cannot reach server');
    } else if (error.response) {
      // Server responded with error status
      logger.error('API Error:', error.response.status, error.response.data);
      
      // Handle specific error codes
      if (error.response.status === 403) {
        error.isForbidden = true;
      } else if (error.response.status === 404) {
        error.isNotFound = true;
      } else if (error.response.status >= 500) {
        error.isServerError = true;
      }
    } else if (error.request) {
      // Request made but no response
      error.isNetworkError = true;
      logger.error('Network Error: No response received from server');
    } else {
      // Something else happened
      logger.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const getAddresses = (userId) => api.get(`/addresses/${userId}`);
export const createAddress = (data) => api.post('/addresses', data);
export const updateAddress = (addressId, data) => api.put(`/addresses/${addressId}`, data);
export const deleteAddress = (addressId) => api.delete(`/addresses/${addressId}`);

// 📦 API Helper Functions for common operations
export const API = {
  // Bookings
  createBooking: (data) => api.post("/bookings", data),
  getBookings: () => api.get("/bookings"),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  
  // Payments
  payCash: (data) => api.post("/payment/cash", data),
  payCard: (data) => api.post("/payment/card", data),
  
  // Products
  listProducts: () => api.get("/products"),
  getProductById: (id) => api.get(`/products/${id}`),
  
  // Orders
  placeOrder: (cart) => api.post("/order", cart),
  getOrders: () => api.get("/orders"),
  
  // Shipments
  createShipment: (data) => api.post("/shipments", data),
  getShipments: () => api.get("/shipments"),
  getShipmentById: (id) => api.get(`/shipments/${id}`),
  updateShipmentStatus: (id, status) => api.patch(`/shipments/${id}/status`, { status }),
};

export default api;
