// screens/WarehouseReturnScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCashTracking } from '../context/CashTrackingContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import logger from '../utils/logger';

export default function WarehouseReturnScreen({ navigation }) {
  const { totalCash, cashCount } = useCashTracking();
  const { user } = useAuth();
  const [checkingIn, setCheckingIn] = useState(false);
  const [endingDay, setEndingDay] = useState(false);
  const [collectedParcels, setCollectedParcels] = useState([]);
  const [loadingParcels, setLoadingParcels] = useState(true);
  const [handedOver, setHandedOver] = useState(false);

  const getDriverId = () => user?._id || user?.id || user?.user_id;

  // Fetch all parcels the driver has collected but not yet handed to warehouse
  useEffect(() => {
    const fetchCollectedParcels = async () => {
      const driverId = getDriverId();
      if (!driverId) { setLoadingParcels(false); return; }
      try {
        const res = await apiClient.get(`/drivers/${driverId}/assignments?type=pickup`);
        const shipments = res.data?.data?.shipments || res.data?.shipments || res.data || [];
        const collected = shipments.filter(s => {
          const st = s.shipment_status || s.status || '';
          return ['picked_up', 'parcel_collected'].includes(st);
        });
        setCollectedParcels(collected);
      } catch (err) {
        logger.warn('Could not fetch collected parcels', err);
      } finally {
        setLoadingParcels(false);
      }
    };
    fetchCollectedParcels();
  }, []);

  const handleWarehouseCheckIn = () => {
    const parcelCount = collectedParcels.length;
    Alert.alert(
      'Confirm Parcel Handover',
      `You are handing over ${parcelCount} parcel${parcelCount !== 1 ? 's' : ''} to the warehouse.\n\nCash to submit: £${totalCash.toFixed(2)}\n\nThis will mark all collected parcels as received at the UK warehouse.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Handover',
          onPress: async () => {
            const driverId = getDriverId();
            if (!driverId) {
              Alert.alert('Error', 'Driver profile not available. Please log in again.');
              return;
            }
            setCheckingIn(true);
            try {
              // Mark each collected parcel as at_uk_warehouse
              const results = await Promise.allSettled(
                collectedParcels.map(parcel =>
                  apiClient.put(`/shipments/${parcel._id || parcel.id}/status`, {
                    status: 'at_uk_warehouse',
                  })
                )
              );
              const succeeded = results.filter(r => r.status === 'fulfilled').length;
              const failed = results.length - succeeded;

              setHandedOver(true);
              let msg = `${succeeded} parcel${succeeded !== 1 ? 's' : ''} marked as received at warehouse.`;
              if (failed > 0) msg += `\n${failed} could not be updated — please notify admin.`;
              Alert.alert('Handover Complete', msg, [
                { text: 'OK' }
              ]);
            } catch (error) {
              logger.error('Warehouse handover failed', error);
              Alert.alert('Error', 'Failed to complete handover. Please try again or notify admin.');
            } finally {
              setCheckingIn(false);
            }
          }
        }
      ]
    );
  };

  const handleEndDay = () => {
    if (cashCount > 0) {
      Alert.alert(
        'Cash Not Submitted',
        'You have unsubmitted cash. Please submit cash reconciliation before ending your day.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Go to Cash Reconciliation', 
            onPress: () => navigation.navigate('CashReconciliation') 
          }
        ]
      );
      return;
    }

    Alert.alert(
      'End Day',
      'Are you sure you want to end your shift?\n\nThis will:\n• Mark you as off-duty\n• Complete today\'s shift log',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Day',
          style: 'destructive',
          onPress: async () => {
            const driverId = getDriverId();
            if (!driverId) {
              Alert.alert('Error', 'Driver profile not available. Please log in again.');
              return;
            }

            setEndingDay(true);
            try {
              const now = new Date();
              let hoursWorked = 0.1;

              try {
                const shiftResponse = await apiClient.get(`/drivers/shifts/${driverId}`);
                const activeShift = (shiftResponse.data?.shifts || []).find((shift) => shift.status === 'active');

                if (activeShift?.clock_in_time) {
                  const startedAt = new Date(activeShift.clock_in_time);
                  const elapsedHours = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
                  hoursWorked = Math.max(0.1, elapsedHours);
                }
              } catch (shiftError) {
                logger.warn('Could not fetch active shift before clock-out', shiftError);
              }

              await apiClient.post('/drivers/clock-out', {
                driver_id: driverId,
                clock_out_time: now.toISOString(),
                hours_worked: Number(hoursWorked.toFixed(2)),
              });

              Alert.alert('Success', 'Shift ended successfully! See you tomorrow.', [
                { text: 'OK', onPress: () => navigation.navigate('Main') }
              ]);
            } catch (error) {
              if (error.response?.status === 404) {
                Alert.alert('Shift Closed', 'No active shift found. You are already clocked out.', [
                  { text: 'OK', onPress: () => navigation.navigate('Main') }
                ]);
              } else {
                logger.error('Clock-out failed', error);
                const message = error.response?.data?.error || 'Failed to end shift. Please try again.';
                Alert.alert('Error', message);
              }
            } finally {
              setEndingDay(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Ionicons name="business" size={80} color="#83C5FA" style={{ alignSelf: 'center', marginBottom: 16 }} />
        <Text style={styles.title}>Return to Warehouse</Text>
        <Text style={styles.subtitle}>Complete your shift and check in parcels</Text>

        {/* Parcel Handover Summary */}
        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>Parcels to Hand Over</Text>
          {loadingParcels ? (
            <ActivityIndicator size="small" color="#83C5FA" style={{ marginVertical: 12 }} />
          ) : collectedParcels.length === 0 ? (
            <View style={styles.checkItem}>
              <Ionicons name={handedOver ? 'checkmark-circle' : 'cube-outline'} size={24} color={handedOver ? '#10B981' : '#83C5FA'} />
              <Text style={styles.checkText}>
                {handedOver ? 'All parcels handed over ✓' : 'No collected parcels found'}
              </Text>
            </View>
          ) : (
            collectedParcels.map((p, i) => (
              <View key={p._id || p.id || i} style={styles.checkItem}>
                <Ionicons name="cube-outline" size={20} color="#83C5FA" />
                <Text style={[styles.checkText, { flex: 1 }]}>
                  {p.parcel_id_short || p.tracking_number || p.id}
                  {p.sender_name ? ` — ${p.sender_name}` : ''}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* End of Day Checklist Card */}
        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>End of Day Checklist</Text>
          
          <View style={styles.checkItem}>
            <Ionicons name={handedOver || collectedParcels.length === 0 ? 'checkmark-circle' : 'alert-circle'} size={24} color={handedOver || collectedParcels.length === 0 ? '#10B981' : '#F59E0B'} />
            <Text style={styles.checkText}>Parcels handed to warehouse</Text>
          </View>

          <View style={styles.checkItem}>
            <Ionicons 
              name={cashCount === 0 ? "checkmark-circle" : "alert-circle"} 
              size={24} 
              color={cashCount === 0 ? "#10B981" : "#F59E0B"} 
            />
            <Text style={styles.checkText}>
              Cash submitted {cashCount > 0 && `(${cashCount} pending)`}
            </Text>
          </View>
        </View>

        {/* Cash Summary */}
        {cashCount > 0 && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.warningTitle}>Cash Pending</Text>
              <Text style={styles.warningText}>
                You have £{totalCash.toFixed(2)} from {cashCount} pickups to submit
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity 
          style={[styles.primaryButton, (handedOver && collectedParcels.length > 0) && { backgroundColor: '#10B981' }]}
          onPress={handedOver ? undefined : handleWarehouseCheckIn}
          disabled={checkingIn || endingDay}
        >
          <Ionicons name={handedOver ? 'checkmark-circle' : 'business'} size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>
            {checkingIn ? 'Updating Parcels...' : handedOver ? 'Handover Complete ✓' : `Hand Over ${collectedParcels.length} Parcel${collectedParcels.length !== 1 ? 's' : ''} to Warehouse`}
          </Text>
        </TouchableOpacity>

        {cashCount > 0 && (
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('CashReconciliation')}
          >
            <Ionicons name="cash" size={24} color="#10B981" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryButtonText}>Submit Cash Reconciliation</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.endDayButton, cashCount > 0 && { opacity: 0.5 }]}
          onPress={handleEndDay}
          disabled={endingDay}
        >
          <Ionicons name="moon" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.endDayButtonText}>{endingDay ? 'Ending Shift...' : 'End Day & Clock Out'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071528',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#84C3EA',
    textAlign: 'center',
    marginBottom: 32,
  },
  checklistCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1A33',
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkText: {
    fontSize: 16,
    color: '#0B1A33',
    marginLeft: 12,
    flex: 1,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#83C5FA',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#0B1A33',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#10B98110',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  secondaryButtonText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '700',
  },
  endDayButton: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 24,
  },
  endDayButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#84C3EA',
    fontSize: 16,
    fontWeight: '600',
  },
});
