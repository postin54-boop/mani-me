
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function NotificationsScreen({ navigation }) {
  // Example notifications data
  const notifications = [
    {
      id: 1,
      type: "parcel",
      title: "Parcel Delivered",
      message: "Your parcel to Accra has been delivered!",
      icon: <MaterialCommunityIcons name="package-variant-closed" size={24} color="#3A5BA0" />,
      time: "2h ago",
    },
    {
      id: 2,
      type: "promo",
      title: "Promo Alert!",
      message: "Get 10% off your next shipment. Use code: GH10",
      icon: <Ionicons name="pricetag-outline" size={24} color="#3A5BA0" />,
      time: "1d ago",
    },
    {
      id: 3,
      type: "parcel",
      title: "Parcel Picked Up",
      message: "Your UK parcel has been picked up by the driver.",
      icon: <MaterialCommunityIcons name="truck-delivery-outline" size={24} color="#3A5BA0" />,
      time: "3d ago",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation && navigation.goBack && navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="notifications-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.header}>Notifications</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {notifications.map((notif) => (
          <View key={notif.id} style={styles.card}>
            <View style={styles.iconBlock}>{notif.icon}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{notif.title}</Text>
              <Text style={styles.message}>{notif.message}</Text>
              <Text style={styles.time}>{notif.time}</Text>
            </View>
          </View>
        ))}
        {notifications.length === 0 && (
          <Text style={styles.empty}>No notifications yet.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071A2C",
    paddingTop: 55,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
    backgroundColor: '#0E2D46',
    padding: 6,
    borderRadius: 10,
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    alignItems: "flex-start",
    elevation: 3,
  },
  iconBlock: {
    marginRight: 16,
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#071A2C",
    marginBottom: 2,
  },
  message: {
    color: "#4A4A4A",
    fontSize: 14,
    marginBottom: 6,
  },
  time: {
    color: "#9EB4C7",
    fontSize: 12,
  },
  empty: {
    color: "#B6C8E0",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
});
