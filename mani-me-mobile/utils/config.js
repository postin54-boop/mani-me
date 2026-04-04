import Constants from 'expo-constants';

// Production API URL (Render deployment)
const PRODUCTION_URL = "https://mani-me.onrender.com";

// Determine the best API URL based on platform
const getApiUrl = () => {
  // First check for environment/config override (must be a non-null string)
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configUrl && typeof configUrl === 'string') return configUrl;
  // Use production URL
  return PRODUCTION_URL;
};

export const API_BASE_URL = getApiUrl();