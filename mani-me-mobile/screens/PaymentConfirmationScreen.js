import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useThemeColors } from '../constants/theme';

export default function PaymentConfirmationScreen({ route, navigation }) {
  const { trackingNumber, amount, paymentIntent, paymentMethod = 'card' } = route.params;
  const { colors, isDark } = useThemeColors();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.successIcon}>✅</Text>
        </View>

        {/* Success Message */}
        <Text style={[styles.title, { color: colors.text }]}>
          {paymentMethod === 'card' ? 'Payment Successful!' : 'Booking Confirmed!'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {paymentMethod === 'card' 
            ? 'Your payment has been processed successfully' 
            : 'Your parcel booking is confirmed'}
        </Text>

        {/* Booking Details */}
        <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Tracking Number:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{trackingNumber}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Amount:</Text>
            <Text style={[styles.value, { color: colors.text }]}>£{parseFloat(amount).toFixed(2)}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Payment Method:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {paymentMethod === 'card' ? '💳 Card' : '💵 Cash on Pickup'}
            </Text>
          </View>

          {paymentIntent && (
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Payment ID:</Text>
              <Text style={[styles.value, styles.paymentId, { color: colors.text }]}>{paymentIntent}</Text>
            </View>
          )}

          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: paymentMethod === 'card' ? '#4CAF50' : '#FF9800' }]}>
              <Text style={[styles.statusText, { color: colors.accent }]}>
                {paymentMethod === 'card' ? 'Paid' : 'Pending Payment'}
              </Text>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>📦 What's Next?</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • You'll receive a notification when your parcel is picked up
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Track your parcel in real-time from the Orders tab
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • You'll be notified at each stage of delivery
          </Text>
          {paymentMethod === 'cash' && (
            <Text style={[styles.infoText, styles.cashNote]}>
              • Please have £{parseFloat(amount).toFixed(2)} ready for the driver
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Tracking', {
            parcel: { tracking_number: trackingNumber }
          })}
        >
          <Text style={[styles.primaryButtonText, { color: colors.accent }]}>Track Parcel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  detailsCard: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
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
  paymentId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  cashNote: {
    color: '#FF9800',
    fontWeight: '600',
    marginTop: 5,
  },
  primaryButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
