import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';

export default function QRCodeScreen({ route, navigation }) {
  const { parcel } = route.params;
  const { colors, isDark } = useThemeColors();
  const [qrCodeData, setQrCodeData] = useState(null);

  useEffect(() => {
    if (parcel.qr_code_data) {
      try {
        setQrCodeData(JSON.parse(parcel.qr_code_data));
      } catch (e) {
        console.error('Failed to parse QR code data');
      }
    }
  }, [parcel]);

  const shareQRCode = async () => {
    try {
      await Share.share({
        message: `Parcel ID: ${parcel.parcel_id_short || parcel.parcel_id}\nTracking: ${parcel.tracking_number}`,
        title: 'Share Parcel QR Code'
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Parcel QR Code</Text>
        <TouchableOpacity onPress={shareQRCode}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Parcel ID Card */}
        <View style={[styles.idCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.idLabel, { color: colors.textSecondary }]}>Parcel ID</Text>
          <Text style={[styles.parcelId, { color: colors.primary }]}>
            {parcel.parcel_id_short || parcel.parcel_id || 'N/A'}
          </Text>
          <Text style={[styles.fullParcelId, { color: colors.textSecondary }]}>
            {parcel.parcel_id}
          </Text>
        </View>

        {/* QR Code Display */}
        <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF' }]}>
          {parcel.qr_code_url ? (
            <Image 
              source={{ uri: parcel.qr_code_url }} 
              style={styles.qrCode}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code-outline" size={100} color={colors.border} />
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                QR Code not available
              </Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.instructionsText, { color: colors.text }]}>
            Show this QR code to warehouse staff for quick parcel identification
          </Text>
        </View>

        {/* QR Code Data Details */}
        {qrCodeData && (
          <View style={[styles.dataCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.dataTitle, { color: colors.text }]}>QR Code Contains:</Text>
            
            <View style={styles.dataRow}>
              <Ionicons name="cube-outline" size={18} color={colors.secondary} />
              <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Parcel ID:</Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>{qrCodeData.parcel_id_short}</Text>
            </View>

            <View style={styles.dataRow}>
              <Ionicons name="person-outline" size={18} color={colors.secondary} />
              <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Customer:</Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>{qrCodeData.customer_name}</Text>
            </View>

            <View style={styles.dataRow}>
              <Ionicons name="call-outline" size={18} color={colors.secondary} />
              <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Phone:</Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>{qrCodeData.customer_phone}</Text>
            </View>

            <View style={styles.dataRow}>
              <Ionicons name="scale-outline" size={18} color={colors.secondary} />
              <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Weight:</Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>{qrCodeData.weight_kg} kg</Text>
            </View>

            <View style={styles.dataRow}>
              <Ionicons name="location-outline" size={18} color={colors.secondary} />
              <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Destination:</Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>{qrCodeData.destination}</Text>
            </View>

            <View style={styles.dataRow}>
              <Ionicons name="barcode-outline" size={18} color={colors.secondary} />
              <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Tracking:</Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>{qrCodeData.tracking_number}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity 
          style={[styles.shareButton, { backgroundColor: colors.primary }]}
          onPress={shareQRCode}
        >
          <Ionicons name="share-outline" size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Share Parcel Details</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: SIZES.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: SIZES.h4,
    ...FONTS.bold,
  },
  content: {
    flex: 1,
    padding: SIZES.lg,
  },
  idCard: {
    borderRadius: 16,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  idLabel: {
    fontSize: SIZES.body,
    ...FONTS.regular,
    marginBottom: SIZES.xs,
  },
  parcelId: {
    fontSize: SIZES.h2,
    ...FONTS.bold,
    marginBottom: SIZES.xs,
  },
  fullParcelId: {
    fontSize: SIZES.caption,
    ...FONTS.regular,
  },
  qrContainer: {
    borderRadius: 16,
    padding: SIZES.xl,
    marginBottom: SIZES.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  qrCode: {
    width: 280,
    height: 280,
  },
  qrPlaceholder: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: SIZES.body,
    ...FONTS.regular,
    marginTop: SIZES.md,
  },
  instructionsCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    gap: SIZES.sm,
  },
  instructionsText: {
    flex: 1,
    fontSize: SIZES.body,
    ...FONTS.regular,
    lineHeight: 20,
  },
  dataCard: {
    borderRadius: 16,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
    ...SHADOWS.light,
  },
  dataTitle: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
    marginBottom: SIZES.md,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
    gap: SIZES.xs,
  },
  dataLabel: {
    fontSize: SIZES.body,
    ...FONTS.regular,
    marginLeft: SIZES.xs,
  },
  dataValue: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginLeft: 'auto',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    marginVertical: 8,
    gap: SIZES.sm,
    ...SHADOWS.medium,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
