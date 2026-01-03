import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';
import { API_BASE_URL } from '../utils/config';

export default function RecentParcelScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { user } = useUser();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchParcels = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/shipments/user/${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch parcels');
      }
      const data = await response.json();
      // Get only recent (last 10 non-delivered)
      const recent = (data.shipments || [])
        .filter(p => p.status !== 'delivered')
        .slice(0, 10);
      setParcels(recent);
    } catch (err) {
      console.error('Error fetching parcels:', err);
      setError('Could not load recent parcels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchParcels();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      booked: '#FFA500',
      picked_up: '#2196F3',
      in_transit: '#2196F3',
      customs: '#9C27B0',
      out_for_delivery: '#FF5722',
      delivered: '#4CAF50',
      cancelled: '#F44336',
    };
    return statusColors[status] || '#999';
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.accent} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.accent }]}>Recent Parcels</Text>
          <Text style={styles.subtitle}>Active deliveries</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading parcels...</Text>
          </View>
        ) : error ? (
          <View style={[styles.errorContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchParcels}
            >
              <Text style={[styles.retryButtonText, { color: colors.accent }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : parcels.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.border }]}>
              <Ionicons name="cube-outline" size={60} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>No recent parcels</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              All your parcels have been delivered or you haven't booked any yet
            </Text>
            <TouchableOpacity 
              style={[styles.bookButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Booking')}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
              <Text style={[styles.bookButtonText, { color: colors.accent }]}>Book a Parcel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          parcels.map((parcel, index) => (
            <TouchableOpacity
              key={parcel._id || parcel.id || index}
              style={[styles.parcelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Tracking', { tracking_number: parcel.tracking_number })}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.parcelId, { color: colors.primary }]}>
                    {parcel.parcel_id_short || parcel.tracking_number?.substring(0, 8) || 'N/A'}
                  </Text>
                  <Text style={[styles.receiverName, { color: colors.text }]}>
                    To: {parcel.receiver_name || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(parcel.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(parcel.status)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {parcel.delivery_city || 'Ghana'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    {parcel.createdAt ? new Date(parcel.createdAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.trackButton}>
                <Text style={[styles.trackButtonText, { color: colors.primary }]}>Track Parcel</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  parcelCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  parcelId: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  receiverName: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});
