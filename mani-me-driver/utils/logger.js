/**
 * Logger Utility for Driver App
 * Only logs in development mode to prevent console leaks in production
 * In production, errors are sent to Sentry for crash reporting
 */

import { captureException, captureMessage, addBreadcrumb } from './sentry';

const isDev = __DEV__;

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
    addBreadcrumb('console', args[0]?.toString() || 'log', { args });
  },

  /**
   * Log informational messages
   */
  info: (...args) => {
    if (isDev) {
      console.info('[Driver INFO]', ...args);
    }
    addBreadcrumb('info', args[0]?.toString() || 'info', { args });
  },

  /**
   * Log warning messages
   */
  warn: (...args) => {
    if (isDev) {
      console.warn('[Driver WARN]', ...args);
    }
    captureMessage(args[0]?.toString() || 'warning', 'warning', { args });
  },

  /**
   * Log error messages
   * In production, sends to Sentry crash reporting
   */
  error: (...args) => {
    if (isDev) {
      console.error('[Driver ERROR]', ...args);
    }
    // Report to Sentry
    if (args[0] instanceof Error) {
      captureException(args[0], { additionalArgs: args.slice(1) });
    } else {
      captureException(new Error(args[0]?.toString() || 'Unknown error'), { args });
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
    addBreadcrumb('api', `${method} ${url}`, { data });
  },

  /**
   * Log navigation events
   */
  nav: (screen, params) => {
    if (isDev) {
      console.log(`[Driver NAV] → ${screen}`, params ? params : '');
    }
    addBreadcrumb('navigation', `Navigate to ${screen}`, { params });
  },
  
  /**
   * Track a breadcrumb for crash context
   */
  breadcrumb: (message, category = 'user', data = {}) => {
    addBreadcrumb(category, message, data);
  },
};

export default logger;
