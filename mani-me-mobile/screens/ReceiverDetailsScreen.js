import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, StatusBar } from 'react-native';
import { useUser } from '../context/UserContext';
import { useThemeColors } from '../constants/theme';

export default function ReceiverDetailsScreen({ route, navigation }) {
  const { senderData } = route.params;
  const { user } = useUser();
  const { colors, isDark } = useThemeColors();

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

  const handleBookParcel = () => {
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
      user_id: user?.id
    };

    // Navigate to payment screen
    navigation.navigate('Payment', { bookingData });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Text style={[styles.title, { color: colors.text }]}>Receiver Details</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Who will receive this parcel in Ghana?</Text>

      {/* Receiver Information */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Receiver Information</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder="Receiver Full Name *"
        placeholderTextColor={colors.textSecondary}
        value={receiverName}
        onChangeText={setReceiverName}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder="Receiver Phone Number *"
        placeholderTextColor={colors.textSecondary}
        value={receiverPhone}
        onChangeText={setReceiverPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder="Alternate Phone Number"
        placeholderTextColor={colors.textSecondary}
        value={alternatePhone}
        onChangeText={setAlternatePhone}
        keyboardType="phone-pad"
      />

      {/* Delivery Address in Ghana */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Address (Ghana)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder="Street Address / House Number *"
        placeholderTextColor={colors.textSecondary}
        value={deliveryAddress}
        onChangeText={setDeliveryAddress}
        multiline
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder="City / Town *"
        placeholderTextColor={colors.textSecondary}
        value={deliveryCity}
        onChangeText={setDeliveryCity}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder="Region *"
        placeholderTextColor={colors.textSecondary}
        value={deliveryRegion}
        onChangeText={setDeliveryRegion}
      />

      {/* Payment Method */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
      <View style={styles.paymentContainer}>
        <TouchableOpacity
          style={[styles.paymentOption, { borderColor: paymentMethod === 'card' ? colors.secondary : colors.border, backgroundColor: paymentMethod === 'card' ? colors.surface : 'transparent' }]}
          onPress={() => setPaymentMethod('card')}
        >
          <Text style={[styles.paymentText, { color: paymentMethod === 'card' ? colors.secondary : colors.textSecondary }]}>
            💳 Card Payment
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.paymentOption, { borderColor: paymentMethod === 'cash' ? colors.secondary : colors.border, backgroundColor: paymentMethod === 'cash' ? colors.surface : 'transparent' }]}
          onPress={() => setPaymentMethod('cash')}
        >
          <Text style={[styles.paymentText, { color: paymentMethod === 'cash' ? colors.secondary : colors.textSecondary }]}>
            💵 Cash on Pickup
          </Text>
        </TouchableOpacity>
      </View>

      {/* Estimated Cost */}
      <View style={[styles.costContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.costLabel, { color: colors.text }]}>Estimated Cost:</Text>
        <Text style={[styles.costValue, { color: colors.secondary }]}>
          £{(5 + (senderData.weight_kg * 2)).toFixed(2)}
        </Text>
      </View>
      <Text style={[styles.costNote, { color: colors.textSecondary }]}>
        Base fee: £5.00 + £2.00 per kg
      </Text>

      {/* Book Button */}
      <TouchableOpacity style={[styles.bookButton, { backgroundColor: colors.primary }]} onPress={handleBookParcel}>
        <Text style={[styles.bookButtonText, { color: colors.accent }]}>Book Parcel Pickup</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.backButtonText, { color: colors.secondary }]}>← Back</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  paymentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentOption: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 16,
  },
  costContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  costLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  costValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  costNote: {
    fontSize: 14,
    marginTop: 5,
    marginBottom: 20,
    textAlign: 'center',
  },
  bookButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 16,
  },
});
