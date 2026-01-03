import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, SIZES, FONTS } from '../constants/theme';

export default function PaymentConfirmationScreen({ route, navigation }) {
  const { 
    trackingNumber, 
    amount, 
    bookingMode,
    boxes = [],
    items = [],
    senderName,
    senderPhone,
    receiverName,
    receiverPhone,
    pickupCity,
    deliveryCity,
    subtotal,
    discount = 0,
    promoCode,
    total,
    paymentMethod = 'Card',
    paymentStatus = 'Paid',
    bookingDate
  } = route.params;
  const { colors, isDark } = useThemeColors();

  const shareReceipt = async () => {
    const receiptText = `
📦 Mani Me Receipt

Tracking Number: ${trackingNumber}
Date: ${new Date(bookingDate).toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━
BOOKING DETAILS
━━━━━━━━━━━━━━━━━━━━
Type: ${bookingMode === 'box' ? 'Box Packages' : 'Individual Items'}
${bookingMode === 'box' ? `Boxes: ${boxes.length}` : `Items: ${items.length}`}

From: ${pickupCity}
To: ${deliveryCity}

━━━━━━━━━━━━━━━━━━━━
SENDER
━━━━━━━━━━━━━━━━━━━━
${senderName}
${senderPhone}

━━━━━━━━━━━━━━━━━━━━
RECEIVER
━━━━━━━━━━━━━━━━━━━━
${receiverName}
${receiverPhone}

━━━━━━━━━━━━━━━━━━━━
PAYMENT
━━━━━━━━━━━━━━━━━━━━
Subtotal: £${subtotal?.toFixed(2)}
${discount > 0 ? `Discount: -£${discount.toFixed(2)} (${promoCode})` : ''}
Total: £${total?.toFixed(2)}
Payment Method: ${paymentMethod}
Status: ${paymentStatus}
━━━━━━━━━━━━━━━━━━━━

Thank you for choosing Mani Me! 🚚
`;

    try {
      await Share.share({
        message: receiptText,
        title: `Receipt #${trackingNumber}`,
      });
    } catch (error) {
      console.log('Error sharing receipt:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Receipt</Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={shareReceipt}
        >
          <Ionicons name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.successCircle, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
            </View>
          </View>

        {/* Success Message */}
        <Text style={[styles.title, { color: colors.text }]}>
          {paymentStatus === 'Paid' ? 'Payment Successful!' : 'Booking Confirmed!'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {paymentStatus === 'Paid' 
            ? 'Your payment has been processed successfully' 
            : 'Your parcel booking is confirmed'}
        </Text>

        {/* Tracking Number Card */}
        <View style={[styles.trackingCard, { backgroundColor: colors.primary }]}>
          <Text style={[styles.trackingLabel, { color: colors.accent }]}>Tracking Number</Text>
          <Text style={[styles.trackingNumber, { color: colors.accent }]}>{trackingNumber}</Text>
          <Text style={[styles.trackingDate, { color: colors.accent }]}>
            {new Date(bookingDate).toLocaleDateString('en-GB', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {/* Booking Details */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Booking Details</Text>
          </View>
          
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Type:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {bookingMode === 'box' ? '📦 Box Packages' : '📋 Individual Items'}
            </Text>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Quantity:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {bookingMode === 'box' ? `${boxes.length} Box${boxes.length !== 1 ? 'es' : ''}` : `${items.length} Item${items.length !== 1 ? 's' : ''}`}
            </Text>
          </View>

          {bookingMode === 'box' && boxes.length > 0 && (
            <View style={styles.itemsList}>
              {boxes.map((box, index) => (
                <View key={index} style={[styles.itemCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.itemLabel, { color: colors.text }]}>{box.label}</Text>
                  <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>Qty: {box.quantity}</Text>
                </View>
              ))}
            </View>
          )}

          {bookingMode === 'item' && items.length > 0 && (
            <View style={styles.itemsList}>
              {items.map((item, index) => (
                <View key={index} style={[styles.itemCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label || item.customName}</Text>
                  <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>Qty: {item.quantity}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Route Details */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Route</Text>
          </View>
          
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
              <View style={styles.routeInfo}>
                <Text style={[styles.routeLabel, { color: colors.textSecondary }]}>From</Text>
                <Text style={[styles.routeCity, { color: colors.text }]}>{pickupCity}</Text>
              </View>
            </View>
            <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: colors.secondary }]} />
              <View style={styles.routeInfo}>
                <Text style={[styles.routeLabel, { color: colors.textSecondary }]}>To</Text>
                <Text style={[styles.routeCity, { color: colors.text }]}>{deliveryCity}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Details */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Details</Text>
          </View>
          
          <View style={styles.contactContainer}>
            <View style={styles.contactCard}>
              <Text style={[styles.contactType, { color: colors.textSecondary }]}>Sender</Text>
              <Text style={[styles.contactName, { color: colors.text }]}>{senderName}</Text>
              <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{senderPhone}</Text>
            </View>
            <View style={[styles.contactDivider, { backgroundColor: colors.border }]} />
            <View style={styles.contactCard}>
              <Text style={[styles.contactType, { color: colors.textSecondary }]}>Receiver</Text>
              <Text style={[styles.contactName, { color: colors.text }]}>{receiverName}</Text>
              <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{receiverPhone}</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Summary</Text>
          </View>
          
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Subtotal:</Text>
            <Text style={[styles.value, { color: colors.text }]}>£{subtotal?.toFixed(2)}</Text>
          </View>

          {discount > 0 && (
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Discount:</Text>
                {promoCode && (
                  <Text style={[styles.promoCodeText, { color: colors.secondary }]}>Code: {promoCode}</Text>
                )}
              </View>
              <Text style={[styles.value, { color: colors.secondary }]}>-£{discount.toFixed(2)}</Text>
            </View>
          )}

          <View style={[styles.detailRow, styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.label, styles.totalLabel, { color: colors.text }]}>Total:</Text>
            <Text style={[styles.value, styles.totalValue, { color: colors.primary }]}>£{total?.toFixed(2)}</Text>
          </View>

          <View style={[styles.paymentMethodCard, { backgroundColor: colors.background }]}>
            <Ionicons 
              name={paymentMethod === 'Apple Pay' ? 'logo-apple' : paymentMethod === 'Cash' ? 'cash-outline' : 'card-outline'} 
              size={24} 
              color={colors.text} 
            />
            <Text style={[styles.paymentMethodText, { color: colors.text }]}>{paymentMethod}</Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: paymentStatus === 'Paid' ? `${colors.primary}15` : '#FF980020' }
            ]}>
              <Text style={[
                styles.statusText, 
                { color: paymentStatus === 'Paid' ? colors.primary : '#FF9800' }
              ]}>
                {paymentStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={[styles.infoCard, { backgroundColor: `${colors.secondary}10` }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={colors.secondary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>What's Next?</Text>
          </View>
          <View style={styles.infoSteps}>
            <View style={styles.infoStep}>
              <Ionicons name="notifications-outline" size={20} color={colors.secondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                You'll receive notifications at each stage
              </Text>
            </View>
            <View style={styles.infoStep}>
              <Ionicons name="location-outline" size={20} color={colors.secondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Track your parcel in real-time
              </Text>
            </View>
            <View style={styles.infoStep}>
              <Ionicons name="time-outline" size={20} color={colors.secondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Estimated delivery: 7-14 business days
              </Text>
            </View>
            {paymentStatus === 'Pending' && (
              <View style={styles.infoStep}>
                <Ionicons name="cash-outline" size={20} color="#FF9800" />
                <Text style={[styles.infoText, { color: '#FF9800' }]}>
                  Please have £{total?.toFixed(2)} ready at pickup
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Tracking', {
            parcel: { tracking_number: trackingNumber }
          })}
        >
          <Ionicons name="navigate-circle-outline" size={24} color={colors.accent} />
          <Text style={[styles.primaryButtonText, { color: colors.accent }]}>Track Parcel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={24} color={colors.primary} />
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Back to Home</Text>
        </TouchableOpacity>

        <View style={{ height: SIZES.xl }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SIZES.xs,
    width: 40,
  },
  shareButton: {
    padding: SIZES.xs,
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: SIZES.lg,
    paddingTop: SIZES.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: SIZES.xl,
    textAlign: 'center',
    paddingHorizontal: SIZES.lg,
  },
  trackingCard: {
    width: '100%',
    borderRadius: 16,
    padding: SIZES.xl,
    marginBottom: SIZES.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  trackingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: SIZES.xs,
    opacity: 0.9,
  },
  trackingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginBottom: SIZES.sm,
  },
  trackingDate: {
    fontSize: 13,
    opacity: 0.8,
  },
  section: {
    width: '100%',
    borderRadius: 16,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  itemsList: {
    marginTop: SIZES.sm,
    gap: SIZES.sm,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    borderRadius: 8,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 13,
  },
  routeContainer: {
    paddingVertical: SIZES.sm,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  routeCity: {
    fontSize: 16,
    fontWeight: '600',
  },
  routeLine: {
    width: 2,
    height: 20,
    marginLeft: 5,
    marginVertical: 4,
  },
  contactContainer: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  contactCard: {
    flex: 1,
  },
  contactDivider: {
    width: 1,
  },
  contactType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: SIZES.xs,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
  },
  promoCodeText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    marginTop: SIZES.sm,
    paddingTop: SIZES.md,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderRadius: 12,
    marginTop: SIZES.md,
    gap: SIZES.md,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    width: '100%',
    borderRadius: 16,
    padding: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSteps: {
    gap: SIZES.md,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.sm,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    marginTop: 2,
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    padding: SIZES.lg,
    borderRadius: 12,
    marginBottom: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    padding: SIZES.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
