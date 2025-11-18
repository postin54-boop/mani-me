import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useThemeColors } from '../constants/theme';

export default function PaymentScreen({ route, navigation }) {
  const { bookingData } = route.params;
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const { confirmPayment } = useStripe();
  const { colors, isDark } = useThemeColors();

  const handlePayment = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please complete your card details');
      return;
    }

    setLoading(true);

    try {
      // Create payment intent on backend
      const response = await fetch('http://192.168.0.138:4000/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: bookingData.total_cost,
          currency: 'gbp',
        }),
      });

      const { clientSecret, error } = await response.json();

      if (error) {
        Alert.alert('Error', error);
        setLoading(false);
        return;
      }

      // Confirm payment
      const { paymentIntent, error: confirmError } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (confirmError) {
        Alert.alert('Payment Failed', confirmError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'Succeeded') {
        // Payment successful, create shipment
        const shipmentResponse = await fetch('http://192.168.0.138:4000/api/shipments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...bookingData,
            payment_method: 'card',
            payment_status: 'paid',
            payment_intent_id: paymentIntent.id,
          }),
        });

        const shipmentData = await shipmentResponse.json();

        if (shipmentResponse.ok) {
          navigation.navigate('PaymentConfirmation', {
            trackingNumber: shipmentData.tracking_number,
            amount: bookingData.total_cost,
            paymentIntent: paymentIntent.id,
          });
        } else {
          Alert.alert('Error', 'Payment succeeded but booking failed. Please contact support.');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayCash = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://192.168.0.138:4000/api/shipments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...bookingData,
          payment_method: 'cash',
          payment_status: 'pending',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigation.navigate('PaymentConfirmation', {
          trackingNumber: data.tracking_number,
          amount: bookingData.total_cost,
          paymentMethod: 'cash',
        });
      } else {
        Alert.alert('Error', data.error || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Payment</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose your payment method</Text>
      </View>

      {/* Order Summary */}
      <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
        <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Weight:</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{bookingData.weight_kg} kg</Text>
        </View>
        <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>From:</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{bookingData.pickup_city}, UK</Text>
        </View>
        <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>To:</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{bookingData.delivery_city}, Ghana</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.text }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total:</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>£{parseFloat(bookingData.total_cost).toFixed(2)}</Text>
        </View>
      </View>

      {/* Card Payment Section */}
      <View style={[styles.paymentSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>💳 Pay with Card</Text>
        <View style={styles.cardContainer}>
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={{
              backgroundColor: isDark ? colors.background : '#f8f8f8',
              textColor: colors.text,
            }}
            style={styles.cardField}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />
        </View>
        <TouchableOpacity
          style={[styles.button, styles.cardButton, { backgroundColor: colors.primary }, (!cardComplete || loading) && styles.buttonDisabled]}
          onPress={handlePayment}
          disabled={!cardComplete || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.accent }]}>Pay £{parseFloat(bookingData.total_cost).toFixed(2)}</Text>
          )}
        </TouchableOpacity>
        <Text style={[styles.testCardInfo, { color: colors.textSecondary }]}>Test card: 4242 4242 4242 4242</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      {/* Cash Payment Section */}
      <View style={[styles.paymentSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>💵 Pay with Cash</Text>
        <Text style={[styles.cashInfo, { color: colors.textSecondary }]}>
          Pay cash when your parcel is picked up from your location
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.cashButton, { backgroundColor: colors.surface, borderColor: colors.primary }, loading && styles.buttonDisabled]}
          onPress={handlePayCash}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={[styles.buttonText, styles.cashButtonText, { color: colors.primary }]}>Book & Pay Cash</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButton: {
  },
  cashButton: {
    borderWidth: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cashButtonText: {
  },
  testCardInfo: {
    marginTop: 10,
    fontSize: 12,
    textAlign: 'center',
  },
  cashInfo: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    fontWeight: '500',
  },
});
