import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { registerForPushNotificationsAsync, updatePushToken } from '../utils/notifications';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';

const API_BASE = `${API_BASE_URL}/api`;

export const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [driverType, setDriverType] = useState(null); // 'pickup' or 'delivery'
  const [role, setRole] = useState(null); // 'UK_DRIVER' or 'GH_DRIVER'
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");
      
      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        setRole(userData.role);
        setDriverType(userData.driver_type);
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

      // Save to AsyncStorage
      await AsyncStorage.setItem("token", authToken);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      // Register for push notifications
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken && userData.id) {
          await updatePushToken(userData.id, pushToken);
        }
      } catch (notifError) {
        logger.error("Failed to register for push notifications:", notifError);
        // Don't fail login if notification registration fails
      }

      return { success: true, user: userData };
    } catch (error) {
      logger.error("Login error:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || "Login failed" 
      };
    }
  };

  // Register new driver
  const register = async (userData) => {
    try {
      logger.log("Registering user with data:", userData);
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

      await AsyncStorage.setItem("token", authToken);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));

      // Register for push notifications
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken && newUser.id) {
          await updatePushToken(newUser.id, pushToken);
        }
      } catch (notifError) {
        logger.error("Failed to register for push notifications:", notifError);
        // Don't fail registration if notification registration fails
      }

      return { success: true, user: newUser };
    } catch (error) {
      logger.error("Registration error:", error);
      logger.error("Error response:", error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.error || "Registration failed" 
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setUser(null);
      setToken(null);
      setRole(null);
      setDriverType(null);
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
        driverType, 
        role,
        token,
        loading,
        login, 
        register, 
        logout,
        isUKDriver,
        isGhanaDriver,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
