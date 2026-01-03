/**
 * Logger Utility for Admin Dashboard
 * Only logs in development mode to prevent console leaks in production
 */

const isDev = process.env.NODE_ENV === 'development';

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
      console.log('[Admin]', ...args);
    }
  },

  /**
   * Log informational messages
   */
  info: (...args) => {
    if (isDev) {
      console.info('[Admin INFO]', ...args);
    }
  },

  /**
   * Log warning messages
   */
  warn: (...args) => {
    if (isDev) {
      console.warn('[Admin WARN]', ...args);
    }
  },

  /**
   * Log error messages
   * In production, these could be sent to an error tracking service
   */
  error: (...args) => {
    if (isDev) {
      console.error('[Admin ERROR]', ...args);
    }
    // TODO: In production, send to error tracking service like Sentry
    // if (!isDev) {
    //   Sentry.captureException(args[0]);
    // }
  },

  /**
   * Log debug information (verbose)
   */
  debug: (...args) => {
    if (isDev) {
      console.debug('[Admin DEBUG]', ...args);
    }
  },

  /**
   * Log API requests/responses
   */
  api: (method, url, data) => {
    if (isDev) {
      console.log(`[Admin API] ${method} ${url}`, data || '');
    }
  },

  /**
   * Log table/component actions
   */
  action: (component, action, data) => {
    if (isDev) {
      console.log(`[Admin ${component}] ${action}`, data || '');
    }
  },
};

export default logger;
