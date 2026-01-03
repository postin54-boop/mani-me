import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useThemeColors, SIZES, FONTS, SHADOWS } from '../constants/theme';
import { API_BASE_URL } from '../utils/config';
import { ListItemSkeleton } from '../components/Skeleton';
import { InlineError } from '../components/ErrorRetry';
import logger from '../utils/logger';

export default function TrackingSearchScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { user } = useUser();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState(null);
  const [recentParcels, setRecentParcels] = useState([]);

  const fetchRecentParcels = useCallback(async () => {
    try {
      setLoadingRecent(true);
      setRecentError(null);
      const response = await fetch(`${API_BASE_URL}/api/shipments/user/${user?.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch parcels: ${response.status}`);
      }
      const data = await response.json();
      // Get only active parcels (not delivered)
      const active = data.shipments.filter(p => p.status !== 'delivered' && p.status !== 'cancelled');
      setRecentParcels(active.slice(0, 5));
    } catch (error) {
      logger.error('Error fetching parcels:', error);
      setRecentError('Failed to load recent parcels');
    } finally {
      setLoadingRecent(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRecentParcels();
  }, [fetchRecentParcels]);

  const handleTrackParcel = async () => {
    if (!trackingNumber.trim()) {
      Alert.alert('Error', 'Please enter a tracking number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/shipments/track/${trackingNumber.trim()}`);
      if (!response.ok) {
        Alert.alert('Not Found', 'No parcel found with this tracking number');
        return;
      }
      const data = await response.json();
      navigation.navigate('Tracking', { parcel: data.shipment });
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch tracking information');
    } finally {
      setLoading(false);
    }
  };

  const openParcelTracking = (parcel) => {
    navigation.navigate('Tracking', { parcel });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pickup_scheduled: '#FFA500',
      driver_on_way: '#FF9800',
      parcel_collected: '#2196F3',
      at_uk_warehouse: '#2196F3',
      departed_uk: '#9C27B0',
      arrived_ghana: '#9C27B0',
      out_for_delivery_ghana: '#FF5722',
      delivered: '#4CAF50',
    };
    return statusColors[status] || '#999';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pickup_scheduled: 'Pickup Scheduled',
      driver_on_way: 'Driver on Way',
      parcel_collected: 'Collected',
      at_uk_warehouse: 'At UK Warehouse',
      departed_uk: 'Departed UK',
      arrived_ghana: 'Arrived Ghana',
      out_for_delivery_ghana: 'Out for Delivery',
      delivered: 'Delivered',
    };
    return labels[status] || status;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Track Parcel</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Enter Tracking Number</Text>
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="e.g., MANI-UK-123456"
              placeholderTextColor={colors.textSecondary}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              autoCapitalize="characters"
            />
          </View>
          <TouchableOpacity 
            style={[styles.trackButton, { backgroundColor: colors.primary }]}
            onPress={handleTrackParcel}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <>
                <Ionicons name="locate-outline" size={20} color={colors.accent} />
                <Text style={[styles.trackButtonText, { color: colors.accent }]}>Track Parcel</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent/Active Parcels */}
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Parcels</Text>
          {loadingRecent ? (
            <View>
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
            </View>
          ) : recentError ? (
            <InlineError message={recentError} onRetry={fetchRecentParcels} />
          ) : recentParcels.length > 0 ? (
            recentParcels.map((parcel) => (
              <TouchableOpacity
                key={parcel._id || parcel.id || parcel.tracking_number}
                style={[styles.parcelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => openParcelTracking(parcel)}
                activeOpacity={0.7}
              >
                <View style={styles.parcelHeader}>
                  <View>
                    <Text style={[styles.trackingNum, { color: colors.text }]}>{parcel.tracking_number}</Text>
                    <Text style={[styles.route, { color: colors.textSecondary }]}>
                      {parcel.pickup_city} → {parcel.delivery_city}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(parcel.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(parcel.status)}</Text>
                  </View>
                </View>
                <View style={styles.parcelFooter}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                    {new Date(parcel.created_at).toLocaleDateString()}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={styles.chevron} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active parcels</Text>
          )}
        </View>

        {/* Help Section */}
        <View style={[styles.helpSection, { backgroundColor: colors.secondary + '15', borderColor: colors.secondary + '30' }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.secondary} />
          <View style={styles.helpContent}>
            <Text style={[styles.helpTitle, { color: colors.text }]}>How to track?</Text>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Enter your tracking number above or select from your active parcels. You can find the tracking number in your booking confirmation email.
            </Text>
          </View>
        </View>

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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: SIZES.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
  },
  content: {
    flex: 1,
    padding: SIZES.lg,
  },
  searchSection: {
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: SIZES.h5,
    ...FONTS.semiBold,
    marginBottom: SIZES.md,
  },
  emptyText: {
    fontSize: SIZES.body,
    textAlign: 'center',
    paddingVertical: SIZES.lg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    marginBottom: SIZES.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: SIZES.sm,
    fontSize: SIZES.body,
    ...FONTS.regular,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    gap: SIZES.sm,
    ...SHADOWS.medium,
  },
  trackButtonText: {
    fontSize: SIZES.h6,
    ...FONTS.semiBold,
  },
  recentSection: {
    marginBottom: SIZES.xl,
  },
  parcelCard: {
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  parcelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.sm,
  },
  trackingNum: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginBottom: 4,
  },
  route: {
    fontSize: SIZES.caption,
    ...FONTS.regular,
  },
  statusBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSm,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: SIZES.caption,
    ...FONTS.semiBold,
  },
  parcelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: SIZES.caption,
    ...FONTS.regular,
  },
  chevron: {
    marginLeft: 'auto',
  },
  helpSection: {
    flexDirection: 'row',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    gap: SIZES.md,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginBottom: 4,
  },
  helpText: {
    fontSize: SIZES.caption,
    ...FONTS.regular,
    lineHeight: 18,
  },
});
