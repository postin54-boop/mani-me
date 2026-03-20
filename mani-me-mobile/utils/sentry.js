/**
 * Sentry Configuration for Mani Me Customer App
 * Using sentry-expo for Expo compatibility
 */

import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';

// Sentry DSN - configured for Mani Me
const SENTRY_DSN = 'https://ca92ece6e715e60ecf6f698cf29f375b@o4511077071060992.ingest.de.sentry.io/4511077087445072';

const isDev = __DEV__;

/**
 * Initialize Sentry - call this at app startup
 */
export const initSentry = () => {
  Sentry.init({
    dsn: SENTRY_DSN,
    enableInExpoDevelopment: false, // Don't send errors in dev mode
    debug: isDev, // Show debug logs in dev
    environment: isDev ? 'development' : 'production',
    release: `com.manime.app@${Constants.expoConfig?.version || '1.0.0'}`,
  });
  console.log('[Sentry] Initialized');
};

/**
 * Set user context for better error tracking
 */
export const setUserContext = (user) => {
  if (!user) {
    Sentry.Native.setUser(null);
    return;
  }
  
  Sentry.Native.setUser({
    id: user.id || user._id,
    email: user.email,
    username: user.name,
  });
};

/**
 * Clear user context on logout
 */
export const clearUserContext = () => {
  Sentry.Native.setUser(null);
};

/**
 * Capture an exception
 */
export const captureException = (error, context = {}) => {
  if (isDev) {
    console.error('[Sentry] Would capture:', error);
    return;
  }
  
  Sentry.Native.captureException(error, {
    extra: context,
  });
};

/**
 * Capture a message
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (isDev) {
    console.log(`[Sentry] Would capture message (${level}):`, message);
    return;
  }
  
  Sentry.Native.captureMessage(message, {
    level,
    extra: context,
  });
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (category, message, data = {}) => {
  Sentry.Native.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
};

export default Sentry;
