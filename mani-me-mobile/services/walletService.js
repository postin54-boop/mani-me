/**
 * Apple Wallet Service
 * Downloads signed .pkpass files and adds them to Apple Wallet via iOS sharing
 */

import { Platform, Linking, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
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
 * Download a signed .pkpass file from the backend
 * @param {Object} shipment - The shipment object
 * @param {string} token - Auth token
 * @returns {Promise<string>} - Local file URI of the .pkpass
 */
export const downloadWalletPass = async (shipment, token) => {
  try {
    const shipmentId = shipment._id || shipment.id;
    const passUrl = `${API_BASE_URL}/api/wallet/pass/${shipmentId}`;
    const fileUri = `${FileSystem.cacheDirectory}shipment-${shipment.tracking_number || shipmentId}.pkpass`;

    const downloadResult = await FileSystem.downloadAsync(passUrl, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (downloadResult.status !== 200) {
      // Try to read the body as JSON for error details
      try {
        const errorBody = await FileSystem.readAsStringAsync(downloadResult.uri);
        const errorJson = JSON.parse(errorBody);
        if (errorJson.code === 'WALLET_NOT_CONFIGURED') {
          throw new Error('Apple Wallet passes are coming soon! This feature is not yet available.');
        }
        throw new Error(errorJson.error || 'Failed to download wallet pass');
      } catch (parseErr) {
        if (parseErr.message.includes('coming soon') || parseErr.message.includes('not yet available')) {
          throw parseErr;
        }
        throw new Error(`Failed to download wallet pass (HTTP ${downloadResult.status})`);
      }
    }

    return downloadResult.uri;
  } catch (error) {
    console.error('Error downloading wallet pass:', error);
    throw error;
  }
};

/**
 * Add a shipment to Apple Wallet
 * Downloads the signed .pkpass and presents the iOS share sheet,
 * which recognises the .pkpass MIME type and offers "Add to Wallet".
 * @param {Object} shipment - The shipment object
 * @param {string} token - Auth token
 */
export const addToWallet = async (shipment, token) => {
  if (!isWalletAvailable()) {
    Alert.alert('Not Available', 'Apple Wallet is only available on iOS devices.');
    return;
  }

  if (!shipment || (!shipment._id && !shipment.id)) {
    console.error('addToWallet: Invalid shipment data', shipment);
    Alert.alert('Error', 'Invalid shipment data. Please try again.');
    return;
  }

  try {
    const passUri = await downloadWalletPass(shipment, token);

    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
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
      error.message || 'Failed to add to Apple Wallet. Please try again later.'
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
