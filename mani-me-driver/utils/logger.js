/**
 * Logger Utility for Driver App
 * Only logs in development mode to prevent console leaks in production
 * In production, errors are sent to Sentry for crash reporting
 */

const isDev = __DEV__;

// Lazy-load Sentry to avoid import errors if not installed
let Sentry = null;
const getSentry = () => {
  if (Sentry === null && !isDev) {
    try {
      Sentry = require('@sentry/react-native');
    } catch {
      Sentry = false; // Mark as unavailable
    }
  }
  return Sentry || null;
};

/**
 * Report error to Sentry in production
 */
const reportToSentry = (error, context = {}) => {
  if (isDev) return;
  
  const sentry = getSentry();
  if (sentry) {
    try {
      if (error instanceof Error) {
        sentry.captureException(error, { extra: context });
      } else {
        sentry.captureMessage(String(error), { 
          level: 'error',
          extra: context,
        });
      }
    } catch (e) {
      // Sentry reporting failed silently
    }
  }
};

/**
 * Development-safe logger
 * All methods are no-ops in production (except errors which go to Sentry)
 */
const logger = {
  /**
   * Log general information
   */
  log: (...args) => {
    if (isDev) {
      console.log('[Driver]', ...args);
    }
  },

  /**
   * Log informational messages
   */
  info: (...args) => {
    if (isDev) {
      console.info('[Driver INFO]', ...args);
    }
  },

  /**
   * Log warning messages
   */
  warn: (...args) => {
    if (isDev) {
      console.warn('[Driver WARN]', ...args);
    }
  },

  /**
   * Log error messages
   * In production, sends to Sentry crash reporting
   */
  error: (...args) => {
    if (isDev) {
      console.error('[Driver ERROR]', ...args);
    } else {
      // Report to Sentry in production
      const error = args[0];
      const context = args.length > 1 ? { additionalInfo: args.slice(1) } : {};
      reportToSentry(error, context);
    }
  },

  /**
   * Log debug information (verbose)
   */
  debug: (...args) => {
    if (isDev) {
      console.debug('[Driver DEBUG]', ...args);
    }
  },

  /**
   * Log API requests/responses
   */
  api: (method, url, data) => {
    if (isDev) {
      console.log(`[Driver API] ${method} ${url}`, data ? data : '');
    }
  },

  /**
   * Log navigation events
   */
  nav: (screen, params) => {
    if (isDev) {
      console.log(`[Driver NAV] → ${screen}`, params ? params : '');
    }
  },
  
  /**
   * Track a breadcrumb for crash context
   */
  breadcrumb: (message, category = 'user', data = {}) => {
    if (!isDev) {
      const sentry = getSentry();
      if (sentry) {
        sentry.addBreadcrumb({
          message,
          category,
          data,
          level: 'info',
        });
      }
    }
  },
};

export default logger;
