import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';

export default function OrdersScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
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
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.primary}
      />
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <Text style={[styles.title, { color: colors.accent }]}>My Parcels</Text>
        <Text style={[styles.headerSubtitle, { color: colors.accent + 'CC' }]}>Track all your deliveries</Text>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="cube" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{stats.total_parcels}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.secondary + '15' }]}>
            <Ionicons name="airplane" size={24} color={colors.secondary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.secondary }]}>{stats.in_transit}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Transit</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.delivered}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Delivered</Text>
        </View>
      </View>

      {/* Parcels List */}
      <View style={styles.listContainer}>
        {parcels.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.border }]}>
              <Ionicons name="cube-outline" size={60} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>No parcels yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Book your first parcel to start tracking deliveries
            </Text>
            <TouchableOpacity 
              style={[styles.bookButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('HomeTab')}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
              <Text style={[styles.bookButtonText, { color: colors.accent }]}>Book a Parcel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          parcels.map((parcel) => (
            <TouchableOpacity
              key={parcel.id}
              style={[styles.parcelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleTrackParcel(parcel)}
            >
              <View style={styles.parcelHeader}>
                <Text style={[styles.trackingNumber, { color: colors.text }]}>
                  {parcel.tracking_number}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(parcel.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(parcel.status)}</Text>
                </View>
              </View>

              <View style={styles.parcelDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color={colors.secondary} style={styles.detailIcon} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>To:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{parcel.receiver_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color={colors.secondary} style={styles.detailIcon} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Destination:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {parcel.delivery_city}, {parcel.delivery_region}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="scale-outline" size={16} color={colors.secondary} style={styles.detailIcon} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Weight:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{parcel.weight_kg} kg</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.secondary} style={styles.detailIcon} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Booked:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(parcel.booked_at || parcel.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.trackButton, { backgroundColor: colors.secondary + '15' }]}>
                <Text style={[styles.trackButtonText, { color: colors.secondary }]}>View Tracking</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.secondary} />
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
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: SIZES.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.lg,
    marginTop: -10,
  },
  statCard: {
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
    marginBottom: SIZES.xs,
  },
  statLabel: {
    fontSize: SIZES.caption,
    ...FONTS.medium,
  },
  listContainer: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.lg,
    ...SHADOWS.small,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
  emptyText: {
    fontSize: SIZES.h4,
    ...FONTS.semiBold,
    marginBottom: SIZES.sm,
  },
  emptySubtext: {
    fontSize: SIZES.body,
    textAlign: 'center',
    marginBottom: SIZES.xl,
    paddingHorizontal: SIZES.xl,
    lineHeight: 22,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    ...SHADOWS.medium,
  },
  bookButtonText: {
    fontSize: SIZES.h6,
    ...FONTS.semiBold,
    marginLeft: SIZES.sm,
  },
  parcelCard: {
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    borderWidth: 1,
    ...SHADOWS.medium,
  },
  parcelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
    paddingBottom: SIZES.md,
    borderBottomWidth: 1,
  },
  trackingNumber: {
    fontSize: SIZES.h6,
    ...FONTS.bold,
  },
  statusBadge: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
  },
  statusText: {
    color: '#FFFFFF',
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
    ...FONTS.medium,
    marginRight: SIZES.xs,
    minWidth: 80,
  },
  detailValue: {
    flex: 1,
    fontSize: SIZES.bodySmall,
    ...FONTS.regular,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusSm,
  },
  trackButtonText: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginRight: SIZES.xs,
  },
});
