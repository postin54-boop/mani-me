/**
 * Network Provider Context
 * Monitors network connectivity and provides offline state to the app
 * Critical for production - users need to know when they're offline
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import logger from '../utils/logger';

const NetworkContext = createContext({
  isConnected: true,
  isInternetReachable: true,
  connectionType: 'unknown',
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }) => {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown',
  });
  const [showBanner, setShowBanner] = useState(false);
  const bannerAnim = useRef(new Animated.Value(-60)).current;
  const wasOffline = useRef(false);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      logger.log('Network state changed:', state);
      
      const isConnected = state.isConnected ?? true;
      const isInternetReachable = state.isInternetReachable ?? true;
      
      setNetworkState({
        isConnected,
        isInternetReachable,
        connectionType: state.type,
      });

      // Show offline banner when connection is lost
      if (!isConnected || isInternetReachable === false) {
        wasOffline.current = true;
        setShowBanner(true);
        Animated.spring(bannerAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }).start();
      } else if (wasOffline.current) {
        // Was offline, now back online - show success briefly
        setTimeout(() => {
          Animated.timing(bannerAnim, {
            toValue: -60,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowBanner(false);
            wasOffline.current = false;
          });
        }, 2000);
      }
    });

    // Check initial state
    NetInfo.fetch().then(state => {
      setNetworkState({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        connectionType: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  const isOffline = !networkState.isConnected || networkState.isInternetReachable === false;

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
      
      {/* Offline Banner */}
      {showBanner && (
        <Animated.View 
          style={[
            styles.banner,
            { transform: [{ translateY: bannerAnim }] },
            isOffline ? styles.offlineBanner : styles.onlineBanner,
          ]}
        >
          <Ionicons 
            name={isOffline ? "cloud-offline" : "cloud-done"} 
            size={18} 
            color="#FFFFFF" 
          />
          <Text style={styles.bannerText}>
            {isOffline 
              ? "You're offline. Some features may be unavailable." 
              : "Back online!"
            }
          </Text>
        </Animated.View>
      )}
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    gap: 8,
    zIndex: 9999,
  },
  offlineBanner: {
    backgroundColor: '#EF4444',
  },
  onlineBanner: {
    backgroundColor: '#10B981',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NetworkProvider;
