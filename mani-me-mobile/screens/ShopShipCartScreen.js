import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../constants/theme';
import { useShopShipCart } from '../context/ShopShipCartContext';

export default function ShopShipCartScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    totals,
    shippingInfo,
    serviceFee,
    grandTotal,
    deliveryType,
    setDeliveryType,
  } = useShopShipCart();

  const handleRemoveItem = (productId, name) => {
    Alert.alert(
      'Remove Item',
      `Remove ${name} from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(productId) },
      ]
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Add some items to your cart first');
      return;
    }
    navigation.navigate('ShopShipCheckout');
  };

  const renderCartItem = ({ item }) => (
    <View style={[styles.cartItem, { backgroundColor: colors.surface }]}>
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
          {item.weight_kg}kg • via {item.retailer}
        </Text>
        <Text style={[styles.itemPrice, { color: colors.primary }]}>
          £{item.price.toFixed(2)} each
        </Text>
        
        <View style={styles.quantityRow}>
          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={[styles.qtyBtn, { backgroundColor: colors.background }]}
              onPress={() => updateQuantity(item.product_id, item.quantity - 1)}
            >
              <Ionicons name="remove" size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
            <TouchableOpacity 
              style={[styles.qtyBtn, { backgroundColor: colors.background }]}
              onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
            >
              <Ionicons name="add" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={() => handleRemoveItem(item.product_id, item.name)}
            style={styles.removeBtn}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Add items from UK retailers to ship to Ghana
      </Text>
      <TouchableOpacity 
        style={[styles.shopButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('ShopShip')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Your Cart</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={() => Alert.alert(
            'Clear Cart',
            'Remove all items from your cart?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearCart },
            ]
          )}>
            <Text style={[styles.clearText, { color: '#EF4444' }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.product_id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
            {/* Delivery Type Selector */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Delivery Speed</Text>
            <View style={styles.deliveryOptions}>
              <TouchableOpacity
                style={[
                  styles.deliveryOption,
                  { 
                    backgroundColor: deliveryType === 'standard' ? colors.primary + '15' : colors.background,
                    borderColor: deliveryType === 'standard' ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setDeliveryType('standard')}
              >
                <View style={styles.deliveryOptionHeader}>
                  <Ionicons 
                    name="boat" 
                    size={20} 
                    color={deliveryType === 'standard' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.deliveryOptionTitle, 
                    { color: deliveryType === 'standard' ? colors.primary : colors.text }
                  ]}>
                    Standard
                  </Text>
                </View>
                <Text style={[styles.deliveryDays, { color: colors.textSecondary }]}>
                  7-14 days
                </Text>
                <Text style={[styles.deliveryDesc, { color: colors.textSecondary }]}>
                  Ships with regular parcels
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deliveryOption,
                  { 
                    backgroundColor: deliveryType === 'express' ? colors.primary + '15' : colors.background,
                    borderColor: deliveryType === 'express' ? colors.primary : colors.border,
                    opacity: totals.totalWeight > 30 ? 0.5 : 1,
                  }
                ]}
                onPress={() => {
                  if (totals.totalWeight > 30) {
                    Alert.alert('Weight Limit', 'Express delivery is only available for orders up to 30kg');
                    return;
                  }
                  setDeliveryType('express');
                }}
                disabled={totals.totalWeight > 30}
              >
                <View style={styles.deliveryOptionHeader}>
                  <Ionicons 
                    name="flash" 
                    size={20} 
                    color={deliveryType === 'express' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.deliveryOptionTitle, 
                    { color: deliveryType === 'express' ? colors.primary : colors.text }
                  ]}>
                    Express
                  </Text>
                </View>
                <Text style={[styles.deliveryDays, { color: colors.textSecondary }]}>
                  1-5 days
                </Text>
                <Text style={[styles.deliveryDesc, { color: colors.textSecondary }]}>
                  Priority handling
                </Text>
              </TouchableOpacity>
            </View>

            {/* Weight & Box Info */}
            <View style={[styles.boxInfo, { backgroundColor: shippingInfo.shipping > 0 ? colors.primary + '10' : colors.background }]}>
              <Ionicons name="cube" size={20} color={colors.primary} />
              <View style={styles.boxInfoText}>
                <Text style={[styles.boxName, { color: colors.text }]}>
                  {shippingInfo.box || 'No items'}
                  {shippingInfo.boxCount > 1 && ` x${shippingInfo.boxCount}`}
                </Text>
                <Text style={[styles.boxWeight, { color: colors.textSecondary }]}>
                  Total weight: {totals.totalWeight.toFixed(1)}kg
                  {shippingInfo.maxWeight && ` / ${shippingInfo.maxWeight}kg max`}
                </Text>
              </View>
            </View>

            {/* Price Breakdown */}
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                Items ({totals.itemCount})
              </Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>
                £{totals.itemsTotal.toFixed(2)}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                Shipping to Ghana
              </Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>
                £{shippingInfo.shipping.toFixed(2)}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                Service fee
              </Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>
                £{serviceFee.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.priceRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                £{grandTotal.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
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
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryCard: {
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  boxInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  boxInfoText: {
    flex: 1,
  },
  boxName: {
    fontSize: 15,
    fontWeight: '600',
  },
  boxWeight: {
    fontSize: 12,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  deliveryOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  deliveryOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  deliveryOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  deliveryOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  deliveryDays: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  deliveryDesc: {
    fontSize: 11,
  },
});
