import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';

export default function OrdersScreen({ navigation }) {
  const [parcels, setParcels] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total_parcels: 0, delivered: 0, in_transit: 0 });
  const { user } = useUser();

  const userId = user?.id;

  const fetchParcels = async () => {
    try {
      // Backend URL using computer's IP address
      const response = await fetch(`http://192.168.0.138:4000/api/shipments/user/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setParcels(data.shipments || []);
      }
    } catch (error) {
      console.error('Error fetching parcels:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`http://192.168.0.138:4000/api/shipments/stats/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchParcels();
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchParcels();
      fetchStats();
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchParcels();
    await fetchStats();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      booked: '#FFA500',
      picked_up: '#2196F3',
      in_transit: '#2196F3',
      customs: '#9C27B0',
      out_for_delivery: '#FF5722',
      delivered: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status] || '#999';
  };

  const getStatusLabel = (status) => {
    const labels = {
      booked: 'Booked',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      customs: 'In Customs',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const handleTrackParcel = (parcel) => {
    navigation.navigate('Tracking', { parcel });
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.header}
      >
        <Text style={styles.title}>My Parcels</Text>
        <Text style={styles.headerSubtitle}>Track all your deliveries</Text>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="cube" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.statNumber}>{stats.total_parcels}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: COLORS.info + '15' }]}>
            <Ionicons name="airplane" size={24} color={COLORS.info} />
          </View>
          <Text style={[styles.statNumber, { color: COLORS.info }]}>{stats.in_transit}</Text>
          <Text style={styles.statLabel}>In Transit</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          </View>
          <Text style={[styles.statNumber, { color: COLORS.success }]}>{stats.delivered}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </View>

      {/* Parcels List */}
      <View style={styles.listContainer}>
        {parcels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="cube-outline" size={60} color={COLORS.textLight} />
            </View>
            <Text style={styles.emptyText}>No parcels yet</Text>
            <Text style={styles.emptySubtext}>
              Book your first parcel to start tracking deliveries
            </Text>
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={() => navigation.navigate('HomeTab')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.success, COLORS.secondaryLight]}
                style={styles.bookButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.surface} />
                <Text style={styles.bookButtonText}>Book a Parcel</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          parcels.map((parcel) => (
            <TouchableOpacity
              key={parcel.id}
              style={styles.parcelCard}
              onPress={() => handleTrackParcel(parcel)}
            >
              <View style={styles.parcelHeader}>
                <Text style={styles.trackingNumber}>
                  {parcel.tracking_number}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(parcel.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(parcel.status)}</Text>
                </View>
              </View>

              <View style={styles.parcelDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} style={styles.detailIcon} />
                  <Text style={styles.detailLabel}>To:</Text>
                  <Text style={styles.detailValue}>{parcel.receiver_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} style={styles.detailIcon} />
                  <Text style={styles.detailLabel}>Destination:</Text>
                  <Text style={styles.detailValue}>
                    {parcel.delivery_city}, {parcel.delivery_region}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="scale-outline" size={16} color={COLORS.textSecondary} style={styles.detailIcon} />
                  <Text style={styles.detailLabel}>Weight:</Text>
                  <Text style={styles.detailValue}>{parcel.weight_kg} kg</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} style={styles.detailIcon} />
                  <Text style={styles.detailLabel}>Booked:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(parcel.booked_at || parcel.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.trackButton}>
                <Text style={styles.trackButtonText}>View Tracking</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: SIZES.lg,
  },
  title: {
    fontSize: SIZES.h2,
    ...FONTS.bold,
    color: COLORS.surface,
    marginBottom: SIZES.xs,
  },
  headerSubtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.lg,
    marginTop: -10,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: SIZES.xs,
    ...SHADOWS.medium,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  statNumber: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  statLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
  listContainer: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.lg,
    ...SHADOWS.small,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  emptyText: {
    fontSize: SIZES.h4,
    ...FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  emptySubtext: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.xl,
    paddingHorizontal: SIZES.xl,
    lineHeight: 22,
  },
  bookButton: {
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  bookButtonText: {
    color: COLORS.surface,
    fontSize: SIZES.h6,
    ...FONTS.semiBold,
    marginLeft: SIZES.sm,
  },
  parcelCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.medium,
  },
  parcelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
    paddingBottom: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  trackingNumber: {
    fontSize: SIZES.h6,
    ...FONTS.bold,
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
  },
  statusText: {
    color: COLORS.surface,
    fontSize: SIZES.caption,
    ...FONTS.semiBold,
  },
  parcelDetails: {
    marginBottom: SIZES.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  detailIcon: {
    marginRight: SIZES.xs,
  },
  detailLabel: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
    ...FONTS.medium,
    marginRight: SIZES.xs,
    minWidth: 80,
  },
  detailValue: {
    flex: 1,
    fontSize: SIZES.bodySmall,
    color: COLORS.text,
    ...FONTS.regular,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  trackButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginRight: SIZES.xs,
  },
});
