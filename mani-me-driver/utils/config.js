/**
 * Driver App Configuration
 * Centralized configuration for API URLs and environment settings
 */

// Environment detection
const isDev = __DEV__;

// API Configuration
// In production, this should come from environment variables or app config
const DEV_API_URL = 'http://192.168.0.138:4000';
const PROD_API_URL = 'https://api.manime.com'; // Update with your production URL

// Export the appropriate URL based on environment
export const API_BASE_URL = isDev ? DEV_API_URL : PROD_API_URL;

// API endpoints (for consistency)
export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  UPDATE_PUSH_TOKEN: '/api/auth/update-push-token',
  
  // Driver
  DRIVER_ASSIGNMENTS: (driverId) => `/api/drivers/${driverId}/assignments`,
  DRIVER_ALERTS: (driverId) => `/api/notifications/driver/${driverId}`,
  
  // Shipments
  SHIPMENTS: '/api/shipments',
  SHIPMENT_BY_ID: (id) => `/api/shipments/${id}`,
  SHIPMENT_STATUS: (id) => `/api/shipments/${id}/status`,
  
  // Cash
  CASH_RECONCILIATION: '/api/cash-reconciliation',
  
  // Chat
  CHAT_SEND: '/api/chat/send',
  CHAT_MESSAGES: (shipmentId) => `/api/chat/messages/${shipmentId}`,
};

// App Configuration
export const APP_CONFIG = {
  // Request timeouts
  REQUEST_TIMEOUT: 15000, // 15 seconds
  
  // Cache durations (in milliseconds)
  CACHE_DURATION: 2 * 60 * 1000, // 2 minutes
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Feature flags
export const FEATURES = {
  ENABLE_OFFLINE_MODE: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_CASH_TRACKING: true,
};

export default {
  API_BASE_URL,
  ENDPOINTS,
  APP_CONFIG,
  FEATURES,
  isDev,
};
