import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';

export default function ShopCartScreen({ route, navigation }) {
  const { cart, setCart } = route.params;
  const { colors, isDark } = useThemeColors();

  const updateQuantity = (itemId, change) => {
    const updatedCart = cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    setCart(updatedCart);
  };

  const removeItem = (itemId) => {
    Alert.alert(
      'Remove Item',
      'Remove this item from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setCart(cart.filter(item => item.id !== itemId))
        }
      ]
    );
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDeliveryFee = () => {
    return getSubtotal() >= 20 ? 0 : 3.99;
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryFee();
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart first');
      return;
    }

    navigation.navigate('ShopCheckout', {
      cart,
      subtotal: getSubtotal(),
      deliveryFee: getDeliveryFee(),
      total: getTotal(),
    });
  };

  if (cart.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Shopping Cart</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Add some packaging materials to get started
          </Text>
          <TouchableOpacity 
            style={[styles.shopButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.shopButtonText, { color: colors.accent }]}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Shopping Cart</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {cart.reduce((total, item) => total + item.quantity, 0)} {cart.reduce((total, item) => total + item.quantity, 0) === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {cart.map((item) => (
          <View key={item.id} style={[styles.cartItem, { backgroundColor: colors.surface }]}>
            <View style={[styles.itemIcon, { backgroundColor: colors.primary + '10' }]}>
              <Ionicons name={item.icon} size={28} color={colors.primary} />
            </View>
            
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                {item.description}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>
                £{item.price.toFixed(2)} each
              </Text>
            </View>

            <View style={styles.itemActions}>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => removeItem(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
              
              <View style={[styles.quantityContainer, { borderColor: colors.border }]}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, -1)}
                >
                  <Ionicons name="remove" size={18} color={colors.text} />
                </TouchableOpacity>
                
                <Text style={[styles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
                
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, 1)}
                >
                  <Ionicons name="add" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.itemTotal, { color: colors.text }]}>
                £{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

        {/* Order Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryTotal, { color: colors.text }]}>
              Subtotal ({cart.reduce((total, item) => total + item.quantity, 0)} items)
            </Text>
            <Text style={[styles.summaryTotalValue, { color: colors.primary }]}>
              £{getSubtotal().toFixed(2)}
            </Text>
          </View>

          <Text style={[styles.deliveryNote, { color: colors.textSecondary }]}>
            Delivery fee will be calculated at checkout
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={[styles.checkoutContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
          onPress={handleCheckout}
        >
          <Text style={[styles.checkoutButtonText, { color: colors.accent }]}>
            Proceed to Checkout
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.accent} />
        </TouchableOpacity>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  headerTitle: {
    fontSize: SIZES.h4,
    ...FONTS.bold,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: SIZES.caption,
    ...FONTS.regular,
  },
  content: {
    flex: 1,
    padding: SIZES.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
  },
  emptyTitle: {
    fontSize: SIZES.h4,
    ...FONTS.bold,
    marginTop: SIZES.lg,
    marginBottom: SIZES.sm,
  },
  emptyText: {
    fontSize: SIZES.body,
    textAlign: 'center',
    marginBottom: SIZES.xl,
  },
  shopButton: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.xl,
    borderRadius: SIZES.radiusMd,
  },
  shopButtonText: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
  },
  cartItem: {
    flexDirection: 'row',
    padding: SIZES.md,
    borderRadius: 12,
    marginBottom: SIZES.md,
    ...SHADOWS.light,
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: SIZES.caption,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: SIZES.caption,
    ...FONTS.medium,
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  deleteButton: {
    padding: 4,
    marginBottom: SIZES.sm,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.sm,
  },
  quantityButton: {
    padding: 6,
  },
  quantityText: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    minWidth: 30,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: SIZES.body,
    ...FONTS.bold,
  },
  summaryCard: {
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.md,
    borderWidth: 1,
    ...SHADOWS.medium,
  },
  summaryTitle: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
    marginBottom: SIZES.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  summaryLabel: {
    fontSize: SIZES.body,
  },
  summaryValue: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
  },
  deliveryNote: {
    fontSize: SIZES.caption,
    marginTop: SIZES.md,
    textAlign: 'center',
  },
  summaryDivider: {
    height: 1,
    marginVertical: SIZES.md,
  },
  summaryTotal: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
  },
  summaryTotalValue: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
  },
  checkoutContainer: {
    padding: SIZES.lg,
    borderTopWidth: 1,
    ...SHADOWS.medium,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    gap: SIZES.sm,
  },
  checkoutButtonText: {
    fontSize: SIZES.h6,
    ...FONTS.semiBold,
  },
});
