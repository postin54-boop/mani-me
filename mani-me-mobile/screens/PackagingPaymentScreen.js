import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StatusBar, Animated, Platform } from 'react-native';
import { useStripe, CardField, usePlatformPay, PlatformPayButton, PlatformPay } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, SIZES, FONTS, SHADOWS, BRAND_COLORS } from '../constants/theme';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

export default function PackagingPaymentScreen({ route, navigation }) {
  const { orderData } = route.params;
  const { user, token } = useUser();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'apple', 'google'
  const { confirmPayment, createPaymentMethod } = useStripe();
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();
  const [platformPaySupported, setPlatformPaySupported] = useState(false);
  const { colors, isDark } = useThemeColors();

  // Check if Apple Pay / Google Pay is available
  useEffect(() => {
    (async () => {
      const supported = await isPlatformPaySupported();
      setPlatformPaySupported(supported);
    })();
  }, []);

  const calculateTotal = () => {
    return orderData.total_amount;
  };

  // Handle success after payment
  const handlePaymentSuccess = async () => {
    try {
      // Create order after successful payment
      await axios.post(`${API_BASE_URL}/api/shop/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert(
        '✅ Payment Successful!',
        'Your order has been placed and is being processed.',
        [
          {
            text: 'View Orders',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Order creation error:', error);
      Alert.alert('Payment received but order creation failed. Please contact support.');
    }
  };

  // Handle Apple Pay / Google Pay
  const handlePlatformPay = async () => {
    setLoading(true);
    
    try {
      // Create payment intent on backend
      const paymentResponse = await axios.post(`${API_BASE_URL}/api/payments/create-intent`, {
        amount: calculateTotal(),
        currency: 'gbp',
      });

      const { clientSecret } = paymentResponse.data;

      // Confirm with Platform Pay (Apple/Google)
      const { error } = await confirmPlatformPayPayment(clientSecret, {
        applePay: {
          cartItems: [
            {
              label: 'Mani Me - Packaging Items',
              amount: calculateTotal().toFixed(2),
              paymentType: PlatformPay.PaymentType.Immediate,
            },
          ],
          merchantCountryCode: 'GB',
          currencyCode: 'GBP',
        },
        googlePay: {
          testEnv: true, // Set to false in production
          merchantName: 'Mani Me',
          merchantCountryCode: 'GB',
          currencyCode: 'GBP',
          billingAddressConfig: {
            format: PlatformPay.BillingAddressFormat.Full,
            isRequired: true,
          },
        },
      });

      if (error) {
        Alert.alert('Payment Failed', error.message);
        setLoading(false);
        return;
      }

      await handlePaymentSuccess();
    } catch (error) {
      console.error('Platform Pay error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle card payment
  const handleCardPayment = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please enter valid card details');
      return;
    }

    setLoading(true);

    try {
      // Create payment intent on backend
      const paymentResponse = await axios.post(`${API_BASE_URL}/api/payments/create-intent`, {
        amount: calculateTotal(),
        currency: 'gbp',
      });

      const { clientSecret } = paymentResponse.data;

      // Confirm payment with Stripe
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: user?.name || 'Customer',
            email: user?.email,
          },
        },
      });

      if (error) {
        Alert.alert('Payment Failed', error.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'Succeeded') {
        await handlePaymentSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === 'platform') {
      await handlePlatformPay();
    } else {
      await handleCardPayment();
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Payment</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Secure checkout
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Order Summary - Prominent Card */}
        <View style={[styles.highlightCard, { 
          backgroundColor: colors.primary + '08',
          borderColor: colors.primary + '20'
        }]}>
          <View style={styles.highlightHeader}>
            <View style={[styles.iconBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="cube" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.highlightTitle, { color: colors.text }]}>Order Summary</Text>
          </View>
          
          <View style={[styles.totalDisplay, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Amount</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              £{calculateTotal().toFixed(2)}
            </Text>
            <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
              {orderData.items.reduce((sum, item) => sum + item.quantity, 0)} items • {orderData.fulfillment_method === 'delivery' ? 'Home Delivery' : 'Warehouse Pickup'}
            </Text>
          </View>
        </View>

        {/* Items Breakdown */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={20} color={colors.textSecondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Items Breakdown</Text>
          </View>
          
          {orderData.items.map((item, index) => (
            <View key={index} style={[styles.itemRow, index < orderData.items.length - 1 && { 
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
                  Qty: {item.quantity}
                </Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.text }]}>
                £{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery/Pickup Details */}
        {orderData.fulfillment_method === 'delivery' && orderData.delivery_address ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={20} color={colors.textSecondary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Address</Text>
            </View>
            <View style={[styles.addressContainer, { backgroundColor: colors.background }]}>
              <Text style={[styles.addressText, { color: colors.text }]}>
                {orderData.delivery_address.street}
              </Text>
              <Text style={[styles.addressText, { color: colors.text }]}>
                {orderData.delivery_address.city}, {orderData.delivery_address.postcode}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="business" size={20} color={colors.textSecondary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Pickup Location</Text>
            </View>
            <View style={[styles.addressContainer, { 
              backgroundColor: colors.primary + '08',
              borderLeftWidth: 3,
              borderLeftColor: colors.primary
            }]}>
              <Text style={[styles.addressText, { color: colors.text, fontWeight: '600' }]}>
                {orderData.warehouse_address || 'London Warehouse, E1 6AN'}
              </Text>
              <Text style={[styles.pickupNote, { color: colors.textSecondary }]}>
                📅 Pickup available Mon-Fri, 9am-5pm
              </Text>
            </View>
          </View>
        )}

        {/* Payment Method Selection */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet" size={20} color={colors.textSecondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Method</Text>
          </View>
          
          {/* Apple Pay / Google Pay Option */}
          {platformPaySupported && (
            <>
              <TouchableOpacity 
                style={[
                  styles.paymentMethodOption, 
                  paymentMethod === 'platform' && styles.paymentMethodSelected,
                  { 
                    borderColor: paymentMethod === 'platform' ? BRAND_COLORS.secondary : colors.border,
                    backgroundColor: paymentMethod === 'platform' ? BRAND_COLORS.secondary + '10' : 'transparent'
                  }
                ]}
                onPress={() => setPaymentMethod('platform')}
              >
                <View style={styles.paymentMethodLeft}>
                  <View style={[styles.paymentMethodIcon, { backgroundColor: '#000' }]}>
                    <Ionicons 
                      name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-google'} 
                      size={20} 
                      color="#FFF" 
                    />
                  </View>
                  <View>
                    <Text style={[styles.paymentMethodTitle, { color: colors.text }]}>
                      {Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'}
                    </Text>
                    <Text style={[styles.paymentMethodSubtitle, { color: colors.textSecondary }]}>
                      Fast & secure checkout
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.radioOuter, 
                  { borderColor: paymentMethod === 'platform' ? BRAND_COLORS.secondary : colors.border }
                ]}>
                  {paymentMethod === 'platform' && (
                    <View style={[styles.radioInner, { backgroundColor: BRAND_COLORS.secondary }]} />
                  )}
                </View>
              </TouchableOpacity>
              
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or pay with card</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>
            </>
          )}
          
          {/* Card Payment Option */}
          <TouchableOpacity 
            style={[
              styles.paymentMethodOption, 
              paymentMethod === 'card' && styles.paymentMethodSelected,
              { 
                borderColor: paymentMethod === 'card' ? BRAND_COLORS.secondary : colors.border,
                backgroundColor: paymentMethod === 'card' ? BRAND_COLORS.secondary + '10' : 'transparent'
              }
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={[styles.paymentMethodIcon, { backgroundColor: BRAND_COLORS.primary }]}>
                <Ionicons name="card" size={20} color="#FFF" />
              </View>
              <View>
                <Text style={[styles.paymentMethodTitle, { color: colors.text }]}>Credit / Debit Card</Text>
                <Text style={[styles.paymentMethodSubtitle, { color: colors.textSecondary }]}>
                  Visa, Mastercard, Amex
                </Text>
              </View>
            </View>
            <View style={[
              styles.radioOuter, 
              { borderColor: paymentMethod === 'card' ? BRAND_COLORS.secondary : colors.border }
            ]}>
              {paymentMethod === 'card' && (
                <View style={[styles.radioInner, { backgroundColor: BRAND_COLORS.secondary }]} />
              )}
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Card Details Section - Only show when card payment selected */}
        {paymentMethod === 'card' && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Card Details</Text>
            </View>
          
            <View style={[styles.cardFieldContainer, { 
              backgroundColor: isDark ? colors.background : '#F9FAFB',
              borderColor: cardComplete ? '#10B981' : colors.border
            }]}>
              <CardField
                postalCodeEnabled={true}
                placeholders={{
                  number: '4242 4242 4242 4242',
                  expiration: 'MM/YY',
                  cvc: 'CVC',
                  postalCode: 'Postcode',
                }}
                cardStyle={{
                  backgroundColor: isDark ? colors.background : '#F9FAFB',
                  textColor: colors.text,
                  placeholderColor: colors.textSecondary,
                  borderWidth: 0,
                  fontSize: 16,
                }}
                style={styles.cardField}
                onCardChange={(details) => {
                  setCardComplete(details.complete);
                  setCardDetails(details);
                }}
              />
            </View>
            
            {cardComplete && (
              <View style={styles.cardValidBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.cardValidText}>Card details valid</Text>
              </View>
            )}
          
            {/* Test Card Info */}
            <View style={[styles.testCardBanner, { backgroundColor: '#FFF4E5', borderColor: '#FFD666' }]}>
              <Ionicons name="information-circle" size={16} color="#FF9800" />
              <Text style={styles.testCardText}>
                Test: 4242 4242 4242 4242 • 12/34 • 123
              </Text>
            </View>
          
            {/* Accepted Cards */}
            <View style={styles.acceptedCardsRow}>
              <Text style={[styles.acceptedCardsLabel, { color: colors.textSecondary }]}>We accept:</Text>
              <View style={styles.cardBrands}>
                <View style={[styles.cardBrand, { backgroundColor: '#1A1F71' }]}>
                  <Text style={styles.cardBrandText}>VISA</Text>
                </View>
                <View style={[styles.cardBrand, { backgroundColor: '#EB001B' }]}>
                  <Text style={styles.cardBrandText}>MC</Text>
                </View>
                <View style={[styles.cardBrand, { backgroundColor: '#006FCF' }]}>
                  <Text style={styles.cardBrandText}>AMEX</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Security & Trust Badges */}
        <View style={styles.trustSection}>
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={[styles.trustText, { color: colors.textSecondary }]}>256-bit SSL Encryption</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="lock-closed" size={20} color="#4CAF50" />
            <Text style={[styles.trustText, { color: colors.textSecondary }]}>Secure Payment</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="card" size={20} color="#4CAF50" />
            <Text style={[styles.trustText, { color: colors.textSecondary }]}>Stripe Powered</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Pay Button */}
      <View style={[styles.footer, { 
        backgroundColor: colors.surface,
        borderTopColor: colors.border
      }]}>
        {paymentMethod === 'platform' && platformPaySupported ? (
          // Apple Pay / Google Pay Button
          <TouchableOpacity
            style={[
              styles.payButton,
              { backgroundColor: '#000000' }
            ]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons 
                  name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-google'} 
                  size={24} 
                  color="#FFFFFF" 
                />
                <Text style={styles.payButtonText}>
                  Pay with {Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          // Card Payment Button
          <TouchableOpacity
            style={[
              styles.payButton,
              { 
                backgroundColor: loading || !cardComplete ? colors.border : BRAND_COLORS.secondary,
                opacity: loading || !cardComplete ? 0.6 : 1
              }
            ]}
            onPress={handlePayment}
            disabled={loading || !cardComplete}
          >
            {loading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.loadingText}>Processing payment...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                <Text style={styles.payButtonText}>
                  Pay £{calculateTotal().toFixed(2)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        
        {paymentMethod === 'card' && !cardComplete && !loading && (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Enter your card details above to continue
          </Text>
        )}
        
        <View style={styles.secureNote}>
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text style={[styles.secureNoteText, { color: colors.textSecondary }]}>
            Payments secured by Stripe
          </Text>
        </View>
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
  
  // Highlight Card (Order Summary)
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
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    marginTop: 4,
  },

  // Regular Cards
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
  
  // Items List
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

  // Address
  addressContainer: {
    borderRadius: 12,
    padding: 16,
  },
  addressText: {
    fontSize: 15,
    lineHeight: 22,
  },
  pickupNote: {
    fontSize: 13,
    marginTop: 8,
  },

  // Card Field
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

  // Trust Badges
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

  // Footer
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
  // Payment method selection styles
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  paymentMethodSelected: {
    borderWidth: 2,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  paymentMethodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentMethodSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '500',
  },
  cardValidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  cardValidText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  acceptedCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  acceptedCardsLabel: {
    fontSize: 12,
  },
  cardBrands: {
    flexDirection: 'row',
    gap: 8,
  },
  cardBrand: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cardBrandText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  secureNoteText: {
    fontSize: 12,
  },
});
