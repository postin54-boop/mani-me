/**
 * Centralized API Error Handler
 * Provides consistent error extraction and user-friendly messages
 * across the mobile app.
 *
 * Usage:
 *   import { handleApiError, getErrorMessage } from '../utils/errorHandler';
 *
 *   try {
 *     await api.post('/shipments', data);
 *   } catch (error) {
 *     const message = getErrorMessage(error);
 *     Alert.alert('Error', message);
 *   }
 */

import { Alert } from 'react-native';

/**
 * Extract a user-friendly error message from an API error
 * @param {Error} error - Axios error or generic error
 * @param {string} fallback - Fallback message if none can be extracted
 * @returns {string} Human-readable error message
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  // Auth-specific errors
  if (error.isAuthError) {
    return error.authErrorMessage || 'Your session has expired. Please login again.';
  }

  // Network / offline errors
  if (error.isOffline || error.isNetworkError || error.message === 'Network Error') {
    return 'No internet connection. Please check your network and try again.';
  }

  // Server responded with an error
  if (error.response?.data) {
    const data = error.response.data;
    // Support both { error: '...' } and { message: '...' } formats
    return data.error || data.message || data.msg || fallback;
  }

  // Timeout
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. The server may be starting up — please try again in a moment.';
  }

  // Forbidden
  if (error.isForbidden) {
    return 'You do not have permission to perform this action.';
  }

  // Not found
  if (error.isNotFound) {
    return 'The requested resource was not found.';
  }

  // Server error
  if (error.isServerError) {
    return 'Server error. Please try again later.';
  }

  return error.message || fallback;
};

/**
 * Handle an API error with an optional Alert dialog
 * @param {Error} error - The error from an API call
 * @param {Object} options
 * @param {string} options.title - Alert title (default: 'Error')
 * @param {string} options.fallback - Fallback message
 * @param {boolean} options.showAlert - Whether to show an Alert (default: true)
 * @returns {string} The error message
 */
export const handleApiError = (error, options = {}) => {
  const { title = 'Error', fallback, showAlert = true } = options;
  const message = getErrorMessage(error, fallback);

  if (showAlert) {
    Alert.alert(title, message);
  }

  return message;
};

export default { getErrorMessage, handleApiError };
