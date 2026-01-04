/**
 * Admin Dashboard Configuration
 * Centralized configuration for API URLs and environment settings
 */

// Environment detection (Create React App uses NODE_ENV)
const isDev = process.env.NODE_ENV === 'development';

// API Configuration
const DEV_API_URL = 'http://192.168.0.138:4000';
const PROD_API_URL = process.env.REACT_APP_API_URL || 'https://api.manime.com';

// Export the appropriate URL based on environment
export const API_BASE_URL = isDev ? DEV_API_URL : PROD_API_URL;

// API endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/admin/login',
  
  // Dashboard
  STATS: '/api/admin/stats',
  NOTIFICATIONS: '/api/notifications/admin',
  
  // Orders & Shipments
  ORDERS: '/api/admin/orders',
  ORDER_STATUS: (id) => `/api/admin/orders/${id}/status`,
  SHIPMENTS: '/api/shipments',
  WAREHOUSE_STATUS: (id) => `/api/shipments/warehouse/${id}/status`,
  
  // Users
  USERS: '/api/users',
  USER_STATUS: (id) => `/api/users/${id}/status`,
  
  // Drivers
  UK_DRIVERS: '/api/drivers/uk',
  GHANA_DRIVERS: '/api/drivers/ghana',
  
  // Products
  GROCERY_ITEMS: '/api/grocery',
  PACKAGING_ITEMS: '/api/packaging',
  
  // Settings
  SETTINGS: (key) => `/api/settings/${key}`,
  
  // Cash
  CASH_RECONCILIATION: '/api/cash-reconciliation',
  
  // Labels
  SHIPMENT_LABEL: (id) => `/api/labels/shipment/${id}`,
  
  // Prices
  PARCEL_PRICES: '/api/parcel-prices',
  PARCEL_ITEMS: '/api/parcel-items',
  
  // Promo Codes
  PROMO_CODES: '/api/promo-codes',
};

// App Configuration
export const APP_CONFIG = {
  // Request timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50],
  
  // Token storage key
  TOKEN_KEY: 'adminToken',
  ADMIN_ID_KEY: 'adminId',
};

// Feature flags
export const FEATURES = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_CASH_RECONCILIATION: true,
  ENABLE_LABEL_PRINTING: true,
};

export default {
  API_BASE_URL,
  ENDPOINTS,
  APP_CONFIG,
  FEATURES,
  isDev,
};
