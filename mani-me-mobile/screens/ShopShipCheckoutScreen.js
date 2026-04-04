import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../constants/theme';
import { useShopShipCart } from '../context/ShopShipCartContext';
import { useUser } from '../context/UserContext';
import api from '../src/api';
import logger from '../utils/logger';

export default function ShopShipCheckoutScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { cartItems, totals, shippingInfo, serviceFee, grandTotal, clearCart, deliveryType } = useShopShipCart();

  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    recipient_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    region: 'Greater Accra',
    landmark: '',
    gps_address: '',
  });
  const [notes, setNotes] = useState('');

  // Ghana regions
  const regions = [
    'Greater Accra',
    'Ashanti',
    'Central',
    'Eastern',
    'Western',
    'Northern',
    'Volta',
    'Brong-Ahafo',
    'Upper East',
    'Upper West',
  ];

  const validateForm = () => {
    if (!deliveryAddress.recipient_name.trim()) {
      Alert.alert('Missing Info', 'Please enter recipient name');
      return false;
    }
    if (!deliveryAddress.phone.trim()) {
      Alert.alert('Missing Info', 'Please enter recipient phone number');
      return false;
    }
    if (!deliveryAddress.address_line1.trim()) {
      Alert.alert('Missing Info', 'Please enter delivery address');
      return false;
    }
    if (!deliveryAddress.city.trim()) {
      Alert.alert('Missing Info', 'Please enter city');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to cart first');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        delivery_address: deliveryAddress,
        customer_notes: notes,
        delivery_type: deliveryType,
      };

      const response = await api.post('/shop-ship/orders', orderData);
      
      // Clear cart after successful order
      clearCart();
      
      // Navigate to order confirmation
      Alert.alert(
        'Order Placed!',
        `Your order #${response.data.order_number} has been placed. We'll start purchasing your items shortly.`,
        [
          { 
            text: 'View Orders', 
            onPress: () => navigation.navigate('ShopOrders')
          },
        ]
      );
    } catch (error) {
      logger.error(error, { context: 'ShopShipCheckoutScreen.placeOrder' });
      Alert.alert('Error', error.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Order Summary */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Order Summary</Text>
            
            {/* Delivery Type Badge */}
            <View style={[styles.deliveryBadge, { backgroundColor: deliveryType === 'express' ? '#F59E0B15' : colors.primary + '15' }]}>
              <Ionicons 
                name={deliveryType === 'express' ? 'flash' : 'boat'} 
                size={16} 
                color={deliveryType === 'express' ? '#F59E0B' : colors.primary} 
              />
              <Text style={[styles.deliveryBadgeText, { color: deliveryType === 'express' ? '#F59E0B' : colors.primary }]}>
                {deliveryType === 'express' ? 'Express Delivery (1-5 days)' : 'Standard Delivery (7-14 days)'}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {totals.itemCount} items ({totals.totalWeight.toFixed(1)}kg)
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                £{totals.itemsTotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {shippingInfo.box} shipping
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                £{shippingInfo.shipping.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Service fee</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                £{serviceFee.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                £{grandTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Delivery Address */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              <Ionicons name="location" size={18} color={colors.primary} /> Ghana Delivery Address
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Recipient Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Who will receive this package?"
              placeholderTextColor={colors.textSecondary}
              value={deliveryAddress.recipient_name}
              onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, recipient_name: text }))}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="+233 XX XXX XXXX"
              placeholderTextColor={colors.textSecondary}
              value={deliveryAddress.phone}
              onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Address Line 1 *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Street address"
              placeholderTextColor={colors.textSecondary}
              value={deliveryAddress.address_line1}
              onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, address_line1: text }))}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Address Line 2</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Apt, suite, building (optional)"
              placeholderTextColor={colors.textSecondary}
              value={deliveryAddress.address_line2}
              onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, address_line2: text }))}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>City *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  value={deliveryAddress.city}
                  onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, city: text }))}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Region</Text>
                <TouchableOpacity
                  style={[styles.input, styles.selectInput, { backgroundColor: colors.background }]}
                  onPress={() => {
                    Alert.alert(
                      'Select Region',
                      '',
                      regions.map(region => ({
                        text: region,
                        onPress: () => setDeliveryAddress(prev => ({ ...prev, region })),
                      }))
                    );
                  }}
                >
                  <Text style={{ color: colors.text }}>{deliveryAddress.region}</Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Landmark</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Near a well-known location (helps delivery)"
              placeholderTextColor={colors.textSecondary}
              value={deliveryAddress.landmark}
              onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, landmark: text }))}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ghana Post GPS</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="e.g. GA-123-4567"
              placeholderTextColor={colors.textSecondary}
              value={deliveryAddress.gps_address}
              onChangeText={(text) => setDeliveryAddress(prev => ({ ...prev, gps_address: text }))}
            />
          </View>

          {/* Notes */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              <Ionicons name="document-text" size={18} color={colors.primary} /> Order Notes
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Any special instructions? (optional)"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Timeline Info */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              <Ionicons name="time" size={18} color={colors.primary} /> Estimated Timeline
            </Text>
            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.text }]}>Purchasing</Text>
                <Text style={[styles.timelineDesc, { color: colors.textSecondary }]}>
                  1-2 days - We buy items from retailers
                </Text>
              </View>
            </View>
            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.text }]}>Consolidation</Text>
                <Text style={[styles.timelineDesc, { color: colors.textSecondary }]}>
                  2-3 days - Pack into your shipping box
                </Text>
              </View>
            </View>
            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.text }]}>Delivery</Text>
                <Text style={[styles.timelineDesc, { color: colors.textSecondary }]}>
                  7-10 days - Shipped to Ghana
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={[styles.placeOrderButton, { backgroundColor: colors.primary }]}
            onPress={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.placeOrderText}>Place Order • £{grandTotal.toFixed(2)}</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  deliveryBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  timelineDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  bottomBar: {
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
