import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Custom hook to monitor network connectivity status
 * Returns isConnected, isInternetReachable, and connection type
 */
export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    details: null,
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        type: state.type,
        details: state.details,
      });
    });

    // Initial check
    NetInfo.fetch().then(state => {
      setNetworkState({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        type: state.type,
        details: state.details,
      });
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return networkState;
}

/**
 * Simple hook that only returns connected status
 */
export function useIsConnected() {
  const { isConnected } = useNetworkStatus();
  return isConnected;
}

/**
 * Hook that returns offline status for easier conditionals
 */
export function useIsOffline() {
  const { isConnected } = useNetworkStatus();
  return !isConnected;
}
