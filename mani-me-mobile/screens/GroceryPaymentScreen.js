import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  TextInput
} from 'react-native';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, SIZES, FONTS, SHADOWS } from '../constants/theme';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

export default function GroceryPaymentScreen({ route, navigation }) {
  const { cart, subtotal } = route.params;
  const { user, token } = useUser();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [boxSize, setBoxSize] = useState('small'); // small, medium, large
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    region: '',
    country: 'Ghana', // Default to Ghana
    postcode: '',
    phone: user?.phone || ''
  });
  const { confirmPayment } = useStripe();
  const { colors, isDark } = useThemeColors();

  // Box size pricing
  const boxPricing = {
    small: { price: 30, label: 'Small Box (1-5 items)', pounds: '£30' },
    medium: { price: 45, label: 'Medium Box (6-10 items)', pounds: '£45' },
    large: { price: 50, label: 'Large Box (11+ items)', pounds: '£50' }
  };

  useEffect(() => {
    // Auto-select box size based on cart items
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (itemCount <= 5) {
      setBoxSize('small');
    } else if (itemCount <= 10) {
      setBoxSize('medium');
    } else {
      setBoxSize('large');
    }
  }, [cart]);

  useEffect(() => {
    calculateShipping();
  }, [boxSize, deliveryAddress.country]);

  const calculateShipping = async () => {
    try {
      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      const response = await axios.post(
        `${API_BASE_URL}/api/grocery/calculate-shipping`,
        {
          country: deliveryAddress.country,
          subtotal,
          itemCount,
          boxSize
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setShippingCost(response.data.shipping_cost);
    } catch (error) {
      logger.error('Error calculating shipping:', error);
      // Default to box size pricing
      setShippingCost(boxPricing[boxSize].price);
    }
  };

  const getTotalAmount = () => {
    return subtotal + shippingCost;
  };

  const handlePayment = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please enter valid card details');
      return;
    }

    if (!deliveryAddress.street || !deliveryAddress.city) {
      Alert.alert('Error', 'Please enter your delivery address');
      return;
    }

    if (!deliveryAddress.phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);

    try {
      // Create payment intent
      const paymentResponse = await axios.post(
        `${API_BASE_URL}/api/payments/create-intent`,
        {
          amount: getTotalAmount(),
          currency: 'gbp'
        }
      );

      const { clientSecret } = paymentResponse.data;

      // Confirm payment with Stripe
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card'
      });

      if (error) {
        Alert.alert('Payment Failed', error.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'Succeeded') {
        // Create order
        const orderData = {
          items: cart.map(item => ({
            item_id: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category
          })),
          subtotal,
          shipping_cost: shippingCost,
          box_size: boxSize,
          delivery_address: deliveryAddress
        };

        const orderResponse = await axios.post(
          `${API_BASE_URL}/api/grocery/orders`,
          orderData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // Update payment status
        await axios.put(
          `${API_BASE_URL}/api/grocery/orders/${orderResponse.data._id}/payment`,
          { payment_intent_id: paymentIntent.id },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        Alert.alert(
          'Success',
          'Payment successful! Your grocery order has been placed.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }]
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      logger.error('Payment error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? colors.surface : colors.background }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Secure payment
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Order Summary */}
        <View style={[styles.highlightCard, {
          backgroundColor: colors.primary + '08',
          borderColor: colors.primary + '20'
        }]}>
          <View style={styles.highlightHeader}>
            <View style={[styles.iconBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="cart" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.highlightTitle, { color: colors.text }]}>Order Summary</Text>
          </View>

          <View style={[styles.totalDisplay, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>£{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Shipping ({boxSize} box):</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                £{shippingCost.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total:</Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                £{getTotalAmount().toFixed(2)}
              </Text>
            </View>
            <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </Text>
          </View>
        </View>

        {/* Box Size Selection */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="cube" size={20} color={colors.textSecondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Shipping Box Size</Text>
          </View>

          <View style={styles.boxSizeContainer}>
            {Object.entries(boxPricing).map(([size, info]) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.boxSizeOption,
                  {
                    backgroundColor: boxSize === size ? colors.primary + '15' : colors.background,
                    borderColor: boxSize === size ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setBoxSize(size)}
              >
                <View style={styles.boxSizeContent}>
                  <View style={[
                    styles.radioOuter,
                    { borderColor: boxSize === size ? colors.primary : colors.border }
                  ]}>
                    {boxSize === size && (
                      <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <View style={styles.boxSizeInfo}>
                    <Text style={[
                      styles.boxSizeLabel,
                      { color: boxSize === size ? colors.primary : colors.text }
                    ]}>
                      {info.label}
                    </Text>
                    <Text style={[styles.boxSizePrice, { color: colors.primary }]}>
                      {info.pounds}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Items */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={20} color={colors.textSecondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Items</Text>
          </View>

          {cart.map((item, index) => (
            <View key={index} style={[styles.itemRow, index < cart.length - 1 && {
              borderBottomWidth: 1,
              borderBottomColor: colors.border + '30',
              paddingBottom: 12,
              marginBottom: 12
            }]}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>
                  Qty: {item.quantity} × £{item.price.toFixed(2)}
                </Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.text }]}>
                £{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color={colors.textSecondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Address</Text>
          </View>

          {/* Country Selection */}
          <View style={styles.countrySelector}>
            <TouchableOpacity
              style={[
                styles.countryOption,
                {
                  backgroundColor: deliveryAddress.country === 'Ghana' ? '#10B98120' : colors.background,
                  borderColor: deliveryAddress.country === 'Ghana' ? '#10B981' : colors.border
                }
              ]}
              onPress={() => {
                setDeliveryAddress({ ...deliveryAddress, country: 'Ghana' });
              }}
              activeOpacity={0.7}
            >
              {deliveryAddress.country === 'Ghana' && (
                <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginBottom: 4 }} />
              )}
              <Text style={[styles.countryText, { color: deliveryAddress.country === 'Ghana' ? '#10B981' : colors.text }]}>
                🇬🇭 Ghana
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.countryOption,
                {
                  backgroundColor: deliveryAddress.country === 'UK' ? '#83C5FA20' : colors.background,
                  borderColor: deliveryAddress.country === 'UK' ? '#83C5FA' : colors.border
                }
              ]}
              onPress={() => {
                setDeliveryAddress({ ...deliveryAddress, country: 'UK' });
              }}
              activeOpacity={0.7}
            >
              {deliveryAddress.country === 'UK' && (
                <Ionicons name="checkmark-circle" size={20} color="#83C5FA" style={{ marginBottom: 4 }} />
              )}
              <Text style={[styles.countryText, { color: deliveryAddress.country === 'UK' ? '#83C5FA' : colors.text }]}>
                🇬🇧 UK
              </Text>
            </TouchableOpacity>
          </View>

          {/* Address fields - Different for UK vs Ghana */}
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder={deliveryAddress.country === 'UK' ? "House Number & Street" : "Street Address / Landmark"}
            placeholderTextColor={colors.textSecondary}
            value={deliveryAddress.street}
            onChangeText={(text) => setDeliveryAddress({ ...deliveryAddress, street: text })}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder={deliveryAddress.country === 'UK' ? "City / Town" : "City / Town"}
            placeholderTextColor={colors.textSecondary}
            value={deliveryAddress.city}
            onChangeText={(text) => setDeliveryAddress({ ...deliveryAddress, city: text })}
          />
          
          {/* Region - Only for Ghana */}
          {deliveryAddress.country === 'Ghana' && (
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Region (e.g. Greater Accra, Ashanti)"
              placeholderTextColor={colors.textSecondary}
              value={deliveryAddress.region}
              onChangeText={(text) => setDeliveryAddress({ ...deliveryAddress, region: text })}
            />
          )}
          
          {/* County - Only for UK */}
          {deliveryAddress.country === 'UK' && (
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="County (Optional)"
              placeholderTextColor={colors.textSecondary}
              value={deliveryAddress.region}
              onChangeText={(text) => setDeliveryAddress({ ...deliveryAddress, region: text })}
            />
          )}
          
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder={deliveryAddress.country === 'UK' ? "Postcode (e.g. E1 6AN)" : "Postcode (Optional)"}
            placeholderTextColor={colors.textSecondary}
            value={deliveryAddress.postcode}
            onChangeText={(text) => setDeliveryAddress({ ...deliveryAddress, postcode: text })}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder={deliveryAddress.country === 'UK' ? "Phone Number (UK)" : "Phone Number (Ghana)"}
            placeholderTextColor={colors.textSecondary}
            value={deliveryAddress.phone}
            onChangeText={(text) => setDeliveryAddress({ ...deliveryAddress, phone: text })}
            keyboardType="phone-pad"
          />
        </View>

        {/* Card Payment */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={20} color={colors.textSecondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Card Details</Text>
          </View>

          <View style={[styles.cardFieldContainer, {
            backgroundColor: isDark ? colors.background : '#F9FAFB',
            borderColor: colors.border
          }]}>
            <CardField
              postalCodeEnabled={false}
              placeholders={{
                number: '4242 4242 4242 4242'
              }}
              cardStyle={{
                backgroundColor: isDark ? colors.background : '#F9FAFB',
                textColor: colors.text,
                placeholderColor: colors.textSecondary
              }}
              style={styles.cardField}
              onCardChange={(cardDetails) => {
                setCardComplete(cardDetails.complete);
              }}
            />
          </View>

          <View style={[styles.testCardBanner, { backgroundColor: '#FFF4E5', borderColor: '#FFD666' }]}>
            <Ionicons name="information-circle" size={16} color="#FF9800" />
            <Text style={styles.testCardText}>
              Test: 4242 4242 4242 4242 • Any future date • Any CVC
            </Text>
          </View>
        </View>

        {/* Trust Badges */}
        <View style={styles.trustSection}>
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={[styles.trustText, { color: colors.textSecondary }]}>SSL Encrypted</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="lock-closed" size={20} color="#4CAF50" />
            <Text style={[styles.trustText, { color: colors.textSecondary }]}>Secure Payment</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="globe" size={20} color="#4CAF50" />
            <Text style={[styles.trustText, { color: colors.textSecondary }]}>Worldwide</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Pay Button */}
      <View style={[styles.footer, {
        backgroundColor: colors.surface,
        borderTopColor: colors.border
      }]}>
        <TouchableOpacity
          style={[
            styles.payButton,
            {
              backgroundColor: loading || !cardComplete ? colors.border : colors.primary,
              opacity: loading || !cardComplete ? 0.5 : 1
            }
          ]}
          onPress={handlePayment}
          disabled={loading || !cardComplete}
        >
          {loading ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
              <Text style={styles.payButtonText}>
                Pay £{getTotalAmount().toFixed(2)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {!cardComplete && !loading && (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Please enter your card details to continue
          </Text>
        )}
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  highlightCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalDisplay: {
    borderRadius: 16,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '800',
  },
  itemCount: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  countrySelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  countryOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  countryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  cardFieldContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  testCardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  testCardText: {
    fontSize: 12,
    color: '#E65100',
    flex: 1,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  trustBadge: {
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 11,
    textAlign: 'center',
  },
  boxSizeContainer: {
    gap: 12,
  },
  boxSizeOption: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 8,
  },
  boxSizeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  boxSizeInfo: {
    flex: 1,
  },
  boxSizeLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  boxSizePrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    ...SHADOWS.medium,
  },
  payButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
});
