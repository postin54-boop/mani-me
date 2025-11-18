import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';

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
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.header}
        >
          <View style={styles.headerIconContainer}>
            <Ionicons name="cube" size={32} color={COLORS.surface} />
          </View>
          <Text style={styles.title}>Book Parcel Pickup</Text>
          <Text style={styles.subtitle}>Send parcels from UK to Ghana</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          {/* Sender Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Sender Information</Text>
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor={COLORS.textLight}
                value={senderName}
                onChangeText={setSenderName}
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                placeholderTextColor={COLORS.textLight}
                value={senderPhone}
                onChangeText={setSenderPhone}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address *"
                placeholderTextColor={COLORS.textLight}
                value={senderEmail}
                onChangeText={setSenderEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Pickup Address */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Pickup Address (UK)</Text>
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="home-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Street Address *"
                placeholderTextColor={COLORS.textLight}
                value={pickupAddress}
                onChangeText={setPickupAddress}
                multiline
                numberOfLines={2}
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="City *"
                placeholderTextColor={COLORS.textLight}
                value={pickupCity}
                onChangeText={setPickupCity}
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Postcode *"
                placeholderTextColor={COLORS.textLight}
                value={pickupPostcode}
                onChangeText={setPickupPostcode}
                autoCapitalize="characters"
              />
            </View>
            
            {/* Pickup Date & Time */}
            <View style={styles.row}>
              <View style={[styles.inputWrapper, styles.halfInput]}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Date (DD/MM/YYYY)"
                  placeholderTextColor={COLORS.textLight}
                  value={pickupDate}
                  onChangeText={setPickupDate}
                />
              </View>
              <View style={[styles.inputWrapper, styles.halfInput]}>
                <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Time"
                  placeholderTextColor={COLORS.textLight}
                  value={pickupTime}
                  onChangeText={setPickupTime}
                />
              </View>
            </View>
          </View>

          {/* Parcel Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cube" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Parcel Details</Text>
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="scale-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Weight (kg) *"
                placeholderTextColor={COLORS.textLight}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="resize-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Dimensions (LxWxH in cm)"
                placeholderTextColor={COLORS.textLight}
                value={dimensions}
                onChangeText={setDimensions}
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Parcel Description"
                placeholderTextColor={COLORS.textLight}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="cash-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Declared Value (£)"
                placeholderTextColor={COLORS.textLight}
                value={value}
                onChangeText={setValue}
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Special Instructions"
                placeholderTextColor={COLORS.textLight}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueButtonText}>Continue to Receiver Details</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.surface} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: SIZES.lg,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    color: COLORS.surface,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.lg,
    marginTop: -20,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.h5,
    ...FONTS.semiBold,
    color: COLORS.text,
    marginLeft: SIZES.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
  },
  inputIcon: {
    marginRight: SIZES.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SIZES.md,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  textArea: {
    paddingTop: SIZES.md,
    minHeight: 60,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  continueButton: {
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
    ...SHADOWS.medium,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
  },
  continueButtonText: {
    color: COLORS.surface,
    fontSize: SIZES.h6,
    ...FONTS.semiBold,
    marginRight: SIZES.sm,
  },
});
