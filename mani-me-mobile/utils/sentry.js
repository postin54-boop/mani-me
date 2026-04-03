/**
 * Sentry Configuration for Mani Me Customer App
 * Using @sentry/react-native directly (sentry-expo was deprecated after Expo SDK 49)
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Sentry DSN - configured for Mani Me
const SENTRY_DSN = 'https://ca92ece6e715e60ecf6f698cf29f375b@o4511077071060992.ingest.de.sentry.io/4511077087445072';

const isDev = __DEV__;

/**
 * Initialize Sentry - call this at app startup
 */
export const initSentry = () => {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      debug: isDev,
      environment: isDev ? 'development' : 'production',
      release: `com.manime.app@${Constants.expoConfig?.version || '1.0.0'}`,
    });
    if (isDev) console.log('[Sentry] Initialized');
  } catch (e) {
    console.log('[Sentry] Init failed:', e);
  }
};

/**
 * Set user context for better error tracking
 */
export const setUserContext = (user) => {
  try {
    if (!user) { Sentry.setUser(null); return; }
    Sentry.setUser({
      id: user.id || user._id,
      email: user.email,
      username: user.name,
    });
  } catch (e) {}
};

/**
 * Clear user context on logout
 */
export const clearUserContext = () => {
  try { Sentry.setUser(null); } catch (e) {}
};

/**
 * Capture an exception
 */
export const captureException = (error, context = {}) => {
  if (isDev) {
    console.error('[Sentry] Would capture:', error);
    return;
  }
  try { Sentry.captureException(error, { extra: context }); } catch (e) {}
};

/**
 * Capture a message
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (isDev) {
    console.log(`[Sentry] Would capture message (${level}):`, message);
    return;
  }
  try { Sentry.captureMessage(message, { level, extra: context }); } catch (e) {}
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (category, message, data = {}) => {
  try {
    Sentry.addBreadcrumb({ category, message, data, level: 'info' });
  } catch (e) {}
};

export default Sentry;
