import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import logger from '../utils/logger';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Handle session expiry from API interceptor
  const handleAuthExpired = useCallback(() => {
    logger.warn('Session expired - logging out user');
    setUser(null);
    setToken(null);
    setSessionExpired(true);
    
    // Show alert to user
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please login again.',
      [{ text: 'OK' }]
    );
  }, []);

  // Register global auth expiry handler
  useEffect(() => {
    global.onAuthExpired = handleAuthExpired;
    return () => {
      global.onAuthExpired = null;
    };
  }, [handleAuthExpired]);

  // Load user from storage on app start
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // Try to get token from SecureStore first (new method)
      let userToken = await SecureStore.getItemAsync('authToken');
      
      // If not in SecureStore, check AsyncStorage (legacy) and migrate
      if (!userToken) {
        userToken = await AsyncStorage.getItem('token');
        if (userToken) {
          // Migrate to SecureStore
          await SecureStore.setItemAsync('authToken', userToken);
          await AsyncStorage.removeItem('token');
          logger.log('Token migrated to SecureStore');
        }
      }
      
      // Get user data (not sensitive, can stay in AsyncStorage)
      const userData = await AsyncStorage.getItem('user');
      
      if (userData) {
        setUser(JSON.parse(userData));
      }
      if (userToken) {
        setToken(userToken);
      }
    } catch (error) {
      logger.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, authToken) => {
    try {
      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      // Store token in SecureStore (encrypted)
      await SecureStore.setItemAsync('authToken', authToken);
      setUser(userData);
      setToken(authToken);
    } catch (error) {
      logger.error('Error saving user:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await SecureStore.deleteItemAsync('authToken');
      setUser(null);
      setToken(null);
      setSessionExpired(false);
    } catch (error) {
      logger.error('Error removing user:', error);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
      setUser(updatedUserData);
    } catch (error) {
      logger.error('Error updating user:', error);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = Boolean(user && token);

  return (
    <UserContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      logout, 
      updateUser,
      isAuthenticated,
      sessionExpired,
      setSessionExpired
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
