import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { API_BASE_URL } from '../utils/config';
import OfflineNotice from '../components/OfflineNotice';

const PackagingShopScreen = ({ navigation }) => {
  const { user, token } = useUser();
  const { isConnected } = useNetworkStatus();
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [warehouseAddress, setWarehouseAddress] = useState('Loading...');
  const [fulfillmentMethod, setFulfillmentMethod] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    postcode: '',
    country: 'UK',
  });

  useEffect(() => {
    fetchItems();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/settings/warehouse_pickup_address`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWarehouseAddress(response.data.value || 'London Warehouse, E1 6AN');
    } catch (error) {
      // Silently fail and use default address
      setWarehouseAddress('London Warehouse, E1 6AN');
    }
  };

  const fetchItems = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      const response = await axios.get(`${API_BASE_URL}/api/shop/packaging`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data);
    } catch (error) {
      logger.error('Error fetching items:', error);
      Alert.alert('Error', 'Failed to load packaging items');
    } finally {
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchItems(true);
  };

  const addToCart = (item) => {
    const existingItem = cart.find((i) => i._id === item._id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    // Check stock availability
    if (currentQuantity >= item.stock) {
      Alert.alert('Stock Limit', `Only ${item.stock} items available`);
      return;
    }
    
    if (existingItem) {
      setCart(
        cart.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existingItem = cart.find((i) => i._id === itemId);
    if (existingItem.quantity > 1) {
      setCart(
        cart.map((i) =>
          i._id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
    } else {
      setCart(cart.filter((i) => i._id !== itemId));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalQuantity = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const clearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Remove all items from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setCart([]) },
      ]
    );
  };

  const proceedToPayment = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart');
      return;
    }

    if (fulfillmentMethod === 'delivery') {
      if (
        !deliveryAddress.street ||
        !deliveryAddress.city ||
        !deliveryAddress.postcode
      ) {
        Alert.alert('Missing Address', 'Please provide a complete delivery address');
        return;
      }
    }

    const orderData = {
      items: cart.map((item) => ({
        item_id: item._id,
        quantity: item.quantity,
        price: item.price,
      })),
      fulfillment_method: fulfillmentMethod,
      delivery_address:
        fulfillmentMethod === 'delivery' ? deliveryAddress : undefined,
      total_amount: getTotalAmount(),
    };

    navigation.navigate('PackagingPayment', { orderData });
    setModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B1A33" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      {/* Offline Notice */}
      <OfflineNotice />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0B1A33" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Packaging Shop</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Product Grid with FlatList */}
      <FlatList 
        data={items}
        renderItem={({ item }) => {
          const cartItem = cart.find((i) => i._id === item._id);
          return (
            <View style={styles.card}>
              <View style={styles.imageContainer}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="cube-outline" size={48} color="#ccc" />
                  </View>
                )}
              </View>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.itemPrice}>£{item.price.toFixed(2)}</Text>
                {item.stock > 0 ? (
                  <Text style={styles.stockText}>{item.stock} in stock</Text>
                ) : (
                  <Text style={styles.outOfStock}>Out of stock</Text>
                )}
              </View>
              {cartItem ? (
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => removeFromCart(item._id)}
                  >
                    <Ionicons name="remove" size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{cartItem.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => addToCart(item)}
                    disabled={item.stock === 0}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    item.stock === 0 && styles.addButtonDisabled,
                  ]}
                  onPress={() => addToCart(item)}
                  disabled={item.stock === 0}
                >
                  <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.grid}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B1A33']} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={80} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Items Available</Text>
            <Text style={styles.emptyStateText}>Check back later for packaging materials</Text>
          </View>
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
      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.floatingCartButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="cart" size={28} color="#fff" />
          <View style={styles.floatingCartBadge}>
            <Text style={styles.floatingCartBadgeText}>{getTotalQuantity()}</Text>
          </View>
          <Text style={styles.floatingCartTotal}>£{getTotalAmount().toFixed(2)}</Text>
        </TouchableOpacity>
      )}
      {/* Cart Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Cart</Text>
              <View style={styles.modalHeaderActions}>
                {cart.length > 0 && (
                  <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#0B1A33" />
                </TouchableOpacity>
              </View>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons name="cart-outline" size={64} color="#ccc" />
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.cartItems}>
                  {cart.map((item) => (
                    <View key={item._id} style={styles.cartItem}>
                      {item.image_url ? (
                        <Image
                          source={{ uri: item.image_url }}
                          style={styles.cartItemImage}
                        />
                      ) : (
                        <View style={styles.cartItemImagePlaceholder}>
                          <Ionicons name="cube-outline" size={24} color="#ccc" />
                        </View>
                      )}
                      <View style={styles.cartItemDetails}>
                        <Text style={styles.cartItemName}>{item.name}</Text>
                        <Text style={styles.cartItemPrice}>
                          £{item.price.toFixed(2)} x {item.quantity}
                        </Text>
                      </View>
                      <View style={styles.cartItemControls}>
                        <TouchableOpacity
                          onPress={() => removeFromCart(item._id)}
                        >
                          <Ionicons name="remove-circle" size={24} color="#dc2626" />
                        </TouchableOpacity>
                        <Text style={styles.cartItemQuantity}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => addToCart(item)}>
                          <Ionicons name="add-circle" size={24} color="#0B1A33" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* Fulfillment Options */}
                <View style={styles.fulfillmentSection}>
                  <Text style={styles.sectionTitle}>Fulfillment Method</Text>
                  <View style={styles.radioGroup}>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setFulfillmentMethod('pickup')}
                    >
                      <Ionicons
                        name={
                          fulfillmentMethod === 'pickup'
                            ? 'radio-button-on'
                            : 'radio-button-off'
                        }
                        size={24}
                        color="#0B1A33"
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.radioLabel}>Pickup from warehouse</Text>
                        <Text style={styles.radioSubtext}>{warehouseAddress}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.radioOption}
                      onPress={() => setFulfillmentMethod('delivery')}
                    >
                      <Ionicons
                        name={
                          fulfillmentMethod === 'delivery'
                            ? 'radio-button-on'
                            : 'radio-button-off'
                        }
                        size={24}
                        color="#0B1A33"
                      />
                      <Text style={styles.radioLabel}>Delivery to address</Text>
                    </TouchableOpacity>
                  </View>

                  {fulfillmentMethod === 'delivery' && (
                    <KeyboardAvoidingView 
                      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                      style={styles.addressForm}
                    >
                      <View>
                        <Text style={styles.inputLabel}>Street Address</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter street address"
                          value={deliveryAddress.street}
                          onChangeText={(text) =>
                            setDeliveryAddress({ ...deliveryAddress, street: text })
                          }
                        />
                      </View>
                      <View>
                        <Text style={styles.inputLabel}>City</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter city"
                          value={deliveryAddress.city}
                          onChangeText={(text) =>
                            setDeliveryAddress({ ...deliveryAddress, city: text })
                          }
                        />
                      </View>
                      <View>
                        <Text style={styles.inputLabel}>Postcode</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter postcode"
                          value={deliveryAddress.postcode}
                          onChangeText={(text) =>
                            setDeliveryAddress({ ...deliveryAddress, postcode: text })
                          }
                        />
                      </View>
                    </KeyboardAvoidingView>
                  )}
                </View>

                {/* Total and Checkout */}
                <View style={styles.cartFooter}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>
                      £{getTotalAmount().toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={proceedToPayment}
                  >
                    <Text style={styles.checkoutButtonText}>Proceed to Payment</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B1A33',
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: '#0B1A33',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: 'row',
    gap: 8,
    minWidth: 120,
  },
  floatingCartTotal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  floatingCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  floatingCartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B1A33',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  grid: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    marginBottom: 8,
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B1A33',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B1A33',
  },
  stockText: {
    fontSize: 12,
    color: '#10b981',
  },
  outOfStock: {
    fontSize: 12,
    color: '#dc2626',
  },
  addButton: {
    backgroundColor: '#0B1A33',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#0B1A33',
    borderRadius: 8,
    padding: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1A33',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clearButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B1A33',
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  cartItems: {
    maxHeight: 200,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  cartItemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1A33',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartItemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B1A33',
    marginHorizontal: 8,
  },
  fulfillmentSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B1A33',
    marginBottom: 12,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioLabel: {
    fontSize: 14,
    color: '#0B1A33',
  },
  radioSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  addressForm: {
    marginTop: 16,
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1A33',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  cartFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B1A33',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B1A33',
  },
  checkoutButton: {
    backgroundColor: '#0B1A33',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PackagingShopScreen;
