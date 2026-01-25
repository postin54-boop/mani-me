import React, { useState, useEffect, useContext, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL, ENDPOINTS } from "../utils/config";

const COLORS = {
  deepNavy: '#0B1F33',
  skyBlue: '#83C5FA',
  softGrey: '#8BA3B8',
  background: '#F9FAFB',
  white: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { user, isUK } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mark notifications as viewed when screen is focused
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('lastNotificationView', Date.now().toString());
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const driverId = user?._id || user?.id;
      
      if (!driverId) {
        setLoading(false);
        return;
      }

      const type = isUK ? 'pickup' : 'delivery';
      const url = `${API_BASE_URL}${ENDPOINTS.DRIVER_ASSIGNMENTS(driverId)}?type=${type}&limit=20`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.data?.shipments) {
        // Convert shipments to notification format
        const notificationList = data.data.shipments
          .filter(s => ['pending', 'assigned', 'booked', 'picked_up'].includes(s.status?.toLowerCase()))
          .map(shipment => ({
            id: shipment._id || shipment.id,
            type: getNotificationType(shipment.status),
            title: getNotificationTitle(shipment.status, isUK),
            message: getNotificationMessage(shipment, isUK),
            time: formatTime(shipment.updated_at || shipment.created_at),
            status: shipment.status,
            trackingNumber: shipment.tracking_number,
          }));
        
        setNotifications(notificationList);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const getNotificationType = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'assigned':
        return 'new_job';
      case 'booked':
        return 'pickup_scheduled';
      case 'picked_up':
        return 'in_transit';
      default:
        return 'info';
    }
  };

  const getNotificationTitle = (status, isUK) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return isUK ? 'New Pickup Assigned' : 'New Delivery Assigned';
      case 'assigned':
        return isUK ? 'Pickup Ready' : 'Delivery Ready';
      case 'booked':
        return isUK ? 'Pickup Scheduled' : 'Delivery Scheduled';
      case 'picked_up':
        return 'Parcel In Transit';
      default:
        return 'Job Update';
    }
  };

  const getNotificationMessage = (shipment, isUK) => {
    const address = isUK 
      ? `${shipment.pickup_address || ''}, ${shipment.pickup_city || ''}`.trim()
      : `${shipment.delivery_address || ''}, ${shipment.delivery_city || ''}`.trim();
    const customerName = isUK ? shipment.sender_name : shipment.receiver_name;
    
    return `${customerName || 'Customer'} - ${address || 'Address pending'}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_job':
        return { name: 'cube', color: COLORS.skyBlue };
      case 'pickup_scheduled':
        return { name: 'calendar', color: COLORS.warning };
      case 'in_transit':
        return { name: 'car', color: COLORS.success };
      default:
        return { name: 'information-circle', color: COLORS.info };
    }
  };

  const handleNotificationPress = (notification) => {
    // Navigate to job details
    navigation.navigate('JobDetails', { jobId: notification.id });
  };

  const renderNotification = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity 
        style={styles.notificationCard}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>{item.time}</Text>
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          {item.trackingNumber && (
            <Text style={styles.trackingNumber}>#{item.trackingNumber}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.softGrey} />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-off" size={48} color={COLORS.softGrey} />
      </View>
      <Text style={styles.emptyTitle}>All Caught Up!</Text>
      <Text style={styles.emptySubtitle}>
        No pending jobs at the moment.{'\n'}New assignments will appear here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.deepNavy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.skyBlue} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            notifications.length === 0 && styles.emptyListContainer
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.skyBlue]}
              tintColor={COLORS.skyBlue}
            />
          }
          showsVerticalScrollIndicator={false}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          getItemLayout={(data, index) => ({
            length: 100, // Approximate height of each notification item
            offset: 100 * index,
            index,
          })}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
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
    color: COLORS.deepNavy,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.deepNavy,
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.softGrey,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  trackingNumber: {
    fontSize: 11,
    color: COLORS.skyBlue,
    fontWeight: '500',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.deepNavy,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.softGrey,
    textAlign: 'center',
    lineHeight: 20,
  },
});
