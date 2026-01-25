import Constants from 'expo-constants';

// Production API URL (Render deployment)
const PRODUCTION_URL = "https://mani-me.onrender.com";

// Local development URL (your machine's IP)
const LOCAL_URL = "http://192.168.0.138:4000";

// Determine the best API URL based on platform
const getApiUrl = () => {
  // First check for environment/config override (must be a non-null string)
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configUrl && typeof configUrl === 'string') return configUrl;
  // Always use production URL (change to LOCAL_URL for local testing)
  return PRODUCTION_URL;
};

export const API_BASE_URL = getApiUrl();