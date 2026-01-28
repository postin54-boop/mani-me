/**
 * Apple Wallet Service
 * Handles adding shipment tracking passes to Apple Wallet
 */

import { Platform, Linking, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../utils/config';

/**
 * Check if Apple Wallet is available on the device
 * @returns {boolean} - True if available (iOS only)
 */
export const isWalletAvailable = () => {
  return Platform.OS === 'ios';
};

/**
 * Generate and download a wallet pass for a shipment
 * @param {Object} shipment - The shipment object
 * @param {string} token - Auth token
 * @returns {Promise<string>} - Local file path of the pass
 */
export const downloadWalletPass = async (shipment, token) => {
  try {
    const passUrl = `${API_BASE_URL}/api/wallet/pass/${shipment._id || shipment.id}`;
    
    const fileUri = `${FileSystem.cacheDirectory}shipment-${shipment.tracking_number}.pkpass`;
    
    const downloadResult = await FileSystem.downloadAsync(
      passUrl,
      fileUri,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (downloadResult.status !== 200) {
      throw new Error('Failed to download wallet pass');
    }

    return downloadResult.uri;
  } catch (error) {
    console.error('Error downloading wallet pass:', error);
    throw error;
  }
};

/**
 * Add a shipment to Apple Wallet
 * @param {Object} shipment - The shipment object
 * @param {string} token - Auth token
 */
export const addToWallet = async (shipment, token) => {
  if (!isWalletAvailable()) {
    Alert.alert('Not Available', 'Apple Wallet is only available on iOS devices.');
    return;
  }

  try {
    // Download the pass file
    const passUri = await downloadWalletPass(shipment, token);
    
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      // Share the pass - iOS will recognize .pkpass and offer to add to Wallet
      await Sharing.shareAsync(passUri, {
        mimeType: 'application/vnd.apple.pkpass',
        dialogTitle: 'Add to Apple Wallet',
        UTI: 'com.apple.pkpass',
      });
    } else {
      Alert.alert('Error', 'Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error adding to wallet:', error);
    Alert.alert(
      'Error',
      'Failed to add to Apple Wallet. Please try again later.'
    );
  }
};

/**
 * Open the Wallet app
 */
export const openWalletApp = async () => {
  if (Platform.OS === 'ios') {
    const walletUrl = 'shoebox://';
    const canOpen = await Linking.canOpenURL(walletUrl);
    
    if (canOpen) {
      await Linking.openURL(walletUrl);
    } else {
      Alert.alert('Error', 'Cannot open Apple Wallet');
    }
  }
};

export default {
  isWalletAvailable,
  addToWallet,
  downloadWalletPass,
  openWalletApp,
};
