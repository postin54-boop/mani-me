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
    // Errors are captured as exceptions in Sentry
    if (args[0] instanceof Error) {
      captureException(args[0], { additionalArgs: args.slice(1) });
    } else {
      captureException(new Error(args[0]?.toString() || 'Unknown error'), { args });
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
