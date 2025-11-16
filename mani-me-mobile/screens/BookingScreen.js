import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

export default function BookingScreen({ navigation }) {
  // Sender Details
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  
  // Pickup Address
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupPostcode, setPickupPostcode] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  
  // Parcel Details
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleContinue = () => {
    // Validate sender details
    if (!senderName || !senderPhone || !senderEmail || !pickupAddress || 
        !pickupCity || !pickupPostcode || !weight) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Navigate to Receiver Details screen with sender data
    navigation.navigate('ReceiverDetails', {
      senderData: {
        sender_name: senderName,
        sender_phone: senderPhone,
        sender_email: senderEmail,
        pickup_address: pickupAddress,
        pickup_city: pickupCity,
        pickup_postcode: pickupPostcode,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        weight_kg: parseFloat(weight),
        dimensions,
        parcel_description: description,
        parcel_value: value ? parseFloat(value) : null,
        special_instructions: specialInstructions
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Book Parcel Pickup</Text>
      <Text style={styles.subtitle}>Send parcels from UK to Ghana</Text>

      {/* Sender Information */}
      <Text style={styles.sectionTitle}>Sender Information</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        value={senderName}
        onChangeText={setSenderName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number *"
        value={senderPhone}
        onChangeText={setSenderPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Email Address *"
        value={senderEmail}
        onChangeText={setSenderEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Pickup Address */}
      <Text style={styles.sectionTitle}>Pickup Address (UK)</Text>
      <TextInput
        style={styles.input}
        placeholder="Street Address *"
        value={pickupAddress}
        onChangeText={setPickupAddress}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="City *"
        value={pickupCity}
        onChangeText={setPickupCity}
      />
      <TextInput
        style={styles.input}
        placeholder="Postcode *"
        value={pickupPostcode}
        onChangeText={setPickupPostcode}
        autoCapitalize="characters"
      />
      
      {/* Pickup Date & Time */}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Pickup Date (DD/MM/YYYY)"
          value={pickupDate}
          onChangeText={setPickupDate}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Preferred Time"
          value={pickupTime}
          onChangeText={setPickupTime}
        />
      </View>

      {/* Parcel Details */}
      <Text style={styles.sectionTitle}>Parcel Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Weight (kg) *"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Dimensions (LxWxH in cm)"
        value={dimensions}
        onChangeText={setDimensions}
      />
      <TextInput
        style={styles.input}
        placeholder="Parcel Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Declared Value (£)"
        value={value}
        onChangeText={setValue}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Special Instructions"
        value={specialInstructions}
        onChangeText={setSpecialInstructions}
        multiline
      />

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue to Receiver Details</Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
