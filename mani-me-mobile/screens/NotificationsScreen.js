
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../src/api';
import { useUser } from '../context/UserContext';

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/notifications/user');
      if (response.data && response.data.notifications) {
        setNotifications(response.data.notifications);
      } else if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.log('Error fetching notifications:', err);
      // If no notifications endpoint or error, show empty state
      setNotifications([]);
      if (err.response?.status !== 404) {
        setError('Could not load notifications');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'parcel':
      case 'shipment':
      case 'delivery':
        return <MaterialCommunityIcons name="package-variant-closed" size={24} color="#83C5FA" />;
      case 'promo':
      case 'discount':
        return <Ionicons name="pricetag-outline" size={24} color="#10B981" />;
      case 'pickup':
        return <MaterialCommunityIcons name="truck-delivery-outline" size={24} color="#F59E0B" />;
      case 'payment':
        return <Ionicons name="card-outline" size={24} color="#6366F1" />;
      case 'alert':
      case 'warning':
        return <Ionicons name="warning-outline" size={24} color="#EF4444" />;
      default:
        return <Ionicons name="notifications-outline" size={24} color="#83C5FA" />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
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

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.log('Error marking notification as read:', err);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0B1A33', '#071A2C']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.header}>Notifications</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.badgeText}>{notifications.filter(n => !n.read).length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#83C5FA" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#83C5FA"
              colors={['#83C5FA']}
            />
          }
          ListHeaderComponent={error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="notifications-off-outline" size={64} color="#83C5FA" />
              </View>
              <Text style={styles.emptyTitle}>No Notifications Yet</Text>
              <Text style={styles.emptyText}>
                When you have updates about your parcels, promos, or important alerts, they'll appear here.
              </Text>
            </View>
          }
          renderItem={({ item: notif }) => (
            <TouchableOpacity 
              style={[styles.card, !notif.read && styles.unreadCard]}
              onPress={() => markAsRead(notif._id || notif.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBlock, { backgroundColor: notif.read ? '#F3F4F6' : '#83C5FA15' }]}>
                {getNotificationIcon(notif.type)}
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>{notif.title}</Text>
                  {!notif.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.message}>{notif.message || notif.body}</Text>
                <Text style={styles.time}>{formatTime(notif.createdAt || notif.created_at)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071A2C",
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(131, 197, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flex: 1,
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 12,
  },
  headerBadge: {
    backgroundColor: '#83C5FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    color: '#0B1A33',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#83C5FA',
    marginTop: 12,
    fontSize: 14,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(131, 197, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#9EB3D6',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "flex-start",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#83C5FA',
  },
  iconBlock: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0B1A33",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#83C5FA',
  },
  message: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  time: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});
