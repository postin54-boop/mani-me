/**
 * Secure Storage Utility
 * Uses expo-secure-store for encrypted storage of sensitive data
 * Falls back to AsyncStorage for non-sensitive data or when secure store unavailable
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';

/**
 * Check if secure storage is available on this device
 */
const isSecureStoreAvailable = async () => {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

/**
 * Secure storage wrapper with fallback
 */
const secureStorage = {
  /**
   * Store a value securely
   * @param {string} key - Storage key
   * @param {string} value - Value to store (must be string)
   */
  setItem: async (key, value) => {
    try {
      const available = await isSecureStoreAvailable();
      
      if (available) {
        await SecureStore.setItemAsync(key, value);
        logger.log(`Securely stored: ${key}`);
      } else {
        // Fallback to AsyncStorage with warning
        logger.warn(`SecureStore not available, using AsyncStorage for: ${key}`);
        await AsyncStorage.setItem(`@secure_${key}`, value);
      }
    } catch (error) {
      logger.error(`Failed to store ${key}:`, error);
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(`@secure_${key}`, value);
    }
  },

  /**
   * Retrieve a securely stored value
   * @param {string} key - Storage key
   * @returns {Promise<string|null>} Stored value or null
   */
  getItem: async (key) => {
    try {
      const available = await isSecureStoreAvailable();
      
      if (available) {
        const value = await SecureStore.getItemAsync(key);
        if (value !== null) {
          return value;
        }
      }
      
      // Check fallback storage
      const fallbackValue = await AsyncStorage.getItem(`@secure_${key}`);
      return fallbackValue;
    } catch (error) {
      logger.error(`Failed to retrieve ${key}:`, error);
      // Try fallback
      try {
        return await AsyncStorage.getItem(`@secure_${key}`);
      } catch {
        return null;
      }
    }
  },

  /**
   * Remove a securely stored value
   * @param {string} key - Storage key
   */
  removeItem: async (key) => {
    try {
      const available = await isSecureStoreAvailable();
      
      if (available) {
        await SecureStore.deleteItemAsync(key);
      }
      
      // Also remove from fallback storage
      await AsyncStorage.removeItem(`@secure_${key}`);
      logger.log(`Removed secure item: ${key}`);
    } catch (error) {
      logger.error(`Failed to remove ${key}:`, error);
    }
  },

  /**
   * Migrate from AsyncStorage to SecureStore
   * Call this once during app upgrade to migrate existing tokens
   * @param {string} key - Key to migrate
   */
  migrateFromAsyncStorage: async (key) => {
    try {
      // Check if value exists in old AsyncStorage location
      const oldValue = await AsyncStorage.getItem(key);
      
      if (oldValue) {
        // Store in secure storage
        await secureStorage.setItem(key, oldValue);
        // Remove from old location
        await AsyncStorage.removeItem(key);
        logger.log(`Migrated ${key} to secure storage`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to migrate ${key}:`, error);
      return false;
    }
  },
};

export default secureStorage;
