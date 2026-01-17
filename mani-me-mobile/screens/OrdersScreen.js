import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, StatusBar, Modal, TextInput, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useThemeColors, SIZES, SHADOWS, FONTS, BRAND_COLORS } from '../constants/theme';
import { API_BASE_URL } from '../utils/config';
import { ParcelCardSkeleton } from '../components/Skeleton';
import { InlineError, EmptyState } from '../components/ErrorRetry';
import logger from '../utils/logger';

export default function OrdersScreen({ navigation }) {
  const { colors: themeColors, isDark } = useThemeColors();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total_parcels: 0, delivered: 0, in_transit: 0 });
  const { user } = useUser();

  // Pickup management state
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Use user.id from context
  const userId = user?.id;

  const fetchParcels = useCallback(async () => {
    if (!userId) return; // Don't fetch if no user
    
    try {
      setError(null);
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const url = `${API_BASE_URL}/api/shipments/user/${userId}`;
      if (__DEV__) {
        logger.log('Fetching parcels from:', url);
      }
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const data = await response.json();
      setParcels(data.shipments || []);
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.error('Error fetching parcels: Request timed out. API_BASE_URL:', API_BASE_URL);
        setError(`Connection timed out. Make sure your phone and computer are on the same WiFi network. Server: ${API_BASE_URL}`);
      } else if (err.message === 'Network request failed') {
        logger.error('Network request failed. API_BASE_URL:', API_BASE_URL);
        setError(`Cannot reach server. Check if backend is running at ${API_BASE_URL}`);
      } else {
        logger.error('Error fetching parcels:', err.message || err);
        setError('Failed to load parcels');
      }
    }
  }, [userId]);

  const fetchStats = useCallback(async () => {
    if (!userId) return; // Don't fetch if no user
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const url = `${API_BASE_URL}/api/shipments/stats/${userId}`;
      if (__DEV__) {
        logger.log('Fetching stats from:', url);
      }
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.error('Error fetching stats: Request timed out. Check if API_BASE_URL is reachable:', API_BASE_URL);
      } else {
        logger.error('Error fetching stats:', err.message || err);
      }
      // Don't show error to user for stats - gracefully fail with default values
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) return; // Don't load if no user
    setLoading(true);
    await Promise.all([fetchParcels(), fetchStats()]);
    setLoading(false);
  }, [fetchParcels, fetchStats, userId]);

  useEffect(() => {
    if (userId) {
      loadData();
    }

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (userId) {
        fetchParcels();
        fetchStats();
      }
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [loadData, fetchParcels, fetchStats, userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchParcels();
    await fetchStats();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      booked: '#FFA500',
      pending: '#FFA500',
      pending_pickup: '#FFA500',
      pending_dropoff: '#83C5FA',
      picked_up: '#2196F3',
      in_transit: '#2196F3',
      customs: '#83C5FA',
      out_for_delivery: '#FF5722',
      delivered: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status] || '#999';
  };

  const getStatusIcon = (status) => {
    const icons = {
      booked: 'time-outline',
      pending: 'time-outline',
      pending_pickup: 'time-outline',
      pending_dropoff: 'business-outline',
      picked_up: 'checkmark-circle-outline',
      in_transit: 'airplane-outline',
      customs: 'shield-checkmark-outline',
      out_for_delivery: 'bicycle-outline',
      delivered: 'checkmark-done-circle-outline',
      cancelled: 'close-circle-outline',
    };
    return icons[status] || 'ellipse-outline';
  };

  const getStatusLabel = (status) => {
    const labels = {
      booked: 'Booked',
      pending: 'Pending',
      pending_pickup: 'Pickup Scheduled',
      pending_dropoff: 'Drop-off Pending',
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
  
  const handleParcelActions = (parcel) => {
    setSelectedParcel(parcel);
    setActionModalVisible(true);
  };
  
  const handleDropOffAtWarehouse = () => {
    Alert.alert(
      'Drop-off at Warehouse',
      'Would you like to bring this parcel to our warehouse instead of scheduling a pickup?\n\nThis will skip the driver pickup and you can drop off at your convenience.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, I\'ll Drop Off',
          onPress: async () => {
            try {
              const parcelId = selectedParcel._id || selectedParcel.id;
              const response = await fetch(`${API_BASE_URL}/api/shipments/dropoff/${parcelId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
              });
              
              if (response.ok) {
                const data = await response.json();
                setActionModalVisible(false);
                fetchParcels();
                
                // Show warehouse details
                Alert.alert(
                  'Drop-off Confirmed',
                  `📍 ${data.warehouse.name}\n${data.warehouse.address}\n${data.warehouse.postcode}\n\n🕐 Hours: ${data.warehouse.hours}\n📞 ${data.warehouse.phone}\n\nPlease bring your tracking number:\n${selectedParcel.tracking_number}`,
                  [
                    { 
                      text: 'Get Directions', 
                      onPress: () => {
                        // Open Google Maps with warehouse location
                        const address = encodeURIComponent('123 London Road, London, E1 4AA, UK');
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
                      }
                    },
                    { text: 'OK' }
                  ]
                );
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.error || 'Failed to update shipment');
              }
            } catch (error) {
              logger.error('Drop-off error:', error);
              Alert.alert('Error', 'Network error. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const handleCancelPickup = () => {
    Alert.alert(
      'Cancel Pickup',
      'Are you sure you want to cancel this pickup? This action cannot be undone.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const parcelId = selectedParcel._id || selectedParcel.id;
              const response = await fetch(`${API_BASE_URL}/api/shipments/cancel/${parcelId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
              });
              
              if (response.ok) {
                Alert.alert('Success', 'Pickup cancelled successfully');
                setActionModalVisible(false);
                fetchParcels();
                fetchStats();
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.error || 'Failed to cancel pickup');
              }
            } catch (error) {
              logger.error('Cancel pickup error:', error);
              Alert.alert('Error', 'Network error. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const handleReschedulePickup = () => {
    setActionModalVisible(false);
    setRescheduleModalVisible(true);
  };
  
  const submitReschedule = async () => {
    if (!rescheduleDate || !rescheduleReason) {
      Alert.alert('Missing Information', 'Please provide both date and reason for rescheduling');
      return;
    }
    
    try {
      const parcelId = selectedParcel._id || selectedParcel.id;
      const response = await fetch(`${API_BASE_URL}/api/shipments/reschedule/${parcelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_pickup_date: rescheduleDate,
          reason: rescheduleReason,
        }),
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Pickup rescheduled successfully. Our team will contact you to confirm.');
        setRescheduleModalVisible(false);
        setRescheduleDate('');
        setRescheduleReason('');
        fetchParcels();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to reschedule pickup');
      }
    } catch (error) {
      logger.error('Reschedule error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };
  
  const canModifyPickup = (parcel) => {
    // Allow modification for parcels that haven't been picked up yet
    const modifiableStatuses = [
      'pickup_scheduled',
      'booked',
      'pending_pickup',
      'pending',
      'confirmed',
      'pending_dropoff'  // Allow canceling pending drop-offs
    ];
    return modifiableStatuses.includes(parcel.status);
  };
  
  // Check if parcel is in pending drop-off state
  const isPendingDropOff = (parcel) => {
    return parcel?.status === 'pending_dropoff';
  };
  
  // Handle cancel drop-off - revert back to regular pickup
  const handleCancelDropOff = () => {
    Alert.alert(
      'Cancel Drop-off',
      'Would you like to cancel the drop-off and schedule a driver pickup instead?',
      [
        { text: 'No, Keep Drop-off', style: 'cancel' },
        {
          text: 'Yes, Schedule Pickup',
          onPress: async () => {
            try {
              const parcelId = selectedParcel._id || selectedParcel.id;
              const response = await fetch(`${API_BASE_URL}/api/shipments/cancel-dropoff/${parcelId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
              });
              
              if (response.ok) {
                Alert.alert(
                  'Drop-off Cancelled', 
                  'Your parcel has been reverted to pickup mode. A driver will be assigned to collect it.',
                  [{ text: 'OK' }]
                );
                setActionModalVisible(false);
                fetchParcels();
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.error || 'Failed to cancel drop-off');
              }
            } catch (error) {
              logger.error('Cancel drop-off error:', error);
              Alert.alert('Error', 'Network error. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={themeColors.primary}
          colors={[themeColors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.primary}
      />
      {/* Header with Gradient */}
      <LinearGradient
        colors={[themeColors.primary, themeColors.primaryLight]}
        style={styles.header}
      >
        <Text style={[styles.title, { color: themeColors.accent }]}>My Parcels</Text>
        <Text style={[styles.headerSubtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>Track all your deliveries</Text>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: themeColors.surface }]}>
          <View style={[styles.statIconContainer, { backgroundColor: themeColors.primary + '15' }]}>
            <Ionicons name="cube" size={24} color={themeColors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: themeColors.text }]}>{stats.total_parcels}</Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: themeColors.surface }]}>
          <View style={[styles.statIconContainer, { backgroundColor: themeColors.secondary + '15' }]}>
            <Ionicons name="airplane" size={24} color={themeColors.secondary} />
          </View>
          <Text style={[styles.statNumber, { color: themeColors.secondary }]}>{stats.in_transit}</Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>In Transit</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: themeColors.surface }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.delivered}</Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Delivered</Text>
        </View>
      </View>

      {/* Parcels List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={{ padding: 16 }}>
            <ParcelCardSkeleton />
            <ParcelCardSkeleton />
            <ParcelCardSkeleton />
          </View>
        ) : error ? (
          <View style={{ padding: 16 }}>
            <InlineError message={error} onRetry={loadData} />
          </View>
        ) : parcels.length === 0 ? (
          <EmptyState
            message="No parcels yet"
            icon="cube-outline"
            actionText="Book a Parcel"
            onAction={() => navigation.navigate('Booking')}
          />
        ) : (
          parcels.map((parcel) => (
            <View
              key={parcel._id || parcel.id || parcel.tracking_number}
              style={[styles.parcelCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            >
              {/* Status Strip at Top */}
              <View style={[styles.statusStrip, { backgroundColor: getStatusColor(parcel.status) }]}>
                <Ionicons name={getStatusIcon(parcel.status)} size={20} color="#FFFFFF" />
                <Text style={styles.statusStripText}>{getStatusLabel(parcel.status)}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.parcelCardContent}
                onPress={() => handleTrackParcel(parcel)}
                activeOpacity={0.7}
              >
                {/* Parcel Header */}
                <View style={styles.parcelHeader}>
                  <View style={styles.parcelIdContainer}>
                    <Text style={[styles.parcelId, { color: themeColors.text }]}>
                      #{parcel.parcel_id_short || parcel.tracking_number?.slice(0, 10) || 'N/A'}
                    </Text>
                  </View>
                  <View style={[styles.weightBadge, { backgroundColor: themeColors.secondary + '20' }]}>
                    <Ionicons name="scale-outline" size={14} color={themeColors.secondary} />
                    <Text style={[styles.weightText, { color: themeColors.secondary }]}>
                      {parcel?.weight_kg || 0} kg
                    </Text>
                  </View>
                </View>

                {/* Route Visual */}
                <View style={styles.routeContainer}>
                  <View style={styles.routePoint}>
                    <View style={[styles.routeDot, { backgroundColor: themeColors.primary }]} />
                    <Text style={[styles.routeCity, { color: themeColors.text }]}>{parcel.pickup_city || 'UK'}</Text>
                  </View>
                  <View style={styles.routeLineWrapper}>
                    <View style={[styles.routeLine, { backgroundColor: themeColors.border }]} />
                    <Ionicons name="airplane" size={20} color={themeColors.secondary} style={styles.routeIcon} />
                    <View style={[styles.routeLine, { backgroundColor: themeColors.border }]} />
                  </View>
                  <View style={styles.routePoint}>
                    <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.routeCity, { color: themeColors.text }]}>{parcel.delivery_city || 'Ghana'}</Text>
                  </View>
                </View>

                {/* Receiver Info */}
                <View style={[styles.receiverCard, { backgroundColor: themeColors.background }]}>
                  <Ionicons name="person" size={20} color={themeColors.secondary} />
                  <View style={styles.receiverInfo}>
                    <Text style={[styles.receiverName, { color: themeColors.text }]}>{parcel.receiver_name}</Text>
                    <Text style={[styles.receiverLocation, { color: themeColors.textSecondary }]}>
                      {parcel.delivery_city}, {parcel.delivery_region}
                    </Text>
                  </View>
                </View>

                {/* Pickup Date */}
                <View style={styles.dateRow}>
                  <View style={styles.dateItem}>
                    <Ionicons name="calendar-outline" size={16} color="#83C5FA" />
                    <Text style={[styles.dateLabel, { color: '#83C5FA' }]}>Booked:</Text>
                    <Text style={[styles.dateValue, { color: themeColors.text }]}>
                      {new Date(parcel.booked_at || parcel.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {parcel.pickup_date && (
                    <View style={styles.dateItem}>
                      <Ionicons name="time-outline" size={16} color="#10B981" />
                      <Text style={[styles.dateLabel, { color: '#10B981' }]}>Pickup:</Text>
                      <Text style={[styles.dateValue, { color: '#10B981' }]}>
                        {new Date(parcel.pickup_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#83C5FA' }]}
                  onPress={() => navigation.navigate('Tracking', { parcel })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate-outline" size={18} color="#FFFFFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Track</Text>
                </TouchableOpacity>
                
                {parcel.qr_code_url && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#0B1A33' }]}
                    onPress={() => navigation.navigate('QRCode', { parcel })}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
                    <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>QR Code</Text>
                  </TouchableOpacity>
                )}
                
                {['picked_up', 'in_transit', 'customs', 'out_for_delivery'].includes(parcel.status) && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => navigation.navigate('Chat', {
                      shipment_id: parcel._id,
                      driver_name: 'Your Driver',
                      tracking_number: parcel.tracking_number
                    })}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
                    <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Chat</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Manage Pickup Button - Only for modifiable parcels */}
              {canModifyPickup(parcel) && (
                <TouchableOpacity 
                  style={[styles.managePickupBtn, { borderColor: themeColors.border, marginHorizontal: 16, marginBottom: 16 }]}
                  onPress={() => handleParcelActions(parcel)}
                  activeOpacity={0.8}
                >
                  <View style={styles.managePickupLeft}>
                    <View style={[styles.manageIconBg, { backgroundColor: BRAND_COLORS.primary }]}>
                      <Ionicons name="options-outline" size={18} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={[styles.managePickupTitle, { color: themeColors.text }]}>
                        {isPendingDropOff(parcel) ? 'Manage Drop-off' : 'Manage Pickup'}
                      </Text>
                      <Text style={[styles.managePickupSubtitle, { color: themeColors.textSecondary }]}>
                        {isPendingDropOff(parcel) ? 'Cancel drop-off or view warehouse' : 'Reschedule, cancel, or drop-off'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      <View style={{ height: 20 }} />
      
      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {isPendingDropOff(selectedParcel) ? 'Manage Drop-off' : 'Manage Pickup'}
              </Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <Ionicons name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
              Tracking: {selectedParcel?.tracking_number}
            </Text>
            
            <View style={styles.actionButtons}>
              {/* Show different options based on status */}
              {isPendingDropOff(selectedParcel) ? (
                <>
                  {/* Pending Drop-off Options */}
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: themeColors.secondary + '15' }]}
                    onPress={() => {
                      // Show warehouse details
                      Alert.alert(
                        'Warehouse Location',
                        '📍 Mani Me Warehouse\n123 London Road\nLondon E1 4AA\n\n🕐 Mon-Fri: 9AM - 6PM\nSat: 10AM - 4PM\n\n📞 07958 086887\n\nPlease bring your tracking number:\n' + selectedParcel?.tracking_number,
                        [
                          { 
                            text: 'Get Directions', 
                            onPress: () => {
                              const address = encodeURIComponent('123 London Road, London, E1 4AA, UK');
                              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
                            }
                          },
                          { text: 'OK' }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="location-outline" size={28} color={themeColors.secondary} />
                    <Text style={[styles.actionButtonTitle, { color: themeColors.text }]}>View Warehouse Details</Text>
                    <Text style={[styles.actionButtonSubtitle, { color: themeColors.textSecondary }]}>
                      Get address and opening hours
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#FFA500' + '15' }]}
                    onPress={handleCancelDropOff}
                  >
                    <Ionicons name="swap-horizontal-outline" size={28} color="#FFA500" />
                    <Text style={[styles.actionButtonTitle, { color: themeColors.text }]}>Switch to Pickup</Text>
                    <Text style={[styles.actionButtonSubtitle, { color: themeColors.textSecondary }]}>
                      Cancel drop-off, get driver pickup
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#F44336' + '15' }]}
                    onPress={handleCancelPickup}
                  >
                    <Ionicons name="close-circle-outline" size={28} color="#F44336" />
                    <Text style={[styles.actionButtonTitle, { color: themeColors.text }]}>Cancel Booking</Text>
                    <Text style={[styles.actionButtonSubtitle, { color: themeColors.textSecondary }]}>
                      Cancel this parcel completely
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Regular Pickup Options */}
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: themeColors.secondary + '15' }]}
                    onPress={handleDropOffAtWarehouse}
                  >
                    <Ionicons name="business-outline" size={28} color={themeColors.secondary} />
                    <Text style={[styles.actionButtonTitle, { color: themeColors.text }]}>Drop-off at Warehouse</Text>
                    <Text style={[styles.actionButtonSubtitle, { color: themeColors.textSecondary }]}>
                      Skip pickup, bring to our warehouse
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#FFA500' + '15' }]}
                    onPress={handleReschedulePickup}
                  >
                    <Ionicons name="calendar-outline" size={28} color="#FFA500" />
                    <Text style={[styles.actionButtonTitle, { color: themeColors.text }]}>Reschedule Pickup</Text>
                    <Text style={[styles.actionButtonSubtitle, { color: themeColors.textSecondary }]}>
                      Change pickup date (emergency only)
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#F44336' + '15' }]}
                    onPress={handleCancelPickup}
                  >
                    <Ionicons name="close-circle-outline" size={28} color="#F44336" />
                    <Text style={[styles.actionButtonTitle, { color: themeColors.text }]}>Cancel Pickup</Text>
                    <Text style={[styles.actionButtonSubtitle, { color: themeColors.textSecondary }]}>
                      Cancel this parcel booking
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Reschedule Pickup</Text>
              <TouchableOpacity onPress={() => setRescheduleModalVisible(false)}>
                <Ionicons name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalNote, { color: themeColors.textSecondary, backgroundColor: '#FFA500' + '15' }]}>
              ⚠️ Rescheduling is for emergencies only. Multiple reschedules may affect service priority.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>New Pickup Date</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={themeColors.textSecondary}
                value={rescheduleDate}
                onChangeText={setRescheduleDate}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Reason for Rescheduling</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                placeholder="Please explain why you need to reschedule..."
                placeholderTextColor={themeColors.textSecondary}
                value={rescheduleReason}
                onChangeText={setRescheduleReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: themeColors.primary }]}
              onPress={submitReschedule}
            >
              <Text style={[styles.submitButtonText, { color: themeColors.accent }]}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    marginVertical: 8,
    ...SHADOWS.medium,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  parcelCard: {
    borderRadius: 16,
    marginBottom: SIZES.md,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  parcelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
    paddingBottom: SIZES.md,
    borderBottomWidth: 1,
  },
  parcelId: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  trackingNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
    trackingNumberBold: {
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
    height: 56,
    borderRadius: 12,
    marginVertical: 8,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    marginVertical: 6,
    gap: SIZES.xs,
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  managePickupContainer: {
    marginTop: SIZES.sm,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusSm,
    marginTop: SIZES.sm,
  },
  manageButtonText: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginLeft: SIZES.xs,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.sm + 2,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.sm,
    gap: SIZES.xs,
    ...SHADOWS.medium,
  },
  manageButtonText: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
  },
  managePickupContainer: {
    marginTop: SIZES.sm,
  },
  manageHint: {
    fontSize: SIZES.caption,
    ...FONTS.regular,
    marginTop: SIZES.xs,
    marginLeft: SIZES.xs,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  modalTitle: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
  },
  modalSubtitle: {
    fontSize: SIZES.body,
    ...FONTS.medium,
    marginBottom: SIZES.lg,
  },
  actionButtons: {
    gap: SIZES.md,
  },
  actionButton: {
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
  },
  actionButtonTitle: {
    fontSize: SIZES.h6,
    ...FONTS.semiBold,
    marginTop: SIZES.sm,
  },
  actionButtonSubtitle: {
    fontSize: SIZES.caption,
    ...FONTS.regular,
    textAlign: 'center',
    marginTop: SIZES.xs,
  },
  modalNote: {
    fontSize: SIZES.bodySmall,
    ...FONTS.medium,
    padding: SIZES.md,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.lg,
  },
  inputContainer: {
    marginBottom: SIZES.lg,
  },
  inputLabel: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginBottom: SIZES.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: SIZES.radiusSm,
    padding: SIZES.md,
    fontSize: SIZES.body,
    ...FONTS.regular,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: SIZES.radiusSm,
    padding: SIZES.md,
    fontSize: SIZES.body,
    ...FONTS.regular,
    height: 100,
  },
  submitButton: {
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusSm,
    alignItems: 'center',
    marginTop: SIZES.md,
  },
  submitButtonText: {
    fontSize: SIZES.h6,
    ...FONTS.bold,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1.5,
    gap: SIZES.xs,
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // New parcel card styles
  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 10,
  },
  statusStripText: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  parcelCardContent: {
    padding: 16,
  },
  parcelIdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  weightText: {
    fontSize: 14,
    fontWeight: '700',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  routePoint: {
    alignItems: 'center',
    flex: 1,
  },
  routeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  routeLineWrapper: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  routeLine: {
    height: 2,
    flex: 1,
  },
  routeIcon: {
    marginHorizontal: 8,
  },
  routeCity: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  receiverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  receiverInfo: {
    flex: 1,
  },
  receiverName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  receiverLocation: {
    fontSize: 14,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  managePickupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
  },
  managePickupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  manageIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  managePickupTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  managePickupSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
});

