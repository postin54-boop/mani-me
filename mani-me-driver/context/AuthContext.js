import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { registerForPushNotificationsAsync, updatePushToken } from '../utils/notifications';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';
import secureStorage from '../utils/secureStorage';

const API_BASE = `${API_BASE_URL}/api`;

// Token refresh threshold - refresh 30 minutes before expiry
const TOKEN_REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes in ms

export const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Parse JWT token to get expiry time
 * @param {string} token - JWT token
 * @returns {number|null} Expiry timestamp in ms, or null if invalid
 */
const getTokenExpiry = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null; // Convert to ms
  } catch {
    return null;
  }
};

/**
 * Check if token is expired or about to expire
 * @param {string} token - JWT token
 * @returns {boolean} True if token needs refresh
 */
const tokenNeedsRefresh = (token) => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  
  const now = Date.now();
  const timeUntilExpiry = expiry - now;
  
  return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [driverType, setDriverType] = useState(null); // 'pickup' or 'delivery'
  const [role, setRole] = useState(null); // 'UK_DRIVER' or 'GH_DRIVER'
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ref for token refresh interval
  const refreshIntervalRef = useRef(null);

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
    
    return () => {
      // Cleanup refresh interval on unmount
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Setup token refresh when token changes
  useEffect(() => {
    if (token) {
      setupTokenRefresh(token);
    } else {
      // Clear refresh interval if no token
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }
  }, [token]);

  /**
   * Setup automatic token refresh
   */
  const setupTokenRefresh = useCallback((currentToken) => {
    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    const expiry = getTokenExpiry(currentToken);
    if (!expiry) return;
    
    const now = Date.now();
    const timeUntilExpiry = expiry - now;
    const refreshTime = Math.max(timeUntilExpiry - TOKEN_REFRESH_THRESHOLD, 60000); // At least 1 minute
    
    logger.log(`Token expires in ${Math.round(timeUntilExpiry / 60000)} minutes. Refresh scheduled in ${Math.round(refreshTime / 60000)} minutes.`);
    
    // Schedule refresh
    refreshIntervalRef.current = setTimeout(async () => {
      logger.log('Proactive token refresh triggered');
      await refreshToken();
    }, refreshTime);
  }, []);

  /**
   * Refresh the auth token
   */
  const refreshToken = async () => {
    try {
      const currentToken = await secureStorage.getItem('token');
      if (!currentToken) {
        logger.warn('No token to refresh');
        return false;
      }
      
      const response = await axios.post(
        `${API_BASE}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      
      if (response.data && response.data.token) {
        const newToken = response.data.token;
        
        // Save new token securely
        await secureStorage.setItem('token', newToken);
        setToken(newToken);
        
        logger.log('Token refreshed successfully');
        return true;
      }
    } catch (error) {
      logger.error('Token refresh failed:', error);
      
      // If refresh fails due to invalid token, logout
      if (error.response?.status === 401) {
        logger.warn('Token refresh unauthorized, logging out');
        await logout();
      }
    }
    return false;
  };

  /**
   * Clear all auth data
   */
  const clearAuthData = async () => {
    await secureStorage.removeItem('token');
    await AsyncStorage.removeItem("user");
    // Also remove the plain 'token' key to prevent migrateFromAsyncStorage
    // from restoring this session on the next app launch
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setRole(null);
    setDriverType(null);
  };

  const loadUserFromStorage = async () => {
    try {
      // Migrate old token storage to secure storage (one-time migration)
      await secureStorage.migrateFromAsyncStorage('token');
      
      // Get token from secure storage
      const storedToken = await secureStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem("user");
      
      if (storedToken && storedUser) {
        // Check if token needs refresh before validating
        if (tokenNeedsRefresh(storedToken)) {
          logger.log('Stored token needs refresh, attempting refresh...');
          const refreshed = await refreshToken();
          if (!refreshed) {
            logger.log('Token refresh failed, validating existing token...');
          }
        }
        
        // Validate token with backend
        try {
          const currentToken = await secureStorage.getItem('token');
          const response = await axios.get(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${currentToken}` }
          });
          
          if (response.data && response.data.user) {
            // Token is valid, use the fresh user data from server
            const userData = response.data.user;
            setToken(currentToken);
            setUser(userData);
            setRole(userData.role);
            setDriverType(userData.driver_type);
            // Update stored user data with fresh data
            await AsyncStorage.setItem("user", JSON.stringify(userData));
            
            // Re-register push token on app launch
            try {
              const pushToken = await registerForPushNotificationsAsync();
              if (pushToken && userData.id) {
                await updatePushToken(userData.id, pushToken, currentToken);
              }
            } catch (notifError) {
              logger.error("Failed to re-register push token:", notifError);
            }
          } else {
            // Invalid response, clear stored data
            await clearAuthData();
          }
        } catch (validateError) {
          // Token is invalid or expired, clear stored data
          logger.log("Token validation failed, clearing stored data");
          await clearAuthData();
        }
      }
    } catch (error) {
      logger.error("Error loading user from storage:", error);
    } finally {
      setLoading(false);
    }
  };

  // Login with API call
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
      });

      const { token: authToken, user: userData } = response.data;

      // Only allow drivers to log in
      if (!userData.role || (!userData.role.includes("DRIVER"))) {
        throw new Error("Only drivers can access this app");
      }

      // Save to state
      setToken(authToken);
      setUser(userData);
      setRole(userData.role);
      setDriverType(userData.driver_type);

      // Save token to secure storage
      await secureStorage.setItem('token', authToken);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      // Register for push notifications
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken && userData.id) {
          await updatePushToken(userData.id, pushToken, authToken);
        }
      } catch (notifError) {
        logger.error("Failed to register for push notifications:", notifError);
        // Don't fail login if notification registration fails
      }

      return { success: true, user: userData };
    } catch (error) {
      // 4xx errors are expected (wrong password, unknown email) — warn only
      // 5xx or network errors are unexpected — log as error
      const status = error.response?.status;
      if (status && status < 500) {
        logger.warn('Login failed (client error):', error.response?.data?.message || error.message);
      } else {
        logger.error('Login error:', error);
      }
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || "Login failed" 
      };
    }
  };

  // Register new driver
  const register = async (userData) => {
    try {
      logger.log("Registering user with data:", { ...userData, password: '[REDACTED]' });
      const response = await axios.post(`${API_BASE}/auth/register`, {
        ...userData,
        role: userData.role || "UK_DRIVER", // Default to UK driver
        driver_type: userData.driver_type || "pickup",
        country: userData.country || "UK",
      });

      const { token: authToken, user: newUser } = response.data;

      setToken(authToken);
      setUser(newUser);
      setRole(newUser.role);
      setDriverType(newUser.driver_type);

      // Save token to secure storage
      await secureStorage.setItem('token', authToken);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));

      // Register for push notifications
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken && newUser.id) {
          await updatePushToken(newUser.id, pushToken, authToken);
        }
      } catch (notifError) {
        logger.error("Failed to register for push notifications:", notifError);
        // Don't fail registration if notification registration fails
      }

      return { success: true, user: newUser };
    } catch (error) {
      logger.error("Registration error:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.error || "Registration failed" 
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await clearAuthData();
      
      // Clear refresh interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    } catch (error) {
      logger.error("Logout error:", error);
    }
  };

  // Helper functions
  const isUKDriver = () => role === "UK_DRIVER" || driverType === "pickup";
  const isGhanaDriver = () => role === "GH_DRIVER" || driverType === "delivery";

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        setUser,
        driverType, 
        role,
        token,
        loading,
        login, 
        register, 
        logout,
        refreshToken,
        isUKDriver,
        isGhanaDriver,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
