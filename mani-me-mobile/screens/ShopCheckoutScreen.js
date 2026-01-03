import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StatusBar, TextInput } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';
import { API_BASE_URL } from '../utils/config';

export default function ShopCheckoutScreen({ route, navigation }) {
  const { cart, subtotal, deliveryFee, total } = route.params;
  const { colors, isDark } = useThemeColors();
  const { user } = useUser();
  const { confirmPayment } = useStripe();
  
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');

  const handlePayment = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please complete your card details');
      return;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter your delivery address');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      // Create payment intent
      const response = await fetch(`${API_BASE_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'gbp',
        }),
      });
      if (!response.ok) {
        Alert.alert('Error', `Failed to create payment intent: ${response.status}`);
        setLoading(false);
        return;
      }
      const { clientSecret, error } = await response.json();

      if (error) {
        Alert.alert('Error', error);
        setLoading(false);
        return;
      }

      // Confirm payment
      const { paymentIntent, error: confirmError } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (confirmError) {
        Alert.alert('Payment Failed', confirmError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'Succeeded') {
        // Create shop order
        const orderResponse = await fetch(`${API_BASE_URL}/api/shop/orders/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user?.id,
            items: cart,
            subtotal,
            delivery_fee: deliveryFee,
            total,
            delivery_address: deliveryAddress,
            phone_number: phoneNumber,
            payment_intent_id: paymentIntent.id,
            payment_status: 'paid',
          }),
        });
        if (!orderResponse.ok) {
          Alert.alert('Error', `Payment succeeded but order creation failed: ${orderResponse.status}`);
          setLoading(false);
          return;
        }
        const orderData = await orderResponse.json();

        Alert.alert(
          'Order Placed!',
          `Your order #${orderData.order_number} has been confirmed. We'll deliver your items within 2-3 business days.`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('Home');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Payment succeeded but order creation failed. Please contact support.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
          {cart.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={[styles.itemName, { color: colors.text }]}>
                {item.quantity}x {item.name}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
                £{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.orderItem}>
            <Text style={[styles.itemName, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.itemPrice, { color: colors.text }]}>£{subtotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.orderItem}>
            <Text style={[styles.itemName, { color: colors.textSecondary }]}>Delivery</Text>
            <Text style={[styles.itemPrice, { color: colors.text }]}>
              {deliveryFee === 0 ? 'FREE' : `£${deliveryFee.toFixed(2)}`}
            </Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.orderItem}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>£{total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Delivery Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter your full delivery address..."
              placeholderTextColor={colors.textSecondary}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Payment Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Information</Text>
          
          <View style={styles.cardContainer}>
            <CardField
              postalCodeEnabled={false}
              placeholders={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={{
                backgroundColor: isDark ? colors.background : '#f8f8f8',
                textColor: colors.text,
              }}
              style={styles.cardField}
              onCardChange={(cardDetails) => {
                setCardComplete(cardDetails.complete);
              }}
            />
          </View>
          
          <Text style={[styles.testCardInfo, { color: colors.textSecondary }]}>
            Test card: 4242 4242 4242 4242
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Pay Button */}
      <View style={[styles.paymentContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.payButton, 
            { backgroundColor: colors.primary },
            (!cardComplete || loading) && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={!cardComplete || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color={colors.accent} />
              <Text style={[styles.payButtonText, { color: colors.accent }]}>
                Pay £{total.toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.secureText, { color: colors.textSecondary }]}>
          🔒 Secure payment powered by Stripe
        </Text>
      </View>
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
    paddingHorizontal: SIZES.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: SIZES.h4,
    ...FONTS.bold,
    flex: 1,
    marginLeft: SIZES.md,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: SIZES.md,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    ...SHADOWS.medium,
  },
  sectionTitle: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
    marginBottom: SIZES.md,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  itemName: {
    fontSize: SIZES.body,
    flex: 1,
  },
  itemPrice: {
    fontSize: SIZES.body,
    ...FONTS.medium,
  },
  divider: {
    height: 1,
    marginVertical: SIZES.md,
  },
  totalLabel: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
  },
  totalValue: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
  },
  inputGroup: {
    marginBottom: SIZES.md,
  },
  label: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginBottom: SIZES.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.body,
  },
  textArea: {
    minHeight: 80,
    paddingTop: SIZES.md,
  },
  cardContainer: {
    marginBottom: SIZES.sm,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  testCardInfo: {
    fontSize: SIZES.caption,
    textAlign: 'center',
  },
  paymentContainer: {
    padding: SIZES.lg,
    borderTopWidth: 1,
    ...SHADOWS.medium,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    gap: SIZES.sm,
    ...SHADOWS.medium,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    fontSize: SIZES.h6,
    ...FONTS.bold,
  },
  secureText: {
    fontSize: SIZES.caption,
    textAlign: 'center',
    marginTop: SIZES.sm,
  },
});
