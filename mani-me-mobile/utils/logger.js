/**
 * Development-safe logging utility
 * Only logs in development mode (__DEV__)
 * Prevents sensitive data from leaking in production
 * Errors are sent to Sentry in production
 */

import { captureException, captureMessage, addBreadcrumb } from './sentry';

export const logger = {
  log: (...args) => {
    if (__DEV__) {
      console.log(...args);
    }
    // Add breadcrumb for debugging in Sentry
    addBreadcrumb('console', args[0]?.toString() || 'log', { args });
  },
  
  warn: (...args) => {
    if (__DEV__) {
      console.warn(...args);
    }
    // Warnings are captured as messages in Sentry
    captureMessage(args[0]?.toString() || 'warning', 'warning', { args });
  },
  
  error: (...args) => {
    if (__DEV__) {
      console.error(...args);
    }
    // Find the Error object from any argument position
    // Supports: logger.error(err), logger.error('msg', err), logger.error('msg:', err.message, err)
    const errorObj = args.find(a => a instanceof Error);
    const nonErrorArgs = args.filter(a => !(a instanceof Error));
    const contextStr = nonErrorArgs.map(a => (a != null ? String(a) : '')).filter(Boolean).join(' ');
    if (errorObj) {
      captureException(errorObj, contextStr ? { context: contextStr } : {});
    } else {
      captureException(new Error(contextStr || 'Unknown error'), {});
    }
  },
  
  info: (...args) => {
    if (__DEV__) {
      console.info(...args);
    }
    addBreadcrumb('info', args[0]?.toString() || 'info', { args });
  },
  
  debug: (...args) => {
    if (__DEV__) {
      console.debug(...args);
    }
  },
};

export default logger;
