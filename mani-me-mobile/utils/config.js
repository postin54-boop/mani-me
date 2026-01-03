import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Determine the best API URL based on platform
const getApiUrl = () => {
  // First check for environment/config override
  const configUrl = Constants.expoConfig?.extra?.apiUrl?.replace('/api', '');
  if (configUrl) return configUrl;
  
  // Use appropriate localhost for emulators/simulators
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to reach host machine
      return "http://10.0.2.2:4000";
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost
      return "http://localhost:4000";
    }
  }
  
  // Default for physical devices - update this to your machine's IP
  return "http://192.168.0.138:4000";
};

export const API_BASE_URL = getApiUrl();

// Only log in development mode
if (__DEV__) {
  console.log('Config initialized with API_BASE_URL:', API_BASE_URL);
  console.log('Platform:', Platform.OS);
}