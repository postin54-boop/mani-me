import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';

export default function BookingScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  
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
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={styles.header}
        >
          <View style={[styles.headerIconContainer, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="cube" size={32} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.accent }]}>Book Parcel Pickup</Text>
          <Text style={[styles.subtitle, { color: colors.accent + 'CC' }]}>Send parcels from UK to Ghana</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          {/* Sender Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color={colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sender Information</Text>
            </View>
            
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Full Name *"
                placeholderTextColor={colors.textSecondary}
                value={senderName}
                onChangeText={setSenderName}
              />
            </View>
            
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="call-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Phone Number *"
                placeholderTextColor={colors.textSecondary}
                value={senderPhone}
                onChangeText={setSenderPhone}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email Address *"
                placeholderTextColor={colors.textSecondary}
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
              <Ionicons name="location" size={20} color={colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Pickup Address (UK)</Text>
            </View>
            
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="home-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text }]}
                placeholder="Street Address *"
                placeholderTextColor={colors.textSecondary}
                value={pickupAddress}
                onChangeText={setPickupAddress}
                multiline
                numberOfLines={2}
              />
            </View>
            
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="business-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="City *"
                placeholderTextColor={colors.textSecondary}
                value={pickupCity}
                onChangeText={setPickupCity}
              />
            </View>
            
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Postcode *"
                placeholderTextColor={colors.textSecondary}
                value={pickupPostcode}
                onChangeText={setPickupPostcode}
                autoCapitalize="characters"
              />
            </View>
            
            {/* Pickup Date & Time */}
            <View style={styles.row}>
              <View style={[styles.inputWrapper, styles.halfInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Date (DD/MM/YYYY)"
                  placeholderTextColor={colors.textSecondary}
                  value={pickupDate}
                  onChangeText={setPickupDate}
                />
              </View>
              <View style={[styles.inputWrapper, styles.halfInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="time-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Time"
                  placeholderTextColor={colors.textSecondary}
                  value={pickupTime}
                  onChangeText={setPickupTime}
                />
              </View>
            </View>
          </View>

          {/* Parcel Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cube" size={20} color={colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Parcel Details</Text>
            </View>
            
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="scale-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Weight (kg) *"
                placeholderTextColor={colors.textSecondary}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="resize-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Dimensions (LxWxH in cm)"
                placeholderTextColor={colors.textSecondary}
                value={dimensions}
                onChangeText={setDimensions}
              />
            </View>
            
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="document-text-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text }]}
                placeholder="Parcel Description"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="cash-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Declared Value (£)"
                placeholderTextColor={colors.textSecondary}
                value={value}
                onChangeText={setValue}
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text }]}
                placeholder="Special Instructions"
                placeholderTextColor={colors.textSecondary}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: colors.primary }]} 
            onPress={handleContinue} 
            activeOpacity={0.8}
          >
            <Text style={[styles.continueButtonText, { color: colors.accent }]}>Continue to Receiver Details</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.body,
  },
  formContainer: {
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
    marginLeft: SIZES.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
    ...SHADOWS.medium,
  },
  continueButtonText: {
    fontSize: SIZES.h6,
    ...FONTS.semiBold,
    marginRight: SIZES.sm,
  },
});
