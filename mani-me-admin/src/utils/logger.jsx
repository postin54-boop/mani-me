/**
 * Logger Utility for Admin Dashboard
 * Only logs in development mode to prevent console leaks in production
 */

import * as Sentry from '@sentry/react';

const isDev = import.meta.env.MODE === 'development';
const sentryEnabled = !isDev && Boolean(import.meta.env.VITE_SENTRY_DSN);

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
    if (sentryEnabled) {
      Sentry.captureMessage(args[0]?.toString() || 'Admin warning', 'warning');
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

    if (sentryEnabled) {
      if (args[0] instanceof Error) {
        Sentry.captureException(args[0], {
          extra: { args: args.slice(1) },
        });
      } else {
        Sentry.captureException(new Error(args[0]?.toString() || 'Admin error'), {
          extra: { args },
        });
      }
    }
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
    if (sentryEnabled) {
      Sentry.addBreadcrumb({
        category: 'api',
        message: `${method} ${url}`,
        level: 'info',
        data: data || {},
      });
    }
  },

  /**
   * Log table/component actions
   */
  action: (component, action, data) => {
    if (isDev) {
      console.log(`[Admin ${component}] ${action}`, data || '');
    }
    if (sentryEnabled) {
      Sentry.addBreadcrumb({
        category: 'ui.action',
        message: `${component}: ${action}`,
        level: 'info',
        data: data || {},
      });
    }
  },
};

export default logger;
