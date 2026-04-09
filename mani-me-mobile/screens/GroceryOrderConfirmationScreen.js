import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, SIZES, FONTS } from '../constants/theme';

export default function GroceryOrderConfirmationScreen({ route, navigation }) {
  const {
    orderId,
    orderNumber,
    items = [],
    subtotal = 0,
    shippingCost = 0,
    total = 0,
    deliveryAddress = {},
    boxSize = 'small',
    paymentIntentId,
    orderDate,
  } = route?.params || {};

  const { colors, isDark } = useThemeColors();

  const boxLabels = {
    small: 'Small Box',
    medium: 'Medium Box',
    large: 'Large Box',
  };

  const shareReceipt = async () => {
    const addressLines = [
      deliveryAddress.street,
      deliveryAddress.city,
      deliveryAddress.region,
      deliveryAddress.country,
      deliveryAddress.postcode,
    ]
      .filter(Boolean)
      .join(', ');

    const itemLines = items
      .map((i) => `  • ${i.name} x${i.quantity} — £${(i.price * i.quantity).toFixed(2)}`)
      .join('\n');

    const receiptText = `
🛒 Mani Me Grocery Order

Order ID: ${orderNumber || orderId || 'N/A'}
Date: ${orderDate ? new Date(orderDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}

━━━━━━━━━━━━━━━━━━━━
ITEMS
━━━━━━━━━━━━━━━━━━━━
${itemLines}

━━━━━━━━━━━━━━━━━━━━
DELIVERY
━━━━━━━━━━━━━━━━━━━━
${addressLines}
Phone: ${deliveryAddress.phone || 'N/A'}

━━━━━━━━━━━━━━━━━━━━
PAYMENT
━━━━━━━━━━━━━━━━━━━━
Subtotal: £${subtotal.toFixed(2)}
Shipping (${boxLabels[boxSize]}): £${shippingCost.toFixed(2)}
Total Paid: £${total.toFixed(2)}
Status: ✅ Paid
━━━━━━━━━━━━━━━━━━━━

Thank you for shopping with Mani Me! 🌍
`;

    try {
      await Share.share({
        message: receiptText.trim(),
        title: `Mani Me Grocery Receipt`,
      });
    } catch (e) {
      // ignore share cancellation
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Order Confirmed</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={shareReceipt}>
          <Ionicons name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Success Banner */}
        <View style={[styles.successBanner, { backgroundColor: '#10B98115', borderColor: '#10B981' }]}>
          <View style={[styles.successIconWrap, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark" size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Payment Successful!</Text>
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>
            Your grocery order has been confirmed and paid.
          </Text>
          {(orderNumber || orderId) && (
            <View style={[styles.orderIdBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.orderIdText, { color: colors.primary }]}>
                Order #{orderNumber || orderId?.slice(-8)?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="cart" size={18} color={colors.textSecondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Items Ordered</Text>
          </View>
          {items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemRow,
                index < items.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border + '40',
                  paddingBottom: 12,
                  marginBottom: 12,
                },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                  Qty: {item.quantity} × £{item.price.toFixed(2)}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: colors.text }]}>
                £{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt" size={18} color={colors.textSecondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Summary</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>£{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Shipping ({boxLabels[boxSize]})
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>£{shippingCost.toFixed(2)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Paid</Text>
            <Text style={[styles.totalValue, { color: '#10B981' }]}>£{total.toFixed(2)}</Text>
          </View>
          <View style={[styles.paidBadge, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={[styles.paidText, { color: '#10B981' }]}>Payment Confirmed</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={18} color={colors.textSecondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Delivering To</Text>
          </View>
          <Text style={[styles.addressLine, { color: colors.text }]}>
            {[deliveryAddress.street, deliveryAddress.city, deliveryAddress.region, deliveryAddress.postcode]
              .filter(Boolean)
              .join(', ')}
          </Text>
          {deliveryAddress.country && (
            <Text style={[styles.addressCountry, { color: colors.textSecondary }]}>
              {deliveryAddress.country === 'Ghana' ? '🇬🇭 Ghana' : '🇬🇧 United Kingdom'}
            </Text>
          )}
          {deliveryAddress.phone && (
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.phoneText, { color: colors.textSecondary }]}>
                {deliveryAddress.phone}
              </Text>
            </View>
          )}
        </View>

        {/* What Happens Next */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={18} color={colors.textSecondary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>What Happens Next</Text>
          </View>
          {[
            { icon: 'checkmark-circle', color: '#10B981', text: 'Order confirmed & payment received' },
            { icon: 'cube', color: '#3B82F6', text: 'Items packed and prepared for shipping' },
            { icon: 'airplane', color: '#8B5CF6', text: 'Shipped from UK to Ghana warehouse' },
            { icon: 'bicycle', color: '#F59E0B', text: 'Out for delivery to your address' },
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: step.color + '20' }]}>
                <Ionicons name={step.icon} size={16} color={step.color} />
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>{step.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.homeBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
        >
          <Ionicons name="home" size={20} color="#FFFFFF" />
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shareFooterBtn, { borderColor: colors.primary }]}
          onPress={shareReceipt}
        >
          <Ionicons name="share-outline" size={20} color={colors.primary} />
          <Text style={[styles.shareFooterText, { color: colors.primary }]}>Share Receipt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  shareBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16 },
  successBanner: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  successSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  orderIdBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  orderIdText: { fontSize: 14, fontWeight: '700' },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  itemInfo: { flex: 1, marginRight: 8 },
  itemName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  itemQty: { fontSize: 13 },
  itemTotal: { fontSize: 15, fontWeight: '600' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 15 },
  summaryValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginVertical: 10 },
  totalLabel: { fontSize: 17, fontWeight: '700' },
  totalValue: { fontSize: 17, fontWeight: '700' },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  paidText: { fontSize: 13, fontWeight: '600' },
  addressLine: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  addressCountry: { fontSize: 14, marginTop: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  phoneText: { fontSize: 14 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 14, flex: 1, lineHeight: 20 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  homeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  shareFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  shareFooterText: { fontSize: 16, fontWeight: '600' },
});
