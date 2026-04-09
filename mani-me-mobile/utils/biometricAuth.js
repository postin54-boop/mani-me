/**
 * Biometric Authentication Utility
 * Uses expo-local-authentication for Face ID, Touch ID, and fingerprint auth
 */
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';

/**
 * Check if device supports biometric authentication
 */
export const isBiometricSupported = async () => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  } catch (error) {
    logger.error('Error checking biometric support:', error);
    return false;
  }
};

/**
 * Get available biometric types (Face ID, Touch ID, Fingerprint)
 */
export const getBiometricTypes = async () => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const typeNames = types.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'Face ID';
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'Fingerprint';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris';
        default:
          return 'Biometric';
      }
    });
    return typeNames;
  } catch (error) {
    logger.error('Error getting biometric types:', error);
    return [];
  }
};

/**
 * Get a friendly name for the biometric type (e.g., "Face ID" or "Fingerprint")
 */
export const getBiometricName = async () => {
  const types = await getBiometricTypes();
  if (types.includes('Face ID')) return 'Face ID';
  if (types.includes('Fingerprint')) return 'Fingerprint';
  return types[0] || 'Biometric';
};

/**
 * Authenticate using biometrics
 * @param {string} promptMessage - Message to show on the biometric prompt
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const authenticateWithBiometrics = async (promptMessage = 'Authenticate to continue') => {
  try {
    const isSupported = await isBiometricSupported();
    if (!isSupported) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false, // Allow passcode as fallback
    });

    if (result.success) {
      logger.log('Biometric authentication successful');
      return { success: true };
    } else {
      logger.warn('Biometric authentication failed:', result.error);
      return { 
        success: false, 
        error: result.error === 'user_cancel' ? 'Cancelled' : result.error 
      };
    }
  } catch (error) {
    logger.error('Biometric authentication error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user has enabled biometric login
 */
export const isBiometricEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    logger.error('Error checking biometric enabled:', error);
    return false;
  }
};

/**
 * Enable biometric login for the user
 */
export const enableBiometric = async () => {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    logger.log('Biometric login enabled');
    return true;
  } catch (error) {
    logger.error('Error enabling biometric:', error);
    return false;
  }
};

/**
 * Disable biometric login for the user
 */
export const disableBiometric = async () => {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
    logger.log('Biometric login disabled');
    return true;
  } catch (error) {
    logger.error('Error disabling biometric:', error);
    return false;
  }
};

/**
 * Attempt biometric authentication for app unlock
 * Only prompts if biometric is supported AND user has enabled it
 */
export const attemptBiometricAuth = async () => {
  const isSupported = await isBiometricSupported();
  const isEnabled = await isBiometricEnabled();
  
  if (!isSupported || !isEnabled) {
    return { shouldPrompt: false, success: false };
  }
  
  const biometricName = await getBiometricName();
  const result = await authenticateWithBiometrics(`Unlock Mani Me with ${biometricName}`);
  
  return { shouldPrompt: true, ...result };
};

export default {
  isBiometricSupported,
  getBiometricTypes,
  getBiometricName,
  authenticateWithBiometrics,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  attemptBiometricAuth,
};
