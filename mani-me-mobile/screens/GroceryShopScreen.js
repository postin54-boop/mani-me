import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, SIZES, FONTS, SHADOWS } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';
import OfflineNotice from '../components/OfflineNotice';

export default function GroceryShopScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { user, token } = useUser();
  const { isConnected, isInternetReachable } = useNetworkStatus();
  
  const [selectedCategory, setSelectedCategory] = useState('grocery');
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const categories = [
    { id: 'grocery', label: 'Grocery', icon: 'cart' },
    { id: 'electronics', label: 'Electronics', icon: 'hardware-chip' },
    { id: 'household', label: 'Household', icon: 'home' }
  ];

  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/grocery/items?category=${selectedCategory}`,
          { signal: abortController.signal }
        );
        
        if (mounted) {
          setItems(response.data);
          setLoading(false);
        }
      } catch (error) {
        if (error.name !== 'CanceledError' && mounted) {
          logger.error('Error fetching items:', error);
          
          // Show network-specific error messages
          if (error.isNetworkError || error.isOffline) {
            Alert.alert(
              'Connection Error',
              'Unable to connect to the server. Please check your internet connection.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert('Error', 'Failed to load items. Please try again.');
          }
          setLoading(false);
        }
      }
    };

    fetchItems();

    // Cleanup function
    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [selectedCategory]);

  const fetchItems = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/grocery/items?category=${selectedCategory}`
      );
      setItems(response.data);
    } catch (error) {
      logger.error('Error fetching items:', error);
      Alert.alert('Error', 'Failed to load items. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems(true);
  };

  const addToCart = (item) => {
    const existingItem = cart.find((i) => i._id === item._id);
    
    if (existingItem) {
      if (existingItem.quantity >= item.stock) {
        Alert.alert('Stock Limit', `Only ${item.stock} ${item.unit}(s) available`);
        return;
      }
      setCart(cart.map((i) =>
        i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existingItem = cart.find((i) => i._id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map((i) =>
        i._id === itemId ? { ...i, quantity: i.quantity - 1 } : i
      ));
    } else {
      setCart(cart.filter((i) => i._id !== itemId));
    }
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotalQuantity = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checkout');
      return;
    }
    
    navigation.navigate('GroceryPayment', {
      cart,
      subtotal: getSubtotal()
    });
  };

  const renderItem = (item) => {
    const cartItem = cart.find((i) => i._id === item._id);
    const quantity = cartItem ? cartItem.quantity : 0;

    return (
      <View key={item._id} style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.imageContainer}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.itemImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons 
                name={selectedCategory === 'electronics' ? 'hardware-chip' : selectedCategory === 'household' ? 'home' : 'cart'}
                size={48} 
                color={colors.textSecondary} 
              />
            </View>
          )}
        </View>

        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.itemDescription, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.description}
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={[styles.itemPrice, { color: colors.primary }]}>
            £{item.price.toFixed(2)}
          </Text>
          {item.stock > 0 ? (
            <Text style={[styles.stockText, { color: colors.textSecondary }]}>
              {item.stock} left
            </Text>
          ) : (
            <Text style={[styles.outOfStock, { color: '#dc2626' }]}>
              Out of stock
            </Text>
          )}
        </View>

        {quantity > 0 ? (
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: colors.primary }]}
              onPress={() => removeFromCart(item._id)}
            >
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: colors.primary }]}
              onPress={() => addToCart(item)}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }, item.stock === 0 && { opacity: 0.5 }]}
            onPress={() => addToCart(item)}
            disabled={item.stock === 0}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Offline Notice */}
      <OfflineNotice />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Grocery Shop</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            UK & Ghana Delivery
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Tabs */}
      <View style={[styles.categoryTabs, { backgroundColor: colors.surface }]}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && { 
                borderBottomWidth: 3, 
                borderBottomColor: colors.primary 
              }
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon}
              size={20}
              color={selectedCategory === category.id ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.categoryLabel,
                { color: selectedCategory === category.id ? colors.primary : colors.textSecondary }
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items List with FlatList */}
      <FlatList
        data={items}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.grid}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={() => (
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading items...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No items available in this category
              </Text>
            </View>
          )
        )}
        ListFooterComponent={<View style={{ height: 100 }} />}
        // Performance optimizations
        windowSize={5}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        initialNumToRender={10}
      />

      {/* Floating Cart Button */}
      <TouchableOpacity
        style={[styles.floatingCart, { backgroundColor: colors.primary }]}
        onPress={proceedToCheckout}
      >
        <View style={styles.floatingCartContent}>
          <Ionicons name="cart" size={24} color="#FFFFFF" />
          {cart.length > 0 && (
            <>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getTotalQuantity()}</Text>
              </View>
              <Text style={styles.floatingCartText}>
                £{getSubtotal().toFixed(2)}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </SafeAreaView>
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
    paddingHorizontal: 8,
    paddingVertical: 12,
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
    fontSize: 12,
    marginTop: 2,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  grid: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  card: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    ...SHADOWS.small,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  stockText: {
    fontSize: 11,
  },
  outOfStock: {
    fontSize: 11,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    ...SHADOWS.medium,
    zIndex: 999,
    minHeight: 56,
    minWidth: 64,
  },
  floatingCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B1A33',
  },
  floatingCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
