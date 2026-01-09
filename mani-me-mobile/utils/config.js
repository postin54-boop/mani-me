import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Production API URL (Render deployment)
const PRODUCTION_URL = "https://mani-me-backend.onrender.com";

// Local development URL (your machine's IP)
const LOCAL_URL = "http://192.168.0.138:4000";

// Determine the best API URL based on platform
const getApiUrl = () => {
  // First check for environment/config override
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configUrl) return configUrl;
  // Always use production URL (change to LOCAL_URL for local testing)
  return PRODUCTION_URL;
};

export const API_BASE_URL = getApiUrl();

// Only log in development mode
if (__DEV__) {
  console.log('Config initialized with API_BASE_URL:', API_BASE_URL);
  console.log('Platform:', Platform.OS);
}