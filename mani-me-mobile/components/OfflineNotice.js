import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Offline indicator banner that shows at top of screen when no connection
 */
export default function OfflineNotice() {
  const { isConnected, isInternetReachable } = useNetworkStatus();

  if (isConnected && isInternetReachable !== false) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline" size={16} color="#FFFFFF" />
      <Text style={styles.text}>
        {!isConnected ? 'No Internet Connection' : 'Connection Issue - Please check your network'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
