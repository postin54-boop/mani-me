/**
 * Sentry Configuration for Mani Me Driver App
 * 
 * To complete setup:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new React Native project (or use same as customer app)
 * 3. Copy your DSN and replace the placeholder below
 * 4. The app will automatically report crashes in production
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Replace with your actual Sentry DSN from https://sentry.io
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || 
  'https://YOUR_DSN_HERE@sentry.io/YOUR_PROJECT_ID';

const isDev = __DEV__;

/**
 * Initialize Sentry - call this at app startup
 */
export const initSentry = () => {
  // Skip initialization if no valid DSN or in development
  if (isDev || !SENTRY_DSN || SENTRY_DSN.includes('YOUR_DSN_HERE')) {
    console.log('[Sentry] Skipped - development mode or no DSN configured');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: Constants.expoConfig?.extra?.environment || 'production',
    release: `com.manime.driver@${Constants.expoConfig?.version || '1.0.0'}`,
    dist: Constants.expoConfig?.version || '1.0.0',
    
    // Performance monitoring
    tracesSampleRate: 0.2, // 20% of transactions
    
    // Only send errors in production
    enabled: !isDev,
    
    // Additional configuration
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    
    // Attach user info when available
    beforeSend: (event) => {
      // You can modify or filter events here
      return event;
    },
  });
};

/**
 * Set user context for better error tracking
 */
export const setUserContext = (user) => {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  
  Sentry.setUser({
    id: user.id || user._id,
    email: user.email,
    username: user.name,
  });
};

/**
 * Clear user context on logout
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Capture an exception
 */
export const captureException = (error, context = {}) => {
  if (isDev) {
    console.error('[Sentry] Would capture:', error);
    return;
  }
  
  Sentry.captureException(error, {
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
  
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (category, message, data = {}) => {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
};

export default Sentry;
