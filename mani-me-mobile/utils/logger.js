/**
 * Development-safe logging utility
 * Only logs in development mode (__DEV__)
 * Prevents sensitive data from leaking in production
 */

export const logger = {
  log: (...args) => {
    if (__DEV__) {
      console.log(...args);
    }
  },
  
  warn: (...args) => {
    if (__DEV__) {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    if (__DEV__) {
      console.error(...args);
    }
    // In production, you could send errors to a service like Sentry
    // Example: Sentry.captureException(args[0]);
  },
  
  info: (...args) => {
    if (__DEV__) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (__DEV__) {
      console.debug(...args);
    }
  },
};

export default logger;
