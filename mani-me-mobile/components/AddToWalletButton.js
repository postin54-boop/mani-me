/**
 * AddToWalletButton Component
 * Renders an Apple Wallet button for iOS devices
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addToWallet, isWalletAvailable } from '../services/walletService';
import { useUser } from '../context/UserContext';

const AddToWalletButton = ({ shipment, style }) => {
  const [loading, setLoading] = useState(false);
  const { token } = useUser();

  // Only show on iOS
  if (!isWalletAvailable()) {
    return null;
  }

  // Don't render if no shipment data
  if (!shipment || !shipment._id) {
    return null;
  }

  const handleAddToWallet = async () => {
    if (!token) {
      console.error('No auth token available');
      return;
    }
    
    setLoading(true);
    try {
      await addToWallet(shipment, token);
    } catch (error) {
      console.error('Failed to add to wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleAddToWallet}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.content}>
          <Ionicons name="wallet-outline" size={20} color="#fff" />
          <Text style={styles.text}>Add to Apple Wallet</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddToWalletButton;
