import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mani Me</Text>
        <Text style={styles.subtitle}>UK to Ghana Parcel Delivery</Text>
      </View>

      <View style={styles.content}>
        {/* Book Pickup Card */}
        <TouchableOpacity 
          style={[styles.card, styles.primaryCard]}
          onPress={() => navigation.navigate('Booking')}
        >
          <Text style={styles.cardIcon}>📦</Text>
          <Text style={styles.cardTitle}>Book Pickup</Text>
          <Text style={styles.cardDescription}>
            Send parcels to Ghana from anywhere in the UK
          </Text>
        </TouchableOpacity>

        {/* Track Parcel Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.cardIcon}>🔍</Text>
          <Text style={styles.cardTitle}>Track Parcels</Text>
          <Text style={styles.cardDescription}>
            View your parcel history and real-time tracking
          </Text>
        </TouchableOpacity>

        {/* Shop Card (Coming Soon) */}
        <TouchableOpacity 
          style={[styles.card, styles.comingSoonCard]}
          onPress={() => alert("Shop feature coming soon!\n\nGhanians in Ghana will be able to order UK groceries and products.")}
        >
          <Text style={styles.cardIcon}>🛒</Text>
          <Text style={styles.cardTitle}>Shop</Text>
          <Text style={styles.cardDescription}>
            Order UK products (Coming Soon)
          </Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>SOON</Text>
          </View>
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why Choose Mani Me?</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>Fast & Reliable UK-Ghana Delivery</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>Real-time Parcel Tracking</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>Pay by Card or Cash on Pickup</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✓</Text>
            <Text style={styles.infoText}>Door-to-Door Service</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCard: {
    backgroundColor: '#28a745',
  },
  comingSoonCard: {
    opacity: 0.8,
    position: 'relative',
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  primaryCard: {
    backgroundColor: '#28a745',
  },
  primaryCard: {
    backgroundColor: '#28a745',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#FF9800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 18,
    color: '#28a745',
    marginRight: 10,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 16,
    color: '#555',
  },
});
