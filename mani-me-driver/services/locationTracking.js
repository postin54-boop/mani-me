/**
 * Background Location Tracking Service
 * Uses expo-location + expo-task-manager for live driver location updates
 * during active pickups/deliveries.
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { API_BASE_URL } from '../utils/config';
import * as SecureStore from 'expo-secure-store';

const LOCATION_TASK_NAME = 'MANI_ME_DRIVER_LOCATION';
const UPDATE_INTERVAL_MS = 15000; // 15 seconds

// Define the background task at module level (required by expo-task-manager)
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[LocationTracking] Background task error:', error.message);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations?.[0];
    if (!location) return;

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/drivers/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          heading: location.coords.heading,
          speed: location.coords.speed,
          timestamp: location.timestamp,
        }),
      });
    } catch (err) {
      console.error('[LocationTracking] Failed to send location:', err.message);
    }
  }
});

/**
 * Request location permissions (foreground + background)
 * @returns {boolean} true if all permissions granted
 */
export async function requestLocationPermissions() {
  const { status: foreground } = await Location.requestForegroundPermissionsAsync();
  if (foreground !== 'granted') return false;

  const { status: background } = await Location.requestBackgroundPermissionsAsync();
  return background === 'granted';
}

/**
 * Start background location tracking
 * Call when driver starts a pickup/delivery
 */
export async function startTracking() {
  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) {
    console.warn('[LocationTracking] Permissions not granted');
    return false;
  }

  const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
    .catch(() => false);

  if (isTracking) {
    console.log('[LocationTracking] Already tracking');
    return true;
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: UPDATE_INTERVAL_MS,
    distanceInterval: 50, // meters
    deferredUpdatesInterval: UPDATE_INTERVAL_MS,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Mani Me Driver',
      notificationBody: 'Tracking your location for delivery',
      notificationColor: '#0B1A33',
    },
  });

  console.log('[LocationTracking] Started background tracking');
  return true;
}

/**
 * Stop background location tracking
 * Call when driver completes or cancels the active job
 */
export async function stopTracking() {
  const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
    .catch(() => false);

  if (isTracking) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    console.log('[LocationTracking] Stopped background tracking');
  }
}

/**
 * Check if background tracking is currently active
 */
export async function isTrackingActive() {
  return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
    .catch(() => false);
}
