import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

/**
 * TEMP MOCK DATA
 * Later this comes from backend API
 */
const jobs = [
  {
    id: "1",
    parcelId: "MM-839201",
    pickup: "Accra Mall, Spintex Rd",
    dropoff: "Osu, Oxford St",
    status: "Assigned",
    pickupTime: "10:00 AM - 12:00 PM",
    customerName: "Kwame Mensah",
    customerPhone: "+233 24 123 4567",
  },
  {
    id: "2",
    parcelId: "MM-839202",
    pickup: "East Legon, Airport Residential",
    dropoff: "Airport, Terminal 3",
    status: "Assigned",
    pickupTime: "2:00 PM - 4:00 PM",
    customerName: "Ama Darko",
    customerPhone: "+233 50 987 6543",
  },
];

export default function AssignedJobsScreen() {
  const navigation = useNavigation();

  const handleJobPress = (job) => {
    navigation.navigate("JobDetails", { job });
  };

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

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => handleJobPress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.parcelId}>{item.parcelId}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            
            <View style={styles.cardRow}>
              <Ionicons name="location" size={18} color="#10B981" />
              <Text style={styles.cardLabel}>Pickup: <Text style={styles.cardValue}>{item.pickup}</Text></Text>
            </View>
            
            <View style={styles.cardRow}>
              <Ionicons name="flag" size={18} color="#EF4444" />
              <Text style={styles.cardLabel}>Dropoff: <Text style={styles.cardValue}>{item.dropoff}</Text></Text>
            </View>
            
            <View style={styles.cardRow}>
              <Ionicons name="time" size={18} color="#6B7280" />
              <Text style={styles.cardLabel}>Time: <Text style={styles.cardValue}>{item.pickupTime}</Text></Text>
            </View>
            
            <View style={styles.cardRow}>
              <Ionicons name="person" size={18} color="#6B7280" />
              <Text style={styles.cardLabel}>Customer: <Text style={styles.cardValue}>{item.customerName}</Text></Text>
            </View>

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
  listContent: {
    padding: 16,
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
