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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/theme';
import { fetchDriverAssignmentsPaginated, updatePickupStatus, reportSizeMismatch } from '../utils/optimizedApi';
import { useAuth } from '../context/AuthContext';

// Parcel size options with prices
const PARCEL_SIZES = [
  { id: 'small_box', label: 'Small Box', price: 45, dimensions: '30×30×30cm', icon: 'cube-outline' },
  { id: 'medium_box', label: 'Medium Box', price: 75, dimensions: '45×45×45cm', icon: 'cube' },
  { id: 'large_box', label: 'Large Box', price: 105, dimensions: '60×60×60cm', icon: 'cube' },
  { id: 'extra_large_box', label: 'Extra-Large Box', price: 140, dimensions: '75×75×75cm', icon: 'cube' },
  { id: 'barrel', label: 'Barrel / Drum', price: 180, dimensions: '60-200L', icon: 'file-tray-stacked' },
];

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
  
  // Size mismatch state
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [sizeMismatchPickup, setSizeMismatchPickup] = useState(null);
  const [selectedNewSize, setSelectedNewSize] = useState(null);
  const [sizeNotes, setSizeNotes] = useState('');
  const [submittingSizeMismatch, setSubmittingSizeMismatch] = useState(false);

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

  // Size mismatch functions
  const openSizeMismatchModal = (pickup) => {
    setSizeMismatchPickup(pickup);
    setSelectedNewSize(null);
    setSizeNotes('');
    setShowSizeModal(true);
  };

  const getOriginalSizePrice = (sizeId) => {
    const size = PARCEL_SIZES.find(s => s.id === sizeId);
    return size?.price || 45;
  };

  const handleReportSizeMismatch = async () => {
    if (!selectedNewSize) {
      Alert.alert('Select Size', 'Please select the actual parcel size');
      return;
    }

    const originalSize = sizeMismatchPickup?.parcel_size || 'small_box';
    const originalPrice = getOriginalSizePrice(originalSize);
    const newPrice = getOriginalSizePrice(selectedNewSize);

    if (newPrice <= originalPrice) {
      Alert.alert(
        'Invalid Selection', 
        'The new size must be larger than the original booking. If the parcel is smaller or same size, proceed with the pickup.'
      );
      return;
    }

    const extraCharge = newPrice - originalPrice;

    Alert.alert(
      'Confirm Size Adjustment',
      `This will request an extra £${extraCharge.toFixed(2)} from the customer.\n\nOriginal: ${originalSize.replace('_', ' ')} (£${originalPrice})\nActual: ${selectedNewSize.replace('_', ' ')} (£${newPrice})\n\nThe customer will be notified and must approve before you can complete the pickup.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmittingSizeMismatch(true);
            try {
              await reportSizeMismatch(sizeMismatchPickup.id, selectedNewSize, sizeNotes);
              Alert.alert(
                'Request Sent',
                'The customer has been notified. Wait for their approval before completing the pickup.',
                [{ text: 'OK', onPress: () => {
                  setShowSizeModal(false);
                  onRefresh();
                }}]
              );
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to submit size adjustment request');
            } finally {
              setSubmittingSizeMismatch(false);
            }
          },
        },
      ]
    );
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
            <Ionicons name={pickup.payment_method === 'cash' ? 'cash-outline' : 'card-outline'} size={16} color={colors.secondary} />
            <Text style={{ fontSize: 14, color: colors.text }}>
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

      {/* Size Adjustment Pending Banner */}
      {pickup.size_adjustment?.requested && pickup.size_adjustment?.status === 'pending' && (
        <View style={[styles.sizePendingBanner, { backgroundColor: '#FFA50020', borderColor: '#FFA500' }]}>
          <Ionicons name="time-outline" size={20} color="#FFA500" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={{ color: '#FFA500', fontWeight: '600' }}>Size Adjustment Pending</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Waiting for customer to approve £{((pickup.size_adjustment.extra_amount || 0) / 100).toFixed(2)} extra
            </Text>
          </View>
        </View>
      )}

      {/* Size Adjustment Approved Banner */}
      {pickup.size_adjustment?.requested && pickup.size_adjustment?.status === 'approved' && (
        <View style={[styles.sizePendingBanner, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={{ color: '#10B981', fontWeight: '600' }}>Size Adjustment Approved</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Customer approved. You can now complete the pickup.
            </Text>
          </View>
        </View>
      )}

      {/* Report Size Issue Button - Only show if no pending adjustment */}
      {(pickup.status === 'pickup_scheduled' || pickup.status === 'pending' || pickup.status === 'booked') && 
       !pickup.size_adjustment?.requested && (
        <TouchableOpacity
          style={[styles.sizeIssueBtn, { borderColor: '#FFA500' }]}
          onPress={() => openSizeMismatchModal(pickup)}
        >
          <Ionicons name="resize-outline" size={18} color="#FFA500" />
          <Text style={{ color: '#FFA500', fontWeight: '600', marginLeft: 8 }}>Report Size Issue</Text>
        </TouchableOpacity>
      )}

      {/* Complete Button - Disabled if size adjustment pending */}
      {(pickup.status === 'pickup_scheduled' || pickup.status === 'pending' || pickup.status === 'booked') && (
        <TouchableOpacity
          style={[
            styles.completeBtn, 
            { 
              backgroundColor: pickup.size_adjustment?.status === 'pending' 
                ? colors.textSecondary 
                : colors.success,
              opacity: pickup.size_adjustment?.status === 'pending' ? 0.5 : 1
            }
          ]}
          onPress={() => {
            if (pickup.size_adjustment?.status === 'pending') {
              Alert.alert('Waiting for Customer', 'Customer must approve the size adjustment before pickup can be completed.');
            } else {
              markAsCompleted(pickup);
            }
          }}
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

      {/* Size Mismatch Modal */}
      <Modal
        visible={showSizeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSizeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sizeModal, { backgroundColor: colors.surface }]}>
            <View style={styles.sizeModalHeader}>
              <Text style={[styles.sizeModalTitle, { color: colors.text }]}>Report Size Mismatch</Text>
              <TouchableOpacity onPress={() => setShowSizeModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Original Size Info */}
            <View style={[styles.originalSizeBox, { backgroundColor: colors.background }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>CUSTOMER BOOKED</Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 4 }}>
                {(sizeMismatchPickup?.parcel_size || 'small_box').replace('_', ' ')} - £{getOriginalSizePrice(sizeMismatchPickup?.parcel_size || 'small_box')}
              </Text>
            </View>

            <Text style={{ color: colors.text, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>
              Select Actual Size:
            </Text>

            {/* Size Options */}
            {PARCEL_SIZES.filter(size => {
              const originalPrice = getOriginalSizePrice(sizeMismatchPickup?.parcel_size || 'small_box');
              return size.price > originalPrice;
            }).map(size => (
              <TouchableOpacity
                key={size.id}
                style={[
                  styles.sizeOption,
                  { 
                    borderColor: selectedNewSize === size.id ? colors.primary : colors.border,
                    backgroundColor: selectedNewSize === size.id ? colors.primary + '10' : colors.background
                  }
                ]}
                onPress={() => setSelectedNewSize(size.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name={size.icon} size={24} color={selectedNewSize === size.id ? colors.primary : colors.textSecondary} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{size.label}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{size.dimensions}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>£{size.price}</Text>
                  <Text style={{ color: '#10B981', fontSize: 12 }}>
                    +£{(size.price - getOriginalSizePrice(sizeMismatchPickup?.parcel_size || 'small_box')).toFixed(2)}
                  </Text>
                </View>
                {selectedNewSize === size.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            ))}

            {/* Notes Input */}
            <Text style={{ color: colors.text, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>
              Notes (optional):
            </Text>
            <TextInput
              style={[styles.notesInput, { borderColor: colors.border, color: colors.text }]}
              placeholder="Add any notes for the customer..."
              placeholderTextColor={colors.textSecondary}
              value={sizeNotes}
              onChangeText={setSizeNotes}
              multiline
              numberOfLines={2}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitSizeBtn, { backgroundColor: '#FFA500', opacity: submittingSizeMismatch ? 0.6 : 1 }]}
              onPress={handleReportSizeMismatch}
              disabled={submittingSizeMismatch}
            >
              {submittingSizeMismatch ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: '700', marginLeft: 8 }}>Send Adjustment Request</Text>
                </>
              )}
            </TouchableOpacity>
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
  // Size mismatch styles
  sizePendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  sizeIssueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    marginTop: 12,
  },
  sizeModal: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: 20,
  },
  sizeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sizeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  originalSizeBox: {
    padding: 12,
    borderRadius: 8,
  },
  sizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 10,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitSizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
  },
});
