import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function PaymentConfirmationScreen({ route, navigation }) {
  const { trackingNumber, amount, paymentIntent, paymentMethod = 'card' } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.successIcon}>✅</Text>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>
          {paymentMethod === 'card' ? 'Payment Successful!' : 'Booking Confirmed!'}
        </Text>
        <Text style={styles.subtitle}>
          {paymentMethod === 'card' 
            ? 'Your payment has been processed successfully' 
            : 'Your parcel booking is confirmed'}
        </Text>

        {/* Booking Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Tracking Number:</Text>
            <Text style={styles.value}>{trackingNumber}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.value}>£{parseFloat(amount).toFixed(2)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={styles.value}>
              {paymentMethod === 'card' ? '💳 Card' : '💵 Cash on Pickup'}
            </Text>
          </View>

          {paymentIntent && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Payment ID:</Text>
              <Text style={[styles.value, styles.paymentId]}>{paymentIntent}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.label}>Status:</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {paymentMethod === 'card' ? 'Paid' : 'Pending Payment'}
              </Text>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📦 What's Next?</Text>
          <Text style={styles.infoText}>
            • You'll receive a notification when your parcel is picked up
          </Text>
          <Text style={styles.infoText}>
            • Track your parcel in real-time from the Orders tab
          </Text>
          <Text style={styles.infoText}>
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
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Tracking', {
            parcel: { tracking_number: trackingNumber }
          })}
        >
          <Text style={styles.primaryButtonText}>Track Parcel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#fff',
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
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    color: '#000',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  paymentId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
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
    color: '#000',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
