import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useUser } from '../context/UserContext';

export default function ReceiverDetailsScreen({ route, navigation }) {
  const { senderData } = route.params;
  const { user } = useUser();

  // Receiver Details
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  
  // Delivery Address in Ghana
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryRegion, setDeliveryRegion] = useState('');
  
  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('card');

  const handleBookParcel = async () => {
    // Validate receiver details
    if (!receiverName || !receiverPhone || !deliveryAddress || !deliveryCity || !deliveryRegion) {
      Alert.alert('Error', 'Please fill in all required receiver details');
      return;
    }

    // Combine sender and receiver data
    const bookingData = {
      ...senderData,
      receiver_name: receiverName,
      receiver_phone: receiverPhone,
      receiver_alternate_phone: alternatePhone,
      delivery_address: deliveryAddress,
      delivery_city: deliveryCity,
      delivery_region: deliveryRegion,
      payment_method: paymentMethod,
      user_id: user?.id
    };

    try {
      // Backend URL using computer's IP address
      const response = await fetch('http://192.168.0.138:4000/api/shipments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success!',
          `Parcel booked successfully!\nTracking Number: ${data.tracking_number}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Orders')
            }
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to book parcel');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Unable to connect to server. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Receiver Details</Text>
      <Text style={styles.subtitle}>Who will receive this parcel in Ghana?</Text>

      {/* Receiver Information */}
      <Text style={styles.sectionTitle}>Receiver Information</Text>
      <TextInput
        style={styles.input}
        placeholder="Receiver Full Name *"
        value={receiverName}
        onChangeText={setReceiverName}
      />
      <TextInput
        style={styles.input}
        placeholder="Receiver Phone Number *"
        value={receiverPhone}
        onChangeText={setReceiverPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Alternate Phone Number"
        value={alternatePhone}
        onChangeText={setAlternatePhone}
        keyboardType="phone-pad"
      />

      {/* Delivery Address in Ghana */}
      <Text style={styles.sectionTitle}>Delivery Address (Ghana)</Text>
      <TextInput
        style={styles.input}
        placeholder="Street Address / House Number *"
        value={deliveryAddress}
        onChangeText={setDeliveryAddress}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="City / Town *"
        value={deliveryCity}
        onChangeText={setDeliveryCity}
      />
      <TextInput
        style={styles.input}
        placeholder="Region *"
        value={deliveryRegion}
        onChangeText={setDeliveryRegion}
      />

      {/* Payment Method */}
      <Text style={styles.sectionTitle}>Payment Method</Text>
      <View style={styles.paymentContainer}>
        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionSelected]}
          onPress={() => setPaymentMethod('card')}
        >
          <Text style={[styles.paymentText, paymentMethod === 'card' && styles.paymentTextSelected]}>
            💳 Card Payment
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionSelected]}
          onPress={() => setPaymentMethod('cash')}
        >
          <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.paymentTextSelected]}>
            💵 Cash on Pickup
          </Text>
        </TouchableOpacity>
      </View>

      {/* Estimated Cost */}
      <View style={styles.costContainer}>
        <Text style={styles.costLabel}>Estimated Cost:</Text>
        <Text style={styles.costValue}>
          £{(5 + (senderData.weight_kg * 2)).toFixed(2)}
        </Text>
      </View>
      <Text style={styles.costNote}>
        Base fee: £5.00 + £2.00 per kg
      </Text>

      {/* Book Button */}
      <TouchableOpacity style={styles.bookButton} onPress={handleBookParcel}>
        <Text style={styles.bookButtonText}>Book Parcel Pickup</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  paymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentOption: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  paymentOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  paymentText: {
    fontSize: 16,
    color: '#666',
  },
  paymentTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  costContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  costLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  costValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  costNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    marginBottom: 20,
    textAlign: 'center',
  },
  bookButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
