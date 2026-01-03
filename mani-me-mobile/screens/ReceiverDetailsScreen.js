import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header with Back Button */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Receiver Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Receiver Details</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Who will receive this parcel in Ghana?</Text>

        {/* Receiver Information */}
        <View style={{ paddingHorizontal: 20 }}>
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
          style={[
            styles.paymentOption, 
            { 
              borderColor: paymentMethod === 'card' ? colors.primary : colors.border, 
              backgroundColor: paymentMethod === 'card' ? colors.primary + '10' : colors.surface,
              borderWidth: 2,
            }
          ]}
          onPress={() => setPaymentMethod('card')}
          activeOpacity={0.7}
        >
          <View style={[styles.paymentIconWrapper, { backgroundColor: paymentMethod === 'card' ? colors.primary : colors.border }]}>
            <Ionicons name="card" size={24} color={paymentMethod === 'card' ? colors.accent : colors.textSecondary} />
          </View>
          <Text style={[styles.paymentTitle, { color: paymentMethod === 'card' ? colors.primary : colors.text }]}>
            Card Payment
          </Text>
          <Text style={[styles.paymentDescription, { color: colors.textSecondary }]}>
            Pay now with card
          </Text>
          {paymentMethod === 'card' && (
            <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={16} color={colors.accent} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentOption, 
            { 
              borderColor: paymentMethod === 'cash' ? colors.secondary : colors.border, 
              backgroundColor: paymentMethod === 'cash' ? colors.secondary + '10' : colors.surface,
              borderWidth: 2,
            }
          ]}
          onPress={() => setPaymentMethod('cash')}
          activeOpacity={0.7}
        >
          <View style={[styles.paymentIconWrapper, { backgroundColor: paymentMethod === 'cash' ? colors.secondary : colors.border }]}>
            <Ionicons name="cash" size={24} color={paymentMethod === 'cash' ? colors.accent : colors.textSecondary} />
          </View>
          <Text style={[styles.paymentTitle, { color: paymentMethod === 'cash' ? colors.secondary : colors.text }]}>
            Cash on Pickup
          </Text>
          <Text style={[styles.paymentDescription, { color: colors.textSecondary }]}>
            Pay when picked up
          </Text>
          {paymentMethod === 'cash' && (
            <View style={[styles.selectedBadge, { backgroundColor: colors.secondary }]}>
              <Ionicons name="checkmark" size={16} color={colors.accent} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Estimated Cost */}
      <View style={[styles.costContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.costLabel, { color: colors.text }]}>Estimated Total:</Text>
        <Text style={[styles.costValue, { color: colors.secondary }]}>
          £{senderData?.total_estimated_price || 0}
        </Text>
      </View>
      {senderData?.booking_mode === 'box' && senderData?.boxes?.length > 0 && (
        <Text style={[styles.costNote, { color: colors.textSecondary }]}>
          {senderData.boxes.reduce((sum, b) => sum + b.quantity, 0)} box(es) selected
        </Text>
      )}
      {senderData?.booking_mode === 'item' && senderData?.items?.length > 0 && (
        <Text style={[styles.costNote, { color: colors.textSecondary }]}>
          {senderData.items.reduce((sum, i) => sum + i.quantity, 0)} item(s) selected
        </Text>
      )}

      {/* Book Button */}
      <TouchableOpacity style={[styles.bookButton, { backgroundColor: colors.primary }]} onPress={handleBookParcel}>
        <Text style={[styles.bookButtonText, { color: colors.accent }]}>Book Parcel Pickup</Text>
      </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 25,
    paddingHorizontal: 20,
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
    gap: 12,
    marginBottom: 20,
  },
  paymentOption: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  paymentIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 13,
    textAlign: 'center',
  },
  paymentText: {
    fontSize: 16,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
