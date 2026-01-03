import axios from 'axios';
import { API_BASE_URL, APP_CONFIG } from './config';
import logger from './utils/logger';
import { isAuthError } from './utils/errorHandler';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: APP_CONFIG.REQUEST_TIMEOUT,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  logger.api(config.method?.toUpperCase(), config.url);
  return config;
});

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('API Error:', error.response?.status, error.response?.data?.message || error.message);
    
    // Handle 401 - redirect to login
    if (isAuthError(error)) {
      localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
      localStorage.removeItem(APP_CONFIG.ADMIN_ID_KEY);
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Re-export API_BASE_URL for backward compatibility
export { API_BASE_URL };
export default api;
