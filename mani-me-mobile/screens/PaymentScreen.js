import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StatusBar, TextInput, Platform } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useThemeColors, SIZES, FONTS, SHADOWS } from '../constants/theme';
import { API_BASE_URL } from '../utils/config';

export default function PaymentScreen({ route, navigation }) {
  const { bookingData } = route.params;
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const { confirmPayment } = useStripe();
  // Apple Pay not available in Expo Go - disabled for now
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const { colors, isDark } = useThemeColors();

  // Apple Pay is not supported in Expo Go development builds
  // To enable Apple Pay, you need a custom dev client or production build

  const calculateTotal = () => {
    let total = bookingData?.total_estimated_price || 0;
    if (appliedPromo) {
      if (appliedPromo.type === 'percentage') {
        total = total - (total * appliedPromo.value / 100);
      } else {
        total = total - appliedPromo.value;
      }
    }
    return Math.max(total, 0);
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    setPromoLoading(true);
    try {
      // Validate promo code with backend
      const response = await fetch(`${API_BASE_URL}/api/payments/validate-promo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promoCode.toUpperCase(),
          orderValue: bookingData?.total_estimated_price || 0,
        }),
      });

      let data;
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      } else {
        data = await response.json();
      }

      if (data.valid) {
        setAppliedPromo(data.promo);
        Alert.alert('Success', `Promo code applied! You save £${data.discount.toFixed(2)}`);
      } else {
        Alert.alert('Invalid Code', data.message || 'This promo code is not valid');
      }
    } catch (error) {
      logger.error('Promo validation error:', error);
      Alert.alert('Error', 'Could not validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const handlePayment = async () => {
    // Apple Pay is not available in Expo Go development builds
    // This function will only work in production builds with proper Apple Pay configuration
    Alert.alert(
      'Apple Pay Not Available',
      'Apple Pay is not available in development builds. Please use the "Pay with Cash" option below, or build the app for production to enable Apple Pay.',
      [{ text: 'OK' }]
    );
  };

  // Card payment - book now, charge later (after driver verifies parcel)
  const handlePayCard = async () => {
    setLoading(true);

    try {
      const requestBody = {
        ...bookingData,
        payment_method: 'card',
        payment_status: 'pending', // Will be charged after driver confirms
        payment_amount: calculateTotal(),
        promo_code: appliedPromo?.code || null,
        promo_discount: appliedPromo ? (appliedPromo.type === 'percentage' 
          ? (bookingData.total_estimated_price * appliedPromo.value / 100) 
          : appliedPromo.value) : 0,
      };
      
      logger.log('📦 Sending card booking request to:', `${API_BASE_URL}/api/shipments/create`);
      logger.log('📦 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/shipments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      logger.log('📦 Response status:', response.status);
      logger.log('📦 Response data:', JSON.stringify(data, null, 2));

      if (response.ok) {
        const receiptData = {
          trackingNumber: data.tracking_number,
          parcelId: data.parcel_id,
          parcelIdShort: data.parcel_id_short,
          bookingMode: bookingData?.booking_mode,
          boxes: bookingData?.boxes || [],
          items: bookingData?.items || [],
          senderName: bookingData?.sender_name,
          senderPhone: bookingData?.sender_phone,
          receiverName: bookingData?.receiver_name,
          receiverPhone: bookingData?.receiver_phone,
          pickupCity: bookingData?.pickup_city,
          deliveryCity: bookingData?.delivery_city,
          subtotal: bookingData?.total_estimated_price,
          discount: appliedPromo ? (appliedPromo.type === 'percentage' 
            ? (bookingData.total_estimated_price * appliedPromo.value / 100) 
            : appliedPromo.value) : 0,
          promoCode: appliedPromo?.code || null,
          total: calculateTotal(),
          paymentMethod: 'Card (Pay After Pickup)',
          paymentStatus: 'Pending',
          bookingDate: new Date().toISOString(),
        };

        navigation.navigate('PaymentConfirmation', {
          ...receiptData,
          amount: calculateTotal(),
        });
      } else {
        Alert.alert('Error', data.error || 'Booking failed');
      }
    } catch (error) {
      logger.error('Booking error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayCash = async () => {
    setLoading(true);

    try {
      const requestBody = {
        ...bookingData,
        payment_method: 'cash',
        payment_status: 'pending',
        payment_amount: calculateTotal(),
        promo_code: appliedPromo?.code || null,
        promo_discount: appliedPromo ? (appliedPromo.type === 'percentage' 
          ? (bookingData.total_estimated_price * appliedPromo.value / 100) 
          : appliedPromo.value) : 0,
      };
      
      // Debug logging
      logger.log('📦 Sending booking request to:', `${API_BASE_URL}/api/shipments/create`);
      logger.log('📦 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/shipments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      // Debug logging
      logger.log('📦 Response status:', response.status);
      logger.log('📦 Response data:', JSON.stringify(data, null, 2));

      if (response.ok) {
        // Generate receipt data
        const receiptData = {
          trackingNumber: data.tracking_number,
          parcelId: data.parcel_id,
          parcelIdShort: data.parcel_id_short,
          bookingMode: bookingData?.booking_mode,
          boxes: bookingData?.boxes || [],
          items: bookingData?.items || [],
          senderName: bookingData?.sender_name,
          senderPhone: bookingData?.sender_phone,
          receiverName: bookingData?.receiver_name,
          receiverPhone: bookingData?.receiver_phone,
          pickupCity: bookingData?.pickup_city,
          deliveryCity: bookingData?.delivery_city,
          subtotal: bookingData?.total_estimated_price,
          discount: appliedPromo ? (appliedPromo.type === 'percentage' 
            ? (bookingData.total_estimated_price * appliedPromo.value / 100) 
            : appliedPromo.value) : 0,
          promoCode: appliedPromo?.code || null,
          total: calculateTotal(),
          paymentMethod: 'Cash on Pickup',
          paymentStatus: 'Pending',
          bookingDate: new Date().toISOString(),
        };

        navigation.navigate('PaymentConfirmation', {
          ...receiptData,
          amount: calculateTotal(),
        });
      } else {
        Alert.alert('Error', data.error || 'Booking failed');
      }
    } catch (error) {
      logger.error('Booking error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>Payment</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose your payment method</Text>
        </View>
      </View>

      {/* Order Summary */}
      <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
        
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12, fontStyle: 'italic' }}>
          Estimated Total: Final price will be confirmed after pickup & packaging
        </Text>
        
        {/* Booking Mode */}
        <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Booking Type:</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {bookingData?.booking_mode === 'box' ? '📦 Box Packages' : '🧺 Individual Items'}
          </Text>
        </View>

        {/* Show boxes or items */}
        {bookingData?.booking_mode === 'box' && bookingData?.boxes?.length > 0 && (
          <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Boxes:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {bookingData.boxes.reduce((sum, b) => sum + b.quantity, 0)} box(es)
            </Text>
          </View>
        )}

        {bookingData?.booking_mode === 'item' && bookingData?.items?.length > 0 && (
          <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Items:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {bookingData.items.reduce((sum, i) => sum + i.quantity, 0)} item(s)
            </Text>
          </View>
        )}

        <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>From:</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{bookingData?.pickup_city || 'N/A'}, UK</Text>
        </View>
        <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>To:</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{bookingData?.delivery_city || 'N/A'}, Ghana</Text>
        </View>

        {/* Pricing breakdown */}
        <View style={[styles.summaryRow, { borderBottomColor: colors.border, marginTop: 8 }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Items & Packaging:</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            £{parseFloat(bookingData?.total_estimated_price || 0).toFixed(2)}
          </Text>
        </View>

        {appliedPromo && (
          <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>
              Discount ({appliedPromo.code}):
            </Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              -{appliedPromo.type === 'percentage' 
                ? `${appliedPromo.value}%` 
                : `£${appliedPromo.value}`}
              {' (£'}
              {appliedPromo.type === 'percentage'
                ? (bookingData.total_estimated_price * appliedPromo.value / 100).toFixed(2)
                : appliedPromo.value.toFixed(2)}
              {')'}
            </Text>
          </View>
        )}

        <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.text }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Estimated Total:</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>£{calculateTotal().toFixed(2)}</Text>
        </View>
      </View>

      {/* Promo Code Section */}
      <View style={[styles.promoSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🎁 Have a Promo Code?</Text>
        {!appliedPromo ? (
          <View style={styles.promoInputContainer}>
            <View style={[styles.promoInputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="pricetag" size={20} color={colors.secondary} style={styles.promoIcon} />
              <TextInput
                style={[styles.promoInput, { color: colors.text }]}
                placeholder="Enter code"
                placeholderTextColor={colors.textSecondary}
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
              />
            </View>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.secondary }]}
              onPress={applyPromoCode}
              disabled={promoLoading}
            >
              {promoLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.applyButtonText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.appliedPromoCard, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
            <View style={styles.appliedPromoContent}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <View style={styles.appliedPromoText}>
                <Text style={[styles.appliedPromoCode, { color: '#2E7D32' }]}>
                  {appliedPromo.code}
                </Text>
                <Text style={[styles.appliedPromoDesc, { color: '#66BB6A' }]}>
                  {appliedPromo.description}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={removePromo}>
              <Ionicons name="close-circle" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Apple Pay / Payment Section */}
      {applePayAvailable ? (
        <View style={[styles.paymentSection, { backgroundColor: colors.surface }]}>
          <View style={styles.applePayHeader}>
            <Ionicons name="logo-apple" size={28} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: SIZES.sm }]}>Pay with Apple Pay</Text>
          </View>
          
          <View style={[styles.applePayBenefits, { backgroundColor: colors.background }]}>
            <View style={styles.benefitItem}>
              <Ionicons name="shield-checkmark" size={20} color={colors.secondary} />
              <Text style={[styles.benefitText, { color: colors.text }]}>Secure & Fast</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="lock-closed" size={20} color={colors.secondary} />
              <Text style={[styles.benefitText, { color: colors.text }]}>Private Payment</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="finger-print" size={20} color={colors.secondary} />
              <Text style={[styles.benefitText, { color: colors.text }]}>Touch ID / Face ID</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.applePayButton, { backgroundColor: '#000' }, loading && styles.buttonDisabled]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.applePayButtonContent}>
                <Ionicons name="logo-apple" size={24} color="#fff" />
                <Text style={styles.applePayButtonText}>Pay £{calculateTotal().toFixed(2)}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.paymentNote, { color: colors.textSecondary }]}>
            Payment will be processed securely through Apple Pay
          </Text>
        </View>
      ) : (
        <View style={[styles.paymentSection, { backgroundColor: colors.surface }]}>
          <View style={styles.cardPaymentHeader}>
            <Ionicons name="card" size={24} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: SIZES.sm }]}>💳 Pay with Card</Text>
          </View>
          <Text style={[styles.cashInfo, { color: colors.textSecondary, marginBottom: 4 }]}>
            {"✔ Book now, pay after pickup\n✔ Driver will verify parcel size\n✔ Card charged after confirmation"}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handlePayCard}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.accent }]}>
                Continue – Card Payment on Pickup
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      {/* Cash Payment Section */}
      <View style={[styles.paymentSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>💵 Pay with Cash</Text>
        <Text style={[styles.cashInfo, { color: colors.textSecondary, marginBottom: 4 }]}>
          {"✔ Pay after pickup\n✔ Driver will confirm final price\n✔ Receipt provided in-app"}
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.cashButton, { backgroundColor: colors.surface, borderColor: colors.primary }, loading && styles.buttonDisabled]}
          onPress={handlePayCash}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={[styles.buttonText, styles.cashButtonText, { color: colors.primary }]}>
              Continue – Cash Payment on Pickup
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
  },
  summaryCard: {
    margin: 20,
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
    fontWeight: '600',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  promoSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promoInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  promoInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  promoIcon: {
    marginRight: 8,
  },
  promoInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
    marginVertical: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  appliedPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  appliedPromoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appliedPromoText: {
    gap: 2,
  },
  appliedPromoCode: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  appliedPromoDesc: {
    fontSize: 12,
  },
  paymentSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  applePayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  cardPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  applePayBenefits: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SIZES.md,
    borderRadius: 12,
    marginBottom: SIZES.lg,
  },
  benefitItem: {
    alignItems: 'center',
    gap: SIZES.xs,
  },
  benefitText: {
    fontSize: 12,
    fontWeight: '500',
  },
  applePayButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  applePayButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  applePayButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  paymentNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: SIZES.xs,
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  cardButton: {
  },
  cashButton: {
    borderWidth: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cashButtonText: {
  },
  cashInfo: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    fontWeight: '500',
  },
});
