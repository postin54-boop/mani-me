import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';

export default function ShopOrdersScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { user, token } = useUser();
  const [activeTab, setActiveTab] = useState('packaging'); // 'packaging' or 'grocery'
  const [packagingOrders, setPackagingOrders] = useState([]);
  const [groceryOrders, setGroceryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user?.id || !token) return;
    
    try {
      // Fetch packaging orders
      const packagingRes = await fetch(`${API_BASE_URL}/api/shop/orders/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (packagingRes.ok) {
        const data = await packagingRes.json();
        setPackagingOrders(data);
      }

      // Fetch grocery orders
      const groceryRes = await fetch(`${API_BASE_URL}/api/grocery/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (groceryRes.ok) {
        const data = await groceryRes.json();
        setGroceryOrders(data);
      }
    } catch (error) {
      logger.error('Error fetching shop orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: '#F59E0B',
      processing: '#3B82F6',
      ready: '#8B5CF6',
      shipped: '#06B6D4',
      delivered: '#10B981',
      completed: '#10B981',
      cancelled: '#EF4444',
    };
    return statusColors[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'time-outline',
      processing: 'refresh-outline',
      ready: 'checkmark-circle-outline',
      shipped: 'airplane-outline',
      delivered: 'checkmark-done-circle-outline',
      completed: 'checkmark-done-circle-outline',
      cancelled: 'close-circle-outline',
    };
    return icons[status] || 'ellipse-outline';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderPackagingOrder = (order) => (
    <View key={order._id} style={[styles.orderCard, { backgroundColor: colors.surface }]}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Ionicons name="cube-outline" size={20} color={colors.primary} />
          <Text style={[styles.orderId, { color: colors.text }]}>
            #{order._id?.slice(-6).toUpperCase()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
          <Ionicons name={getStatusIcon(order.status)} size={14} color={getStatusColor(order.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items?.slice(0, 3).map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            ) : (
              <View style={[styles.itemImagePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="cube" size={16} color={colors.textSecondary} />
              </View>
            )}
            <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
              {item.name || 'Item'}
            </Text>
            <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
              x{item.quantity}
            </Text>
          </View>
        ))}
        {order.items?.length > 3 && (
          <Text style={[styles.moreItems, { color: colors.textSecondary }]}>
            +{order.items.length - 3} more items
          </Text>
        )}
      </View>

      <View style={[styles.orderFooter, { borderTopColor: colors.border }]}>
        <View style={styles.footerLeft}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
            {formatDate(order.createdAt)}
          </Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={[styles.fulfillmentMethod, { color: colors.textSecondary }]}>
            {order.fulfillment_method === 'delivery' ? '🚚 Delivery' : '📦 Pickup'}
          </Text>
          <Text style={[styles.orderTotal, { color: colors.primary }]}>
            £{order.total_amount?.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderGroceryOrder = (order) => (
    <View key={order._id} style={[styles.orderCard, { backgroundColor: colors.surface }]}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Ionicons name="cart-outline" size={20} color="#10B981" />
          <Text style={[styles.orderId, { color: colors.text }]}>
            #{order._id?.slice(-6).toUpperCase()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
          <Ionicons name={getStatusIcon(order.status)} size={14} color={getStatusColor(order.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items?.slice(0, 3).map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.itemImage} />
            ) : (
              <View style={[styles.itemImagePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="nutrition" size={16} color={colors.textSecondary} />
              </View>
            )}
            <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
              {item.name || 'Item'}
            </Text>
            <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
              x{item.quantity}
            </Text>
          </View>
        ))}
        {order.items?.length > 3 && (
          <Text style={[styles.moreItems, { color: colors.textSecondary }]}>
            +{order.items.length - 3} more items
          </Text>
        )}
      </View>

      {order.receiver_name && (
        <View style={[styles.receiverInfo, { backgroundColor: colors.background }]}>
          <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.receiverText, { color: colors.textSecondary }]}>
            To: {order.receiver_name} ({order.delivery_city})
          </Text>
        </View>
      )}

      <View style={[styles.orderFooter, { borderTopColor: colors.border }]}>
        <View style={styles.footerLeft}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
            {formatDate(order.createdAt)}
          </Text>
        </View>
        <Text style={[styles.orderTotal, { color: '#10B981' }]}>
          £{order.total_amount?.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const currentOrders = activeTab === 'packaging' ? packagingOrders : groceryOrders;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Orders</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tab Switcher */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'packaging' && styles.activeTab,
            activeTab === 'packaging' && { backgroundColor: colors.primary + '15' }
          ]}
          onPress={() => setActiveTab('packaging')}
        >
          <Ionicons 
            name="cube-outline" 
            size={20} 
            color={activeTab === 'packaging' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'packaging' ? colors.primary : colors.textSecondary }
          ]}>
            Packaging ({packagingOrders.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'grocery' && styles.activeTab,
            activeTab === 'grocery' && { backgroundColor: '#10B98115' }
          ]}
          onPress={() => setActiveTab('grocery')}
        >
          <Ionicons 
            name="cart-outline" 
            size={20} 
            color={activeTab === 'grocery' ? '#10B981' : colors.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'grocery' ? '#10B981' : colors.textSecondary }
          ]}>
            Grocery ({groceryOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading orders...
            </Text>
          </View>
        ) : currentOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
              <Ionicons 
                name={activeTab === 'packaging' ? 'cube-outline' : 'cart-outline'} 
                size={48} 
                color={colors.textSecondary} 
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No {activeTab} orders yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {activeTab === 'packaging' 
                ? 'Visit the Packaging Shop to buy boxes and materials'
                : 'Visit the Grocery Shop to send groceries to Ghana'}
            </Text>
            <TouchableOpacity
              style={[styles.shopButton, { backgroundColor: activeTab === 'packaging' ? colors.primary : '#10B981' }]}
              onPress={() => navigation.navigate(activeTab === 'packaging' ? 'PackagingShopScreen' : 'GroceryShop')}
            >
              <Ionicons name="storefront-outline" size={20} color="#FFFFFF" />
              <Text style={styles.shopButtonText}>
                Browse {activeTab === 'packaging' ? 'Packaging' : 'Grocery'} Shop
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          currentOrders.map(order => 
            activeTab === 'packaging' 
              ? renderPackagingOrder(order) 
              : renderGroceryOrder(order)
          )
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    ...SHADOWS.small,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  activeTab: {
    borderRadius: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  orderCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 10,
  },
  itemImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
  },
  itemQty: {
    fontSize: 13,
    fontWeight: '500',
  },
  moreItems: {
    fontSize: 13,
    marginTop: 4,
  },
  receiverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  receiverText: {
    fontSize: 13,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderDate: {
    fontSize: 13,
  },
  fulfillmentMethod: {
    fontSize: 12,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
});
