/**
 * SizeAdjustmentScreen
 * Allows customer to approve or reject a size adjustment request from driver
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { useThemeColors } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../utils/config';

// Parcel size info for display
const PARCEL_SIZE_INFO = {
  small_box: { label: 'Small Box', dimensions: '30×30×30cm', icon: 'cube-outline', color: '#10B981' },
  medium_box: { label: 'Medium Box', dimensions: '45×45×45cm', icon: 'cube', color: '#3B82F6' },
  large_box: { label: 'Large Box', dimensions: '60×60×60cm', icon: 'cube', color: '#8B5CF6' },
  extra_large_box: { label: 'Extra-Large Box', dimensions: '75×75×75cm', icon: 'cube', color: '#EC4899' },
  barrel: { label: 'Barrel / Drum', dimensions: '60-200L', icon: 'file-tray-stacked', color: '#F59E0B' },
};

export default function SizeAdjustmentScreen({ route, navigation }) {
  const { shipmentId } = route.params || {};
  const { colors, isDark } = useThemeColors();
  const { token } = useUser();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adjustment, setAdjustment] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    fetchAdjustmentDetails();
  }, [shipmentId]);

  const fetchAdjustmentDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/shipments/${shipmentId}/size-adjustment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.has_adjustment) {
        setAdjustment(data.adjustment);
        setTrackingNumber(data.tracking_number);
      } else {
        Alert.alert('No Adjustment', 'No size adjustment found for this parcel.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching adjustment:', error);
      Alert.alert('Error', 'Failed to load adjustment details');
    } finally {
      setLoading(false);
    }
  };

  const getExtraAmountPounds = () => {
    return (adjustment?.extra_amount || 0) / 100;
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      // Call approve endpoint
      const response = await fetch(`${API_BASE_URL}/api/shipments/${shipmentId}/size-adjustment/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve adjustment');
      }

      // If there's a client secret, need to pay with card
      if (data.clientSecret) {
        // Initialize payment sheet
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: data.clientSecret,
          merchantDisplayName: 'Mani Me Delivery',
          style: isDark ? 'alwaysDark' : 'automatic',
        });

        if (initError) {
          throw new Error(initError.message);
        }

        // Present payment sheet
        const { error: paymentError } = await presentPaymentSheet();

        if (paymentError) {
          if (paymentError.code === 'Canceled') {
            setProcessing(false);
            return;
          }
          throw new Error(paymentError.message);
        }
      }

      Alert.alert(
        'Approved!',
        `Size adjustment approved. ${data.payment_method === 'cash' ? 'Extra £' + getExtraAmountPounds().toFixed(2) + ' will be collected on pickup.' : 'Payment authorized.'}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Approval error:', error);
      Alert.alert('Error', error.message || 'Failed to approve adjustment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    Alert.alert(
      'Reject Size Adjustment?',
      'If you reject, your booking will be cancelled and any payment hold will be released.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Reject & Cancel',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              const response = await fetch(`${API_BASE_URL}/api/shipments/${shipmentId}/size-adjustment/reject`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: 'Customer rejected size adjustment' }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || 'Failed to reject adjustment');
              }

              Alert.alert(
                'Booking Cancelled',
                'Your booking has been cancelled and any payment hold has been released.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Rejection error:', error);
              Alert.alert('Error', error.message || 'Failed to reject adjustment');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const getSizeInfo = (sizeId) => {
    return PARCEL_SIZE_INFO[sizeId] || { label: sizeId, dimensions: '', icon: 'cube', color: '#6B7280' };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (!adjustment) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={64} color={colors.textSecondary} />
        <Text style={{ color: colors.text, fontSize: 18, marginTop: 16 }}>No adjustment found</Text>
      </View>
    );
  }

  const originalInfo = getSizeInfo(adjustment.original_size);
  const newInfo = getSizeInfo(adjustment.new_size);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Size Adjustment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Alert Banner */}
        <View style={[styles.alertBanner, { backgroundColor: '#FFA50015', borderColor: '#FFA500' }]}>
          <Ionicons name="warning" size={24} color="#FFA500" />
          <Text style={[styles.alertText, { color: colors.text }]}>
            Driver found your parcel is a different size than booked
          </Text>
        </View>

        {/* Tracking Info */}
        <Text style={[styles.trackingLabel, { color: colors.textSecondary }]}>
          Parcel: {trackingNumber}
        </Text>

        {/* Size Comparison */}
        <View style={styles.comparisonContainer}>
          {/* Original Size */}
          <View style={[styles.sizeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sizeLabel, { color: colors.textSecondary }]}>YOU BOOKED</Text>
            <View style={[styles.sizeIconBox, { backgroundColor: originalInfo.color + '20' }]}>
              <Ionicons name={originalInfo.icon} size={32} color={originalInfo.color} />
            </View>
            <Text style={[styles.sizeName, { color: colors.text }]}>{originalInfo.label}</Text>
            <Text style={[styles.sizeDimensions, { color: colors.textSecondary }]}>{originalInfo.dimensions}</Text>
            <Text style={[styles.sizePrice, { color: colors.text }]}>
              £{((adjustment.original_cost || 0) / 100).toFixed(2)}
            </Text>
          </View>

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={32} color={colors.primary} />
          </View>

          {/* New Size */}
          <View style={[styles.sizeBox, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <Text style={[styles.sizeLabel, { color: colors.primary }]}>ACTUAL SIZE</Text>
            <View style={[styles.sizeIconBox, { backgroundColor: newInfo.color + '20' }]}>
              <Ionicons name={newInfo.icon} size={32} color={newInfo.color} />
            </View>
            <Text style={[styles.sizeName, { color: colors.text }]}>{newInfo.label}</Text>
            <Text style={[styles.sizeDimensions, { color: colors.textSecondary }]}>{newInfo.dimensions}</Text>
            <Text style={[styles.sizePrice, { color: colors.primary }]}>
              £{((adjustment.new_cost || 0) / 100).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Extra Charge */}
        <View style={[styles.extraChargeBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
          <Text style={[styles.extraChargeLabel, { color: colors.textSecondary }]}>EXTRA CHARGE REQUIRED</Text>
          <Text style={[styles.extraChargeAmount, { color: colors.primary }]}>
            +£{getExtraAmountPounds().toFixed(2)}
          </Text>
        </View>

        {/* Driver Notes */}
        {adjustment.driver_notes && (
          <View style={[styles.notesBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>Driver's Note:</Text>
            <Text style={[styles.notesText, { color: colors.text }]}>{adjustment.driver_notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.approveBtn, { backgroundColor: colors.primary }]}
            onPress={handleApprove}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.approveBtnText}>Approve & Pay £{getExtraAmountPounds().toFixed(2)}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rejectBtn, { borderColor: '#EF4444' }]}
            onPress={handleReject}
            disabled={processing}
          >
            <Ionicons name="close-circle" size={22} color="#EF4444" />
            <Text style={[styles.rejectBtnText, { color: '#EF4444' }]}>Reject & Cancel Booking</Text>
          </TouchableOpacity>
        </View>

        {/* Info Text */}
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          If you approve, the extra amount will be held on your card and charged when the driver picks up your parcel.
          If you reject, your booking will be cancelled.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  trackingLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sizeBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  sizeLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
  },
  sizeIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sizeName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  sizeDimensions: {
    fontSize: 11,
    marginTop: 2,
  },
  sizePrice: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  arrowContainer: {
    paddingHorizontal: 8,
  },
  extraChargeBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 20,
  },
  extraChargeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  extraChargeAmount: {
    fontSize: 36,
    fontWeight: '800',
    marginTop: 4,
  },
  notesBox: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
  },
  actionsContainer: {
    gap: 12,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  rejectBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
