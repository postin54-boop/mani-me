// screens/WarehouseReturnScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCashTracking } from '../context/CashTrackingContext';

export default function WarehouseReturnScreen({ navigation }) {
  const { totalCash, cashCount } = useCashTracking();
  const [checkingIn, setCheckingIn] = useState(false);

  const handleWarehouseCheckIn = () => {
    Alert.alert(
      'Warehouse Check-In',
      `Ready to check in at warehouse?\n\n• Parcels collected today\n• Cash to submit: £${totalCash.toFixed(2)}\n• Pickups: ${cashCount}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: () => {
            setCheckingIn(true);
            // TODO: Call API to check in at warehouse
            setTimeout(() => {
              setCheckingIn(false);
              Alert.alert('Success', 'Checked in at warehouse successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            }, 1500);
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
          onPress: () => {
            // TODO: Call API to end shift
            Alert.alert('Success', 'Shift ended successfully! See you tomorrow.', [
              { text: 'OK', onPress: () => navigation.navigate('Main') }
            ]);
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

        {/* Checklist Card */}
        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>End of Day Checklist</Text>
          
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.checkText}>All pickups completed</Text>
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

          <View style={styles.checkItem}>
            <Ionicons name="cube-outline" size={24} color="#83C5FA" />
            <Text style={styles.checkText}>Parcels ready for warehouse</Text>
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
          style={styles.primaryButton}
          onPress={handleWarehouseCheckIn}
          disabled={checkingIn}
        >
          <Ionicons name="location" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>
            {checkingIn ? 'Checking In...' : 'Check In at Warehouse'}
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
        >
          <Ionicons name="moon" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.endDayButtonText}>End Day & Clock Out</Text>
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
