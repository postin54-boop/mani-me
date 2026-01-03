/**
 * Error handling utilities for Admin Dashboard
 */

/**
 * Extract user-friendly error message from API error
 */
export const getErrorMessage = (error) => {
  // Network error
  if (!error.response) {
    if (error.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    return error.message || 'An unexpected error occurred';
  }

  // API returned an error
  const { status, data } = error.response;

  // Check for structured error message
  if (data?.message) {
    return data.message;
  }
  if (data?.error) {
    return data.error;
  }

  // Fallback based on status code
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with existing data.';
    case 422:
      return 'Invalid data provided. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return `Error (${status}): Something went wrong.`;
  }
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error) => {
  return error?.response?.status === 401;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error) => {
  return !error.response && error.message === 'Network Error';
};

/**
 * Format validation errors from API (usually 422 responses)
 */
export const formatValidationErrors = (error) => {
  const data = error?.response?.data;
  
  if (data?.errors && typeof data.errors === 'object') {
    // Handle { errors: { field: ['message1', 'message2'] } }
    const messages = [];
    for (const [field, fieldErrors] of Object.entries(data.errors)) {
      if (Array.isArray(fieldErrors)) {
        messages.push(`${field}: ${fieldErrors.join(', ')}`);
      } else {
        messages.push(`${field}: ${fieldErrors}`);
      }
    }
    return messages.join('\n');
  }
  
  return getErrorMessage(error);
};

export default {
  getErrorMessage,
  isAuthError,
  isNetworkError,
  formatValidationErrors,
};
