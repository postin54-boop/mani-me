/**
 * WalletPassModal Component
 * Displays shipment tracking info as a beautiful in-app pass card
 * (Apple Wallet .pkpass requires Apple Developer certificates for signing)
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useThemeColors } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WalletPassModal = ({ visible, onClose, passData }) => {
  const { colors } = useThemeColors();

  if (!passData) return null;

  const pass = passData.pass || passData;
  const generic = pass.generic || {};
  const primaryFields = generic.primaryFields || [];
  const secondaryFields = generic.secondaryFields || [];
  const auxiliaryFields = generic.auxiliaryFields || [];
  const backFields = generic.backFields || [];
  const barcode = (pass.barcodes && pass.barcodes[0]) || {};

  const trackingNumber = primaryFields.find(f => f.key === 'tracking')?.value || '';

  const copyTrackingNumber = async () => {
    if (trackingNumber) {
      await Clipboard.setStringAsync(trackingNumber);
      Alert.alert('Copied', 'Tracking number copied to clipboard');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Shipment Pass</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Pass Card */}
          <View style={styles.passCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.logoRow}>
                <View style={styles.logoIcon}>
                  <Ionicons name="cube" size={24} color="#83C5FA" />
                </View>
                <Text style={styles.logoText}>{pass.logoText || 'Mani Me'}</Text>
              </View>
              <Text style={styles.passDescription}>{pass.description || 'Shipment Tracking'}</Text>
            </View>

            {/* Primary - Tracking Number */}
            {primaryFields.map((field) => (
              <TouchableOpacity
                key={field.key}
                style={styles.primarySection}
                onPress={copyTrackingNumber}
                activeOpacity={0.7}
              >
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <View style={styles.trackingRow}>
                  <Text style={styles.trackingNumber}>{field.value}</Text>
                  <Ionicons name="copy-outline" size={18} color="#83C5FA" />
                </View>
              </TouchableOpacity>
            ))}

            {/* QR Code Area */}
            <View style={styles.qrSection}>
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" size={80} color="#0B1A33" />
              </View>
              <Text style={styles.qrText}>{barcode.altText || trackingNumber}</Text>
            </View>

            {/* Secondary Fields */}
            {secondaryFields.length > 0 && (
              <View style={styles.fieldsRow}>
                {secondaryFields.map((field) => (
                  <View key={field.key} style={styles.fieldItem}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={styles.fieldValue}>{field.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Auxiliary Fields */}
            {auxiliaryFields.length > 0 && (
              <View style={styles.fieldsRow}>
                {auxiliaryFields.map((field) => (
                  <View key={field.key} style={styles.fieldItem}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={styles.fieldValue}>{field.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Back Fields (Details) */}
            {backFields.length > 0 && (
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Details</Text>
                {backFields.map((field) => (
                  <View key={field.key} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{field.label}</Text>
                    <Text style={styles.detailValue}>{field.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Copy Button */}
          <TouchableOpacity
            style={styles.copyButton}
            onPress={copyTrackingNumber}
            activeOpacity={0.8}
          >
            <Ionicons name="copy-outline" size={20} color="#fff" />
            <Text style={styles.copyButtonText}>Copy Tracking Number</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  passCard: {
    backgroundColor: '#0B1A33',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(131, 197, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  passDescription: {
    fontSize: 13,
    color: '#83C5FA',
    marginTop: 4,
    marginLeft: 46,
  },
  primarySection: {
    marginBottom: 20,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackingNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    flex: 1,
  },
  qrSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qrText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1A33',
    letterSpacing: 0.5,
  },
  fieldsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fieldItem: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#83C5FA',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(131, 197, 250, 0.2)',
    marginVertical: 16,
  },
  detailsSection: {
    marginTop: 4,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#83C5FA',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(131, 197, 250, 0.7)',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  copyButton: {
    backgroundColor: '#0B1A33',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default WalletPassModal;
