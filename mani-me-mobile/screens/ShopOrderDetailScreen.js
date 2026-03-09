import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../utils/config';

export default function ShopOrderDetailScreen({ route, navigation }) {
  const { orderId, orderType } = route.params; // orderType: 'packaging' or 'grocery'
  const { colors, isDark } = useThemeColors();
  const { token } = useUser();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, orderType]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = orderType === 'grocery' 
        ? `${API_BASE_URL}/api/grocery/orders/${orderId}`
        : `${API_BASE_URL}/api/shop/orders/${orderId}`;
      
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      console.log('Error fetching order:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: '#F59E0B',
      processing: '#3B82F6',
      confirmed: '#3B82F6',
      ready: '#8B5CF6',
      shipped: '#06B6D4',
      in_transit: '#06B6D4',
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
      confirmed: 'checkmark-circle-outline',
      ready: 'cube-outline',
      shipped: 'airplane-outline',
      in_transit: 'car-outline',
      delivered: 'checkmark-done-circle-outline',
      completed: 'checkmark-done-circle-outline',
      cancelled: 'close-circle-outline',
    };
    return icons[status] || 'ellipse-outline';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const callSupport = () => {
    Linking.openURL('tel:+447123456789');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading order details...
        </Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error || '#EF4444'} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          {error || 'Order not found'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={fetchOrderDetails}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = orderType === 'grocery' ? order.order_status : order.status;
  const items = order.items || [];
  const address = orderType === 'grocery' ? order.delivery_address : {
    street: order.delivery_address,
    city: order.delivery_city,
    phone: order.delivery_phone,
  };

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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerSubtitle}>
            #{order._id?.slice(-6).toUpperCase()}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(status) + '20' }]}>
              <Ionicons name={getStatusIcon(status)} size={24} color={getStatusColor(status)} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                Order Status
              </Text>
              <Text style={[styles.statusValue, { color: getStatusColor(status) }]}>
                {status?.charAt(0).toUpperCase() + status?.slice(1).replace('_', ' ')}
              </Text>
            </View>
          </View>
          <View style={[styles.statusTimeline, { borderTopColor: colors.border }]}>
            <Text style={[styles.timelineText, { color: colors.textSecondary }]}>
              Ordered on {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Order Type Badge */}
        <View style={[styles.typeBadge, { 
          backgroundColor: orderType === 'grocery' ? '#10B98115' : colors.primary + '15' 
        }]}>
          <Ionicons 
            name={orderType === 'grocery' ? 'cart-outline' : 'cube-outline'} 
            size={20} 
            color={orderType === 'grocery' ? '#10B981' : colors.primary} 
          />
          <Text style={[styles.typeText, { 
            color: orderType === 'grocery' ? '#10B981' : colors.primary 
          }]}>
            {orderType === 'grocery' ? 'Grocery Order' : 'Packaging Order'}
          </Text>
        </View>

        {/* Items Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            <Ionicons name="list-outline" size={18} color={colors.primary} />
            {'  '}Order Items ({items.length})
          </Text>
          
          {items.map((item, index) => (
            <View 
              key={item._id || index} 
              style={[
                styles.itemRow,
                index < items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }
              ]}
            >
              {(item.imageUrl || item.image_url) ? (
                <Image 
                  source={{ uri: item.imageUrl || item.image_url }} 
                  style={styles.itemImage} 
                />
              ) : (
                <View style={[styles.itemImagePlaceholder, { backgroundColor: colors.border }]}>
                  <Ionicons 
                    name={orderType === 'grocery' ? 'nutrition' : 'cube'} 
                    size={24} 
                    color={colors.textSecondary} 
                  />
                </View>
              )}
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                  {item.name || 'Item'}
                </Text>
                <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                  Qty: {item.quantity} × £{(item.price || 0).toFixed(2)}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: colors.primary }]}>
                £{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Address Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            {'  '}Delivery Address
          </Text>
          
          <View style={styles.addressContent}>
            {orderType === 'grocery' ? (
              <>
                <Text style={[styles.addressLine, { color: colors.text }]}>
                  {address?.street || address?.addressLine || 'N/A'}
                </Text>
                <Text style={[styles.addressLine, { color: colors.textSecondary }]}>
                  {address?.city}{address?.region ? `, ${address.region}` : ''}
                </Text>
                <Text style={[styles.addressLine, { color: colors.textSecondary }]}>
                  {address?.country}{address?.postcode ? ` - ${address.postcode}` : ''}
                </Text>
                {address?.phone && (
                  <View style={styles.phoneRow}>
                    <Ionicons name="call-outline" size={16} color={colors.primary} />
                    <Text style={[styles.phoneText, { color: colors.primary }]}>
                      {address.phone}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {order.receiver_name && (
                  <Text style={[styles.receiverName, { color: colors.text }]}>
                    {order.receiver_name}
                  </Text>
                )}
                <Text style={[styles.addressLine, { color: colors.text }]}>
                  {address?.street || order.delivery_address || 'N/A'}
                </Text>
                <Text style={[styles.addressLine, { color: colors.textSecondary }]}>
                  {address?.city || order.delivery_city || 'N/A'}
                </Text>
                {(address?.phone || order.delivery_phone) && (
                  <View style={styles.phoneRow}>
                    <Ionicons name="call-outline" size={16} color={colors.primary} />
                    <Text style={[styles.phoneText, { color: colors.primary }]}>
                      {address?.phone || order.delivery_phone}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Payment Summary Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            {'  '}Payment Summary
          </Text>
          
          <View style={styles.summaryRows}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Subtotal
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                £{(order.subtotal || 0).toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Shipping
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                £{(order.shipping_cost || order.delivery_fee || 0).toFixed(2)}
              </Text>
            </View>
            
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Total
              </Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                £{(order.total_amount || 0).toFixed(2)}
              </Text>
            </View>
            
            <View style={[styles.paymentStatus, { 
              backgroundColor: order.payment_status === 'paid' ? '#10B98115' : '#F59E0B15' 
            }]}>
              <Ionicons 
                name={order.payment_status === 'paid' ? 'checkmark-circle' : 'time'} 
                size={18} 
                color={order.payment_status === 'paid' ? '#10B981' : '#F59E0B'} 
              />
              <Text style={[styles.paymentStatusText, { 
                color: order.payment_status === 'paid' ? '#10B981' : '#F59E0B' 
              }]}>
                {order.payment_status === 'paid' ? 'Payment Completed' : 'Payment Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Support Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
            {'  '}Need Help?
          </Text>
          
          <TouchableOpacity 
            style={[styles.supportButton, { borderColor: colors.primary }]}
            onPress={callSupport}
          >
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={[styles.supportButtonText, { color: colors.primary }]}>
              Contact Support
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: 16,
  },
  statusLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusTimeline: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  timelineText: {
    fontSize: 14,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 13,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '600',
  },
  addressContent: {
    gap: 4,
  },
  receiverName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  addressLine: {
    fontSize: 15,
    lineHeight: 22,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  phoneText: {
    fontSize: 15,
    fontWeight: '500',
  },
  summaryRows: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
