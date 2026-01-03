/**
 * Logger Utility for Driver App
 * Only logs in development mode to prevent console leaks in production
 */

const isDev = __DEV__;

/**
 * Development-safe logger
 * All methods are no-ops in production
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
   * Note: In production, you might want to send these to a crash reporting service
   */
  error: (...args) => {
    if (isDev) {
      console.error('[Driver ERROR]', ...args);
    }
    // TODO: In production, send to crash reporting service like Sentry
    // if (!isDev) {
    //   Sentry.captureException(args[0]);
    // }
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
};

export default logger;
