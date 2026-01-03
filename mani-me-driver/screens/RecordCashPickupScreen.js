// screens/RecordCashPickupScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCashTracking } from '../context/CashTrackingContext';

export default function RecordCashPickupScreen({ navigation, route }) {
  const { parcelId } = route.params || {};
  const { addCashPickup } = useCashTracking();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    const result = await addCashPickup(amount, parcelId);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Success',
        `Cash pickup recorded: £${parseFloat(amount).toFixed(2)}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to record cash pickup');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Ionicons name="cash" size={64} color="#10B981" style={{ alignSelf: 'center', marginBottom: 16 }} />
        <Text style={styles.title}>Record Cash Pickup</Text>
        <Text style={styles.subtitle}>Enter the amount collected from customer</Text>
        
        {parcelId && (
          <View style={styles.parcelInfo}>
            <Text style={styles.parcelLabel}>Parcel ID:</Text>
            <Text style={styles.parcelId}>{parcelId}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.currencySymbol}>£</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            editable={!loading}
            autoFocus
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, (!amount || loading) && styles.submitButtonDisabled]} 
          onPress={handleSubmit} 
          disabled={!amount || loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Recording...' : 'Record Cash Pickup'}
          </Text>
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
    alignItems: 'center',
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
  parcelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(131, 197, 250, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(131, 197, 250, 0.3)',
  },
  parcelLabel: {
    fontSize: 14,
    color: '#84C3EA',
    marginRight: 8,
  },
  parcelId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#83C5FA',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
    width: '100%',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#0B1A33',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#84C3EA',
    fontSize: 16,
    fontWeight: '600',
  },
});
