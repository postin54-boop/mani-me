// utils/api.js
import axios from 'axios';
import { API_BASE_URL } from './config';
import logger from './logger';
import secureStorage from './secureStorage';

const API_BASE = `${API_BASE_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token to all requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      logger.error('Error getting token for request:', error);
    }
    
    logger.api(config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 5;
      logger.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
      
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }
      
      if (originalRequest._retryCount < 3) {
        originalRequest._retryCount++;
        
        // Wait with exponential backoff
        const delay = Math.min(retryAfter * 1000 * Math.pow(2, originalRequest._retryCount - 1), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return apiClient(originalRequest);
      }
    }
    
    // Handle network errors with retry
    if (!error.response && error.code === 'ECONNABORTED') {
      logger.warn('Request timeout, retrying...');
      
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }
      
      if (originalRequest._retryCount < 2) {
        originalRequest._retryCount++;
        const delay = 1000 * originalRequest._retryCount;
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient(originalRequest);
      }
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      logger.warn('Unauthorized request - token may be invalid');
      // AuthContext will handle logout via token refresh failure
    }
    
    // Handle 5xx Server errors with retry
    if (error.response?.status >= 500) {
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }
      
      if (originalRequest._retryCount < 2) {
        originalRequest._retryCount++;
        const delay = 1000 * originalRequest._retryCount;
        logger.warn(`Server error ${error.response.status}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiClient(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

// Fetch assignments for a driver (pickup or delivery)
export const fetchDriverAssignments = async (driverId, type) => {
  // type: 'pickup' or 'delivery'
  return apiClient.get(`/shipments/driver/${driverId}?type=${type}`);
};

// Fetch latest alerts/messages for a driver
export const fetchDriverAlerts = async (driverId) => {
  return apiClient.get(`/notifications/driver/${driverId}`);
};

export const submitCashReconciliation = async ({ driver_id, amount, photoUrl, token }) => {
  return apiClient.post(
    '/cash-reconciliation',
    { driverId: driver_id, amount, photoUrl },
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
};

// Export the configured client for direct use
export default apiClient;
