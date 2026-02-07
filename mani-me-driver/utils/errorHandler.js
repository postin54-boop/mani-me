/**
 * Centralized API Error Handler for Driver App
 * Provides consistent error extraction and user-friendly messages.
 *
 * Usage:
 *   import { handleApiError, getErrorMessage } from '../utils/errorHandler';
 *
 *   try {
 *     await apiClient.put(`/drivers/pickups/${id}/status`, { status });
 *   } catch (error) {
 *     const message = getErrorMessage(error);
 *     Alert.alert('Error', message);
 *   }
 */

import { Alert } from 'react-native';

/**
 * Extract a user-friendly error message from an API error
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error.isAuthError) {
    return error.authErrorMessage || 'Your session has expired. Please login again.';
  }

  if (error.isOffline || error.isNetworkError || error.message === 'Network Error') {
    return 'No internet connection. Please check your network and try again.';
  }

  if (error.response?.data) {
    const data = error.response.data;
    return data.error || data.message || data.msg || fallback;
  }

  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. The server may be starting up — please try again in a moment.';
  }

  return error.message || fallback;
};

/**
 * Handle an API error with an optional Alert dialog
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
