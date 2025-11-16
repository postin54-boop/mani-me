import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';

export default function PaymentScreen({ route, navigation }) {
  const { bookingData } = route.params;
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const { confirmPayment } = useStripe();

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment</Text>
        <Text style={styles.subtitle}>Choose your payment method</Text>
      </View>

      {/* Order Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Weight:</Text>
          <Text style={styles.summaryValue}>{bookingData.weight_kg} kg</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>From:</Text>
          <Text style={styles.summaryValue}>{bookingData.pickup_city}, UK</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>To:</Text>
          <Text style={styles.summaryValue}>{bookingData.delivery_city}, Ghana</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>£{parseFloat(bookingData.total_cost).toFixed(2)}</Text>
        </View>
      </View>

      {/* Card Payment Section */}
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>💳 Pay with Card</Text>
        <View style={styles.cardContainer}>
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={styles.card}
            style={styles.cardField}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />
        </View>
        <TouchableOpacity
          style={[styles.button, styles.cardButton, (!cardComplete || loading) && styles.buttonDisabled]}
          onPress={handlePayment}
          disabled={!cardComplete || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Pay £{parseFloat(bookingData.total_cost).toFixed(2)}</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.testCardInfo}>Test card: 4242 4242 4242 4242</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Cash Payment Section */}
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>💵 Pay with Cash</Text>
        <Text style={styles.cashInfo}>
          Pay cash when your parcel is picked up from your location
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.cashButton, loading && styles.buttonDisabled]}
          onPress={handlePayCash}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={[styles.buttonText, styles.cashButtonText]}>Book & Pay Cash</Text>
          )}
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#fff',
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
    color: '#000',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  paymentSection: {
    backgroundColor: '#fff',
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
  card: {
    backgroundColor: '#f8f8f8',
    textColor: '#000',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButton: {
    backgroundColor: '#000',
  },
  cashButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cashButtonText: {
    color: '#000',
  },
  testCardInfo: {
    marginTop: 10,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  cashInfo: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
});
