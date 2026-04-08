/**
 * Sentry Configuration for Mani Me Driver App
 * NOTE: @sentry/react-native not yet installed - all functions are no-ops.
 * Run `npx expo install @sentry/react-native` then restore the real import.
 */

export const initSentry = () => {};
export const setUserContext = () => {};
export const clearUserContext = () => {};
export const captureException = (error) => { if (__DEV__) console.warn('[Sentry] Would capture:', error); };
export const captureMessage = (message, level = 'info') => { if (__DEV__) console.log(`[Sentry] ${level}: ${message}`); };
export const addBreadcrumb = () => {};

export default {
  init: () => {},
  setUser: () => {},
  captureException: () => {},
  captureMessage: () => {},
  addBreadcrumb: () => {},
  withScope: (cb) => cb({ setExtra: () => {}, setTag: () => {}, setLevel: () => {} }),
  wrap: (component) => component,
};
