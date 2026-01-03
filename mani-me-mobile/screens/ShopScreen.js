import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';

const PACKAGING_MATERIALS = [
  {
    id: 1,
    name: 'Small Box',
    description: '30cm x 20cm x 15cm',
    price: 2.50,
    icon: 'cube-outline',
    inStock: true,
  },
  {
    id: 2,
    name: 'Medium Box',
    description: '45cm x 35cm x 30cm',
    price: 4.00,
    icon: 'cube',
    inStock: true,
  },
  {
    id: 3,
    name: 'Large Box',
    description: '60cm x 50cm x 40cm',
    price: 6.50,
    icon: 'cube',
    inStock: true,
  },
  {
    id: 4,
    name: 'Cello Tape (Roll)',
    description: 'Heavy duty packing tape',
    price: 1.50,
    icon: 'ellipse',
    inStock: true,
  },
  {
    id: 5,
    name: 'Bubble Wrap (5m)',
    description: 'Protective bubble wrap',
    price: 3.00,
    icon: 'apps',
    inStock: true,
  },
  {
    id: 6,
    name: 'Drum (50L)',
    description: 'Plastic storage drum',
    price: 15.00,
    icon: 'basketball',
    inStock: true,
  },
  {
    id: 7,
    name: 'Packing Peanuts',
    description: 'Bag of protective peanuts',
    price: 2.00,
    icon: 'snow',
    inStock: true,
  },
  {
    id: 8,
    name: 'Fragile Labels (10pk)',
    description: 'Handle with care stickers',
    price: 1.00,
    icon: 'alert-circle',
    inStock: true,
  },
];

export default function ShopScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const getItemQuantityInCart = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Premium Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Packaging Shop</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Premium materials for safe shipping
          </Text>
        </View>

        {getTotalItems() > 0 && (
          <TouchableOpacity 
            style={[styles.cartButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ShopCart', { cart, setCart })}
          >
            <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
            <View style={[styles.cartBadge, { backgroundColor: colors.secondary }]}>
              <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {PACKAGING_MATERIALS.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.productCard, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
              onPress={() => addToCart(item)}
            >
              <View style={[styles.productIconContainer, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name={item.icon} size={32} color={colors.primary} />
                {getItemQuantityInCart(item.id) > 0 && (
                  <View style={[styles.quantityBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={styles.quantityBadgeText}>{getItemQuantityInCart(item.id)}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.productDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.description}
                </Text>
                
                <View style={styles.productFooter}>
                  <Text style={[styles.productPrice, { color: colors.primary }]}>
                    £{item.price.toFixed(2)}
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => addToCart(item)}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Need Help Packing?</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Our team can assist with professional packing services
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      {getTotalItems() > 0 && (
        <View style={[styles.checkoutContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.checkoutInfo}>
            <Text style={[styles.checkoutItems, { color: colors.textSecondary }]}>
              {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
            </Text>
            <Text style={[styles.checkoutTotal, { color: colors.text }]}>
              £{getTotalPrice()}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ShopCart', { cart, setCart })}
          >
            <Text style={styles.checkoutButtonText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: SIZES.lg,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: SIZES.h3,
    ...FONTS.bold,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: SIZES.caption,
    ...FONTS.regular,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...SHADOWS.medium,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    ...FONTS.bold,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.md,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  productCard: {
    width: '48%',
    borderRadius: 16,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.light,
  },
  productIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: SIZES.sm,
    position: 'relative',
  },
  quantityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    ...SHADOWS.medium,
  },
  quantityBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    ...FONTS.bold,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginBottom: 4,
    textAlign: 'center',
  },
  productDescription: {
    fontSize: SIZES.caption,
    ...FONTS.regular,
    marginBottom: SIZES.sm,
    textAlign: 'center',
    lineHeight: 16,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SIZES.xs,
  },
  productPrice: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: SIZES.md,
    borderWidth: 1,
    marginBottom: SIZES.lg,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginBottom: 4,
  },
  infoText: {
    fontSize: SIZES.caption,
    ...FONTS.regular,
    lineHeight: 18,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderTopWidth: 1,
    ...SHADOWS.large,
  },
  checkoutInfo: {
    flex: 1,
  },
  checkoutItems: {
    fontSize: SIZES.caption,
    ...FONTS.regular,
    marginBottom: 2,
  },
  checkoutTotal: {
    fontSize: SIZES.h4,
    ...FONTS.bold,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm + 2,
    borderRadius: 12,
    gap: 8,
    ...SHADOWS.medium,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.body,
    ...FONTS.semiBold,
  },
});
