import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { useThemeColors } from '../constants/theme';

export default function TrackingScreen({ route, navigation }) {
  const { parcel } = route.params;
  const [shipmentData, setShipmentData] = useState(parcel);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, isDark } = useThemeColors();

  const fetchLatestData = async () => {
    try {
      const response = await fetch(`http://192.168.0.138:4000/api/shipments/track/${parcel.tracking_number}`);
      const data = await response.json();
      
      if (response.ok) {
        setShipmentData(data.shipment);
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLatestData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLatestData();
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLatestData();
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

  const trackingSteps = [
    { key: 'booked', label: 'Booked', icon: '📝' },
    { key: 'picked_up', label: 'Picked Up', icon: '📦' },
    { key: 'in_transit', label: 'In Transit', icon: '✈️' },
    { key: 'customs', label: 'Customs Clearance', icon: '🛃' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '✅' },
  ];

  const statusOrder = ['booked', 'picked_up', 'in_transit', 'customs', 'out_for_delivery', 'delivered'];
  const currentStatusIndex = statusOrder.indexOf(shipmentData.status);

  const isStepCompleted = (index) => index <= currentStatusIndex;
  const isStepCurrent = (index) => index === currentStatusIndex;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: getStatusColor(shipmentData.status) }]}>
        <Text style={[styles.headerTitle, { color: colors.accent }]}>Tracking Details</Text>
        <Text style={[styles.trackingNumber, { color: colors.accent }]}>{shipmentData.tracking_number}</Text>
      </View>

      {/* Current Status */}
      <View style={[styles.currentStatusCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.currentStatusLabel, { color: colors.textSecondary }]}>Current Status</Text>
        <Text style={[styles.currentStatus, { color: getStatusColor(shipmentData.status) }]}>
          {trackingSteps.find(s => s.key === shipmentData.status)?.label || shipmentData.status}
        </Text>
        {shipmentData.status === 'delivered' && shipmentData.delivered_at && (
          <Text style={[styles.deliveredDate, { color: colors.textSecondary }]}>
            Delivered on {new Date(shipmentData.delivered_at).toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Timeline */}
      <View style={[styles.timelineContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tracking Timeline</Text>
        {trackingSteps.map((step, index) => {
          const isCompleted = isStepCompleted(index);
          const isCurrent = isStepCurrent(index);
          const timestamp = shipmentData[`${step.key}_at`];

          return (
            <View key={step.key} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  isCompleted && styles.timelineDotCompleted,
                  isCurrent && styles.timelineDotCurrent,
                ]}>
                  {isCompleted && <Text style={styles.timelineDotText}>{step.icon}</Text>}
                </View>
                {index < trackingSteps.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    isCompleted && styles.timelineLineCompleted,
                  ]} />
                )}
              </View>
              <View style={styles.timelineRight}>
                <Text style={[
                  styles.stepLabel,
                  { color: isCompleted ? colors.text : colors.textSecondary },
                  isCurrent && { color: colors.secondary, fontWeight: 'bold' },
                ]}>
                  {step.label}
                </Text>
                {timestamp && (
                  <Text style={[styles.stepTimestamp, { color: colors.textSecondary }]}>
                    {new Date(timestamp).toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Parcel Details */}
      <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Parcel Information</Text>
        
        <View style={styles.detailSection}>
          <Text style={[styles.detailSectionTitle, { color: colors.text }]}>📤 Sender (UK)</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Name:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{shipmentData.sender_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Phone:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{shipmentData.sender_phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pickup:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {shipmentData.pickup_city}, {shipmentData.pickup_postcode}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={[styles.detailSectionTitle, { color: colors.text }]}>📥 Receiver (Ghana)</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Name:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{shipmentData.receiver_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Phone:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{shipmentData.receiver_phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Delivery:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {shipmentData.delivery_city}, {shipmentData.delivery_region}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={[styles.detailSectionTitle, { color: colors.text }]}>📦 Parcel Details</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Weight:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{shipmentData.weight_kg} kg</Text>
          </View>
          {shipmentData.dimensions && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Dimensions:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{shipmentData.dimensions}</Text>
            </View>
          )}
          {shipmentData.parcel_description && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Description:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{shipmentData.parcel_description}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payment:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {shipmentData.payment_method === 'card' ? '💳 Card' : '💵 Cash'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Cost:</Text>
            <Text style={[styles.detailValue, { color: colors.secondary }]}>
              £{parseFloat(shipmentData.total_cost).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.backButtonText, { color: colors.secondary }]}>← Back to Parcels</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 25,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  trackingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  currentStatusCard: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentStatusLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  currentStatus: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  deliveredDate: {
    fontSize: 14,
    marginTop: 8,
  },
  timelineContainer: {
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 15,
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  timelineDotCompleted: {
    backgroundColor: '#fff',
    borderColor: '#4CAF50',
  },
  timelineDotCurrent: {
    borderColor: '#83C5FA',
    borderWidth: 3,
  },
  timelineDotText: {
    fontSize: 18,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  timelineRight: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 20,
  },
  stepLabel: {
    fontSize: 16,
    marginBottom: 3,
  },
  stepTimestamp: {
    fontSize: 12,
  },
  detailsCard: {
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  backButton: {
    margin: 15,
    marginTop: 0,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
