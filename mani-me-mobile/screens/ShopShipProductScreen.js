import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../constants/theme';
import { useShopShipCart } from '../context/ShopShipCartContext';
import api from '../src/api';

const { width } = Dimensions.get('window');

export default function ShopShipProductScreen({ route, navigation }) {
  const { product: initialProduct } = route.params;
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { addToCart, cartItems } = useShopShipCart();
  
  const [product, setProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  
  const isInCart = cartItems.some(item => item.product_id === product._id);
  const cartQuantity = cartItems.find(item => item.product_id === product._id)?.quantity || 0;

  const handleAddToCart = () => {
    addToCart({
      product_id: product._id,
      name: product.name,
      price: product.price,
      quantity,
      weight_kg: product.weight_kg,
      thumbnail: product.thumbnail || product.images?.[0],
      retailer: product.retailer,
    });
    
    Alert.alert(
      'Added to Cart',
      `${quantity} x ${product.name} added to your Shop & Ship cart`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('ShopShipCart') },
      ]
    );
  };

  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('ShopShipCart')}
        >
          <Ionicons name="cart" size={24} color={colors.text} />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.images?.[imageIndex] || product.thumbnail }}
            style={styles.mainImage}
            resizeMode="contain"
          />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>
        
        {product.images?.length > 1 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageThumbnails}
          >
            {product.images.map((img, idx) => (
              <TouchableOpacity 
                key={idx} 
                onPress={() => setImageIndex(idx)}
                style={[
                  styles.thumbnail,
                  { borderColor: idx === imageIndex ? colors.primary : 'transparent' }
                ]}
              >
                <Image source={{ uri: img }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <View style={styles.retailerBadge}>
            <Text style={[styles.retailerText, { color: colors.textSecondary }]}>
              via {product.retailer}
            </Text>
          </View>

          <Text style={[styles.productName, { color: colors.text }]}>
            {product.name}
          </Text>

          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: colors.primary }]}>
              £{product.price.toFixed(2)}
            </Text>
            {product.original_price && product.original_price > product.price && (
              <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
                £{product.original_price.toFixed(2)}
              </Text>
            )}
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Weight: {product.weight_kg}kg
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {product.in_stock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="airplane-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Delivered to Ghana in 7-14 days
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {product.description}
          </Text>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <View style={styles.tagsContainer}>
              {product.tags.map((tag, idx) => (
                <View key={idx} style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* How It Works */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
            How Shop & Ship Works
          </Text>
          <View style={[styles.howItWorksCard, { backgroundColor: colors.surface }]}>
            <View style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Add items to your cart from any UK retailer
              </Text>
            </View>
            <View style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                We purchase and consolidate into one box
              </Text>
            </View>
            <View style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Pay flat shipping based on box size only
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={[styles.quantityButton, { backgroundColor: colors.surface }]}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Ionicons name="remove" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
          <TouchableOpacity 
            style={[styles.quantityButton, { backgroundColor: colors.surface }]}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddToCart}
          disabled={!product.in_stock}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.addButtonText}>
            Add to Cart • £{(product.price * quantity).toFixed(2)}
          </Text>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageContainer: {
    width,
    height: width,
    backgroundColor: '#fff',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 100,
    left: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageThumbnails: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 16,
  },
  retailerBadge: {
    marginBottom: 8,
  },
  retailerText: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 18,
    textDecorationLine: 'line-through',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  howItWorksCard: {
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
