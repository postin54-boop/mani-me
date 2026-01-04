import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
  RefreshControl,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/theme';
import { fetchDriverAssignmentsPaginated, updatePickupStatus } from '../utils/optimizedApi';
import { useAuth } from '../context/AuthContext';

export default function UKPickupsScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { user } = useAuth();
  const [pickups, setPickups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchPickups(1);
  }, []);

  const fetchPickups = async (pageNum = 1, append = false) => {
    if (!user?.id && !user?._id) {
      console.warn('No user ID available');
      setLoading(false);
      return;
    }

    try {
      const userId = user.id || user._id;
      const result = await fetchDriverAssignmentsPaginated(userId, 'pickup', pageNum, 20);
      
      // Extract shipments array from nested response structure
      let newPickups = [];
      if (result.data?.data?.shipments) {
        newPickups = result.data.data.shipments;
      } else if (result.data?.shipments) {
        newPickups = result.data.shipments;
      } else if (Array.isArray(result.data)) {
        newPickups = result.data;
      }
      
      if (append) {
        setPickups(prev => [...prev, ...newPickups]);
      } else {
        setPickups(newPickups);
      }
      
      setHasMore(newPickups.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching pickups:', error);
      Alert.alert('Error', 'Failed to load pickups. Using offline mode.');
      
      // Fallback to mock data only on first load
      if (pageNum === 1) {
        setPickups([
          {
            id: 'PU001',
            parcel_id_short: 'MM482',
            tracking_number: 'MANI-UK-123456',
            sender_name: 'John Smith',
            pickup_address: '45 Oxford Street, London W1D 2DZ',
            pickup_city: 'London',
            pickup_date: '23/11/2025',
            pickup_time: '9:00 AM - 10:00 AM',
            sender_phone: '+44 20 7946 0958',
            parcel_type: 'Documents',
            special_instructions: 'Ring doorbell twice',
            status: 'pickup_scheduled',
          },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchPickups(1, false);
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !refreshing) {
      setLoadingMore(true);
      fetchPickups(page + 1, true);
    }
  }, [loadingMore, hasMore, refreshing, page]);

  const openMaps = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    Linking.openURL(url);
  };

  const callCustomer = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const markAsCompleted = async (pickup) => {
    Alert.alert(
      'Confirm Pickup',
      `Mark parcel ${pickup.parcel_id_short} as collected?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updatePickupStatus(pickup.id, 'parcel_collected');
              Alert.alert('Success', 'Pickup marked as completed');
              onRefresh();
            } catch (error) {
              Alert.alert('Error', 'Failed to update pickup status');
            }
          },
        },
      ]
    );
  };

  const viewQRCode = (pickup) => {
    setSelectedPickup(pickup);
    setShowQRModal(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Flexible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };

  const renderPickupCard = ({ item: pickup }) => (
    <View
      style={[
        styles.pickupCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.parcelId, { color: colors.primary }]}>
            {pickup.parcel_id_short || pickup.tracking_number || pickup.id}
          </Text>
          <Text style={[styles.trackingNumber, { color: colors.textSecondary }]}>
            {pickup.tracking_number}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                pickup.status === 'parcel_collected' || pickup.status === 'picked_up' || pickup.status === 'completed'
                  ? colors.success + '20'
                  : colors.warning + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  pickup.status === 'parcel_collected' || pickup.status === 'picked_up' || pickup.status === 'completed'
                    ? colors.success
                    : colors.warning,
              },
            ]}
          >
            {pickup.status === 'parcel_collected' || pickup.status === 'picked_up' || pickup.status === 'completed' ? 'Collected' : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Sender Info */}
      <View style={[styles.sectionBox, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SENDER</Text>
        <Text style={[styles.customerName, { color: colors.text }]}>
          {pickup.sender_name || 'N/A'}
        </Text>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color={colors.secondary} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {pickup.sender_phone || 'No phone'}
          </Text>
        </View>
        {pickup.sender_email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color={colors.secondary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {pickup.sender_email}
            </Text>
          </View>
        )}
      </View>

      {/* Pickup Details */}
      <View style={[styles.sectionBox, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PICKUP DETAILS</Text>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={colors.secondary} />
          <Text style={[styles.detailText, { color: colors.text, flex: 1 }]}>
            {pickup.pickup_address ? `${pickup.pickup_address}${pickup.pickup_city ? ', ' + pickup.pickup_city : ''}${pickup.pickup_postcode ? ' ' + pickup.pickup_postcode : ''}` : 'Address not provided'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.secondary} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {formatDate(pickup.pickup_date)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.secondary} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {pickup.pickup_time || 'Flexible'}
          </Text>
        </View>
      </View>

      {/* Parcel Details */}
      <View style={[styles.sectionBox, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PARCEL INFO</Text>
        <View style={styles.detailRow}>
          <Ionicons name="cube-outline" size={16} color={colors.secondary} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {pickup.parcel_description || pickup.parcel_type || 'General'}
            {pickup.parcel_size && ` (${pickup.parcel_size})`}
          </Text>
        </View>
        {pickup.weight_kg && (
          <View style={styles.detailRow}>
            <Ionicons name="scale-outline" size={16} color={colors.secondary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {pickup.weight_kg} kg
            </Text>
          </View>
        )}
        {pickup.dimensions && (
          <View style={styles.detailRow}>
            <Ionicons name="resize-outline" size={16} color={colors.secondary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {pickup.dimensions}
            </Text>
          </View>
        )}
      </View>

      {/* Destination (Ghana) */}
      <View style={[styles.sectionBox, { backgroundColor: '#10B98110' }]}>
        <Text style={[styles.sectionTitle, { color: colors.success }]}>🇬🇭 DESTINATION</Text>
        <Text style={[styles.customerName, { color: colors.text }]}>
          {pickup.receiver_name || 'N/A'}
        </Text>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={colors.success} />
          <Text style={[styles.detailText, { color: colors.text, flex: 1 }]}>
            {pickup.delivery_address ? `${pickup.delivery_address}${pickup.delivery_city ? ', ' + pickup.delivery_city : ''}${pickup.delivery_region ? ', ' + pickup.delivery_region : ''}` : pickup.ghana_destination || 'Ghana'}
          </Text>
        </View>
        {pickup.receiver_phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color={colors.success} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {pickup.receiver_phone}
            </Text>
          </View>
        )}
      </View>

      {/* Parcel Image */}
      {pickup.parcel_image_url && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: pickup.parcel_image_url }} style={styles.parcelImage} />
        </View>
      )}

      {/* Special Instructions */}
      {pickup.special_instructions && (
        <View style={[styles.instructionsBox, { backgroundColor: colors.warning + '10', borderColor: colors.warning }]}>
          <Ionicons name="alert-circle" size={16} color={colors.warning} />
          <Text style={[styles.instructionsText, { color: colors.text }]}>
            {pickup.special_instructions}
          </Text>
        </View>
      )}

      {/* Payment Info */}
      {pickup.payment_method && (
        <View style={styles.paymentRow}>
          <View style={styles.detailRow}>
            <Ionicons name={pickup.payment_method === 'cash' ? 'cash-outline' : 'card-outline'} size={16} color={colors.secondary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {pickup.payment_method === 'cash' ? 'Cash on Pickup' : 'Paid by Card'}
            </Text>
          </View>
          {pickup.total_cost > 0 && (
            <Text style={[styles.costText, { color: colors.primary }]}>
              £{pickup.total_cost?.toFixed(2)}
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {pickup.qr_code_url && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => viewQRCode(pickup)}
          >
            <Ionicons name="qr-code" size={20} color="#FFF" />
            <Text style={[styles.actionText, { color: '#FFF' }]}>QR</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
          onPress={() => openMaps(pickup.pickup_address || pickup.address)}
        >
          <Ionicons name="navigate" size={20} color="#FFF" />
          <Text style={[styles.actionText, { color: '#FFF' }]}>Navigate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => callCustomer(pickup.sender_phone || pickup.phone)}
        >
          <Ionicons name="call" size={20} color={colors.secondary} />
          <Text style={[styles.actionText, { color: colors.text }]}>Call</Text>
        </TouchableOpacity>
      </View>

      {/* Complete Button */}
      {(pickup.status === 'pickup_scheduled' || pickup.status === 'pending' || pickup.status === 'booked') && (
        <TouchableOpacity
          style={[styles.completeBtn, { backgroundColor: colors.success }]}
          onPress={() => markAsCompleted(pickup)}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.completeBtnText}>Mark as Picked Up</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[{ color: colors.textSecondary, marginTop: 16 }]}>Loading pickups...</Text>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
        <Ionicons name="cube-outline" size={64} color={colors.textSecondary} />
        <Text style={[{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 }]}>
          No Pickups Assigned
        </Text>
        <Text style={[{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
          You don't have any pickups scheduled at the moment
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>UK Pickups</Text>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>{pickups.length}</Text>
        </View>
      </View>

      <FlatList
        data={pickups}
        renderItem={renderPickupCard}
        keyExtractor={(item, index) => item._id || item.id || index.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
      />

      {/* QR Code Modal */}
        <Modal
          visible={showQRModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQRModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.qrModal, { backgroundColor: colors.surface }]}>
              <View style={styles.qrModalHeader}>
                <Text style={[styles.qrModalTitle, { color: colors.text }]}>
                  {selectedPickup?.parcel_id_short || 'Parcel QR Code'}
                </Text>
                <TouchableOpacity onPress={() => setShowQRModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              {selectedPickup?.qr_code_url && (
                <Image 
                  source={{ uri: selectedPickup.qr_code_url }} 
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              )}
              <Text style={[styles.qrModalSubtitle, { color: colors.textSecondary }]}>
                Tracking: {selectedPickup?.tracking_number}
              </Text>
            </View>
          </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pickupCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pickupId: {
    fontSize: 12,
    marginBottom: 4,
  },
  parcelId: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  trackingNumber: {
    fontSize: 11,
    marginBottom: 6,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  timeSlot: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  instructionsBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  instructionsText: {
    fontSize: 13,
    flex: 1,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  parcelImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  sectionBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 12,
  },
  costText: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModal: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  qrImage: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
  qrModalSubtitle: {
    fontSize: 14,
  },
  endDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 32,
    gap: 12,
  },
  endDayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
