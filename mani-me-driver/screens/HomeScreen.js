import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView, 
  StatusBar, 
  Animated, 
  Dimensions, 
  RefreshControl,
  Alert 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../context/AuthContext";
import { useCashTracking } from "../context/CashTrackingContext";
import { API_BASE_URL, ENDPOINTS } from "../utils/config";
import apiClient from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

// Brand Colors
const COLORS = {
  deepNavy: '#0B1F33',
  navy: '#0B1A33',
  skyBlue: '#83C5FA',
  lightBlue: '#6EC1FF',
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#0B1A33',
  textSecondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
};

// Quick actions for UK drivers
const quickActionsUK = [
  { label: "My Pickups", icon: "car-outline", screen: "UKPickups", color: COLORS.navy, bg: 'rgba(11, 31, 51, 0.08)' },
  { label: "Record Cash", icon: "cash-outline", screen: "RecordCashPickup", color: COLORS.success, bg: 'rgba(16, 185, 129, 0.1)' },
  { label: "Scan QR", icon: "qr-code-outline", screen: "ScanParcelScreen", color: COLORS.purple, bg: 'rgba(139, 92, 246, 0.1)' },
  { label: "Print Labels", icon: "print-outline", screen: "PrintLabelsScreen", color: COLORS.skyBlue, bg: 'rgba(131, 197, 250, 0.15)' },
  { label: "Warehouse", icon: "business-outline", screen: "WarehouseReturn", color: COLORS.warning, bg: 'rgba(245, 158, 11, 0.1)' },
  { label: "Chat", icon: "chatbubble-outline", screen: "ChatScreen", color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' },
];

// Quick actions for Ghana drivers
const quickActionsGH = [
  { label: "Deliveries", icon: "bicycle-outline", screen: "GhanaDeliveries", color: COLORS.navy, bg: 'rgba(11, 31, 51, 0.08)' },
  { label: "Scan QR", icon: "qr-code-outline", screen: "ScanParcelScreen", color: COLORS.purple, bg: 'rgba(139, 92, 246, 0.1)' },
  { label: "Take Photo", icon: "camera-outline", screen: "ScanParcelScreen", color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' },
  { label: "Route Map", icon: "map-outline", screen: "GhanaDeliveries", color: COLORS.success, bg: 'rgba(16, 185, 129, 0.1)' },
  { label: "History", icon: "time-outline", screen: "AssignedJobs", color: COLORS.skyBlue, bg: 'rgba(131, 197, 250, 0.15)' },
  { label: "Chat", icon: "chatbubble-outline", screen: "ChatScreen", color: COLORS.warning, bg: 'rgba(245, 158, 11, 0.1)' },
];

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isUKDriver, isGhanaDriver } = useContext(AuthContext);
  const { totalCash, cashCount } = useCashTracking();
  
  const [driverStatus, setDriverStatus] = useState("AVAILABLE");
  const [activeJob, setActiveJob] = useState(null);
  const [assignedJobsCount, setAssignedJobsCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Determine driver type
  const isUK = isUKDriver();
  const quickActions = isUK ? quickActionsUK : quickActionsGH;
  const statusColor = driverStatus === "AVAILABLE" ? COLORS.success : COLORS.warning;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    if (user) fetchDriverData();
  }, [user]);

  const fetchDriverData = useCallback(async () => {
    try {
      const driverId = user?._id || user?.id;
      
      if (!driverId) return;

      const type = isUK ? 'pickup' : 'delivery';
      
      const response = await apiClient.get(`/drivers/${driverId}/assignments`, {
        params: { type, limit: 10 }
      });

      const data = response.data;

      if (data.success && data.data?.shipments) {
        const shipments = data.data.shipments;
        setAssignedJobsCount(shipments.length);
        
        // Set notification count based on pending jobs
        const pendingCount = shipments.filter(s => 
          ['pending', 'assigned', 'booked'].includes(s.status?.toLowerCase())
        ).length;
        
        // Check if user recently viewed notifications (within last 5 minutes)
        const lastView = await AsyncStorage.getItem('lastNotificationView');
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        // Only show notification count if there are new jobs since last view
        // or if user hasn't viewed notifications in a while
        if (!lastView || parseInt(lastView) < fiveMinutesAgo) {
          setNotificationCount(pendingCount);
        }
        
        // Find active job
        const pendingJob = shipments.find(s => 
          !['delivered', 'cancelled'].includes(s.status?.toLowerCase())
        );
        
        if (pendingJob) {
          setActiveJob({
            id: pendingJob._id || pendingJob.id,
            parcelId: pendingJob.tracking_number || pendingJob.parcel_id_short || 'N/A',
            address: isUK 
              ? `${pendingJob.pickup_address || ''}, ${pendingJob.pickup_city || ''}`.trim()
              : `${pendingJob.delivery_address || ''}, ${pendingJob.delivery_city || ''}`.trim(),
            status: pendingJob.status,
            customerName: isUK ? pendingJob.sender_name : pendingJob.receiver_name,
            phone: isUK ? pendingJob.sender_phone : pendingJob.receiver_phone,
            ...pendingJob,
          });
          setDriverStatus("ON_JOB");
        } else {
          setActiveJob(null);
          setDriverStatus("AVAILABLE");
        }
      } else {
        setActiveJob(null);
        setAssignedJobsCount(0);
        setNotificationCount(0);
        setDriverStatus("AVAILABLE");
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
    }
  }, [user, isUK]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDriverData();
    setRefreshing(false);
  };

  const handleActionPress = (action) => {
    if (navigation && action.screen) {
      // Special handling for Chat - needs shipment ID
      if (action.screen === 'ChatScreen') {
        if (activeJob && activeJob.id) {
          navigation.navigate('ChatScreen', {
            shipment_id: activeJob.id,
            customer_name: activeJob.customerName || 'Customer',
            tracking_number: activeJob.parcelId,
          });
        } else {
          // No active job - show alert
          Alert.alert(
            'No Active Job',
            'You need an active pickup or delivery to start a chat.',
            [{ text: 'OK' }]
          );
        }
        return;
      }
      navigation.navigate(action.screen);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.deepNavy} />
      
      {/* Modern Compact Header */}
      <LinearGradient
        colors={[COLORS.deepNavy, '#0D2847', '#152847']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        {/* Top Row - Logo & Notifications */}
        <View style={styles.headerTopRow}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>Mani Me</Text>
          </View>
          
          <View style={styles.headerActions}>
            {/* Status Indicator */}
            <View style={[styles.statusChip, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.statusDotSmall, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusChipText, { color: statusColor }]}>
                {driverStatus === "AVAILABLE" ? "Online" : "Busy"}
              </Text>
            </View>
            
            {/* Notification Bell */}
            <TouchableOpacity 
              style={styles.notificationBtn}
              onPress={() => {
                // Clear notification count when viewing notifications
                setNotificationCount(0);
                // Save that user viewed notifications
                AsyncStorage.setItem('lastNotificationView', Date.now().toString());
                navigation.navigate('NotificationsScreen');
              }}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* User Info Row */}
        <View style={styles.userRow}>
          <Image 
            source={{ uri: user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'Driver'}&background=83C5FA&color=0B1A33&size=128` }} 
            style={styles.avatar} 
          />
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.fullName || 'Driver'}</Text>
          </View>
          <View style={styles.driverBadge}>
            <Text style={styles.driverBadgeText}>{isUK ? '🇬🇧 UK' : '🇬🇭 GH'}</Text>
          </View>
        </View>
      </LinearGradient>
      
      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.skyBlue} />
        }
      >
        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{assignedJobsCount}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
          
          {isUK && (
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(131, 197, 250, 0.15)' }]}>
                <Ionicons name="wallet" size={22} color={COLORS.skyBlue} />
              </View>
              <Text style={styles.statValue}>£{totalCash.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Collected</Text>
            </View>
          )}
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Ionicons name="time" size={22} color={COLORS.purple} />
            </View>
            <Text style={styles.statValue}>{activeJob ? '1' : '0'}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Active Job Card */}
        {activeJob ? (
          <Animated.View style={[
            styles.activeJobCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            <View style={styles.activeJobHeader}>
              <View style={styles.activeJobBadge}>
                <Ionicons name="flash" size={14} color="#fff" />
                <Text style={styles.activeJobBadgeText}>CURRENT JOB</Text>
              </View>
              {assignedJobsCount > 1 && (
                <TouchableOpacity onPress={() => navigation.navigate('AssignedJobs')}>
                  <Text style={styles.viewAllLink}>View all ({assignedJobsCount})</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.jobDetails}>
              <View style={styles.jobRow}>
                <Ionicons name="cube-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.jobParcelId}>{activeJob.parcelId}</Text>
              </View>
              <View style={styles.jobRow}>
                <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.jobAddress} numberOfLines={2}>{activeJob.address || 'Address not available'}</Text>
              </View>
              {activeJob.customerName && (
                <View style={styles.jobRow}>
                  <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
                  <Text style={styles.jobCustomer}>{activeJob.customerName}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.jobActions}>
              {activeJob.phone && (
                <TouchableOpacity style={styles.callBtn}>
                  <Ionicons name="call" size={18} color={COLORS.success} />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.openJobBtn}
                onPress={() => navigation.navigate('JobDetails', { job: activeJob })}
              >
                <Text style={styles.openJobText}>Open Job</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={[
            styles.noJobCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            <View style={styles.noJobIcon}>
              <Ionicons name="clipboard-outline" size={36} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.noJobTitle}>No Active Jobs</Text>
            <Text style={styles.noJobSubtitle}>Pull down to refresh or check your assigned jobs</Text>
          </Animated.View>
        )}

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionItem}
              onPress={() => handleActionPress(action)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* UK Driver - Cash Summary */}
        {isUK && cashCount > 0 && (
          <TouchableOpacity 
            style={styles.cashSummaryCard}
            onPress={() => navigation.navigate('CashReconciliation')}
            activeOpacity={0.8}
          >
            <View style={styles.cashSummaryLeft}>
              <View style={styles.cashIconWrap}>
                <Ionicons name="wallet" size={24} color={COLORS.success} />
              </View>
              <View>
                <Text style={styles.cashSummaryLabel}>Cash to Submit</Text>
                <Text style={styles.cashSummaryAmount}>£{totalCash.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.cashSummaryRight}>
              <Text style={styles.cashPickupCount}>{cashCount} pickups</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.success} />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(131, 197, 250, 0.4)',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  greeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  driverBadge: {
    backgroundColor: 'rgba(131, 197, 250, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  driverBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.skyBlue,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activeJobCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  activeJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activeJobBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  activeJobBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  viewAllLink: {
    fontSize: 13,
    color: COLORS.skyBlue,
    fontWeight: '600',
  },
  jobDetails: {
    gap: 10,
    marginBottom: 16,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  jobParcelId: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  jobAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  jobCustomer: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  jobActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  openJobBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.deepNavy,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  openJobText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  noJobCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
  },
  noJobIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  noJobTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  noJobSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionItem: {
    width: (width - 64) / 3,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  cashSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  cashSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cashIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cashSummaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cashSummaryAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.success,
  },
  cashSummaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cashPickupCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
