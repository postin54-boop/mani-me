import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { API_BASE_URL } from './config';
import logger from './logger';

// Configure how notifications should be displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and get Expo push token
 * @returns {Promise<string|null>} Push token or null if failed
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      logger.warn('Failed to get push token for push notification!');
      return null;
    }
    
    // Try to get push token - may fail in development without EAS project
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      logger.log('Driver Push token:', token);
    } catch (error) {
      logger.warn('Could not get push token (EAS project may not be configured):', error.message);
      // Continue without push notifications in development
      return null;
    }
  } else {
    logger.log('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

/**
 * Update driver's push token on the backend
 * @param {string} userId - Driver ID
 * @param {string} pushToken - Expo push token
 */
export async function updatePushToken(userId, pushToken) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/update-push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, pushToken }),
    });

    if (response.ok) {
      logger.log('Driver push token updated on backend');
    } else {
      logger.error('Failed to update driver push token');
    }
  } catch (error) {
    logger.error('Error updating driver push token:', error);
  }
}

/**
 * Listen for notifications when app is in foreground
 * @param {Function} callback - Function to call when notification is received
 * @returns {Subscription} Subscription object to remove listener
 */
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Listen for notification interactions (user taps on notification)
 * @param {Function} callback - Function to call when notification is tapped
 * @returns {Subscription} Subscription object to remove listener
 */
export function addNotificationResponseReceivedListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
