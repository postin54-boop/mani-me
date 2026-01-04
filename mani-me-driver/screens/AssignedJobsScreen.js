import React, { useState, useEffect, useContext, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL, ENDPOINTS } from "../utils/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AssignedJobsScreen() {
  const navigation = useNavigation();
  const { user, isUKDriver } = useContext(AuthContext);
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssignedJobs = useCallback(async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('token');
      const driverId = user?._id || user?.id;
      
      if (!driverId) {
        setError('Driver ID not found');
        setLoading(false);
        return;
      }

      // Determine driver type for API call
      const type = isUKDriver() ? 'pickup' : 'delivery';
      const url = `${API_BASE_URL}${ENDPOINTS.DRIVER_ASSIGNMENTS(driverId)}?type=${type}`;
      
      console.log('Fetching jobs from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Jobs response:', data);

      if (data.success && data.data?.shipments) {
        // Map backend data to display format
        const mappedJobs = data.data.shipments.map(shipment => ({
          id: shipment._id || shipment.id,
          parcelId: shipment.tracking_number || shipment.parcel_id_short || 'N/A',
          pickup: `${shipment.pickup_address || ''}, ${shipment.pickup_city || ''}`.trim(),
          dropoff: `${shipment.delivery_address || ''}, ${shipment.delivery_city || ''}`.trim(),
          status: shipment.status || 'Assigned',
          pickupTime: shipment.pickup_time || 'Flexible',
          pickupDate: shipment.pickup_date,
          customerName: isUKDriver() ? shipment.sender_name : shipment.receiver_name,
          customerPhone: isUKDriver() ? shipment.sender_phone : shipment.receiver_phone,
          specialInstructions: shipment.special_instructions,
          weight: shipment.weight_kg,
          ...shipment, // Include all original data
        }));
        setJobs(mappedJobs);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error('Error fetching assigned jobs:', err);
      setError('Failed to load jobs. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isUKDriver]);

  useEffect(() => {
    fetchAssignedJobs();
  }, [fetchAssignedJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignedJobs();
  };

  const handleJobPress = (job) => {
    navigation.navigate("JobDetails", { job });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'picked_up':
      case 'delivered':
        return '#10B981';
      case 'in_transit':
        return '#3B82F6';
      case 'pending':
      case 'booked':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Assigned';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#0B1A33" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assigned Jobs</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0B1A33" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0B1A33" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assigned Jobs</Text>
        <View style={{ width: 40 }} />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={[styles.listContent, jobs.length === 0 && styles.emptyList]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B1A33" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Assigned Jobs</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any jobs assigned yet.{'\n'}Pull down to refresh.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => handleJobPress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.parcelId}>{item.parcelId}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {formatStatus(item.status)}
                </Text>
              </View>
            </View>
            
            <View style={styles.cardRow}>
              <Ionicons name="location" size={18} color="#10B981" />
              <Text style={styles.cardLabel}>Pickup: <Text style={styles.cardValue}>{item.pickup || 'N/A'}</Text></Text>
            </View>
            
            <View style={styles.cardRow}>
              <Ionicons name="flag" size={18} color="#EF4444" />
              <Text style={styles.cardLabel}>Dropoff: <Text style={styles.cardValue}>{item.dropoff || 'N/A'}</Text></Text>
            </View>
            
            <View style={styles.cardRow}>
              <Ionicons name="time" size={18} color="#6B7280" />
              <Text style={styles.cardLabel}>Time: <Text style={styles.cardValue}>{item.pickupTime}</Text></Text>
            </View>
            
            <View style={styles.cardRow}>
              <Ionicons name="person" size={18} color="#6B7280" />
              <Text style={styles.cardLabel}>Customer: <Text style={styles.cardValue}>{item.customerName || 'N/A'}</Text></Text>
            </View>

            {item.specialInstructions && (
              <View style={styles.cardRow}>
                <Ionicons name="information-circle" size={18} color="#F59E0B" />
                <Text style={styles.cardLabel} numberOfLines={2}>Note: <Text style={styles.cardValue}>{item.specialInstructions}</Text></Text>
              </View>
            )}

            <View style={styles.viewDetailsRow}>
              <Text style={styles.viewDetailsText}>View Details</Text>
              <Ionicons name="chevron-forward" size={20} color="#0B1A33" />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B1A33",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#0B1A33",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  parcelId: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B1A33",
  },
  statusBadge: {
    backgroundColor: "#10B98110",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "700",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  cardValue: {
    color: "#0B1A33",
    fontWeight: "600",
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0B1A33",
    marginRight: 4,
  },
});
