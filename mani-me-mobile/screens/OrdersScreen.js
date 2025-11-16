import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useUser } from '../context/UserContext';

export default function OrdersScreen({ navigation }) {
  const [parcels, setParcels] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total_parcels: 0, delivered: 0, in_transit: 0 });
  const { user } = useUser();

  const userId = user?.id;

  const fetchParcels = async () => {
    try {
      // Backend URL using computer's IP address
      const response = await fetch(`http://192.168.0.138:4000/api/shipments/user/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setParcels(data.shipments || []);
      }
    } catch (error) {
      console.error('Error fetching parcels:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`http://192.168.0.138:4000/api/shipments/stats/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchParcels();
    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchParcels();
      fetchStats();
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchParcels();
    await fetchStats();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      booked: '#FFA500',
      picked_up: '#2196F3',
      in_transit: '#2196F3',
      customs: '#9C27B0',
      out_for_delivery: '#FF5722',
      delivered: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status] || '#999';
  };

  const getStatusLabel = (status) => {
    const labels = {
      booked: 'Booked',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      customs: 'In Customs',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const handleTrackParcel = (parcel) => {
    navigation.navigate('Tracking', { parcel });
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Parcels</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total_parcels}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#2196F3' }]}>{stats.in_transit}</Text>
          <Text style={styles.statLabel}>In Transit</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.delivered}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </View>

      {/* Parcels List */}
      <View style={styles.listContainer}>
        {parcels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No parcels yet</Text>
            <Text style={styles.emptySubtext}>
              Book your first parcel to start tracking deliveries
            </Text>
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={() => navigation.navigate('HomeTab')}
            >
              <Text style={styles.bookButtonText}>Book a Parcel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          parcels.map((parcel) => (
            <TouchableOpacity
              key={parcel.id}
              style={styles.parcelCard}
              onPress={() => handleTrackParcel(parcel)}
            >
              <View style={styles.parcelHeader}>
                <Text style={styles.trackingNumber}>
                  {parcel.tracking_number}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(parcel.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(parcel.status)}</Text>
                </View>
              </View>

              <View style={styles.parcelDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>To:</Text>
                  <Text style={styles.detailValue}>{parcel.receiver_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Destination:</Text>
                  <Text style={styles.detailValue}>
                    {parcel.delivery_city}, {parcel.delivery_region}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Weight:</Text>
                  <Text style={styles.detailValue}>{parcel.weight_kg} kg</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Booked:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(parcel.booked_at || parcel.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.trackButton}>
                <Text style={styles.trackButtonText}>View Tracking →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 20 }} />
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
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  listContainer: {
    padding: 15,
    paddingTop: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 40,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  parcelCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  parcelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  trackingNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  parcelDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
  trackButton: {
    alignItems: 'center',
    paddingTop: 8,
  },
  trackButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
