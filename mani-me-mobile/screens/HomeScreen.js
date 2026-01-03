import React, { useEffect, useState, useCallback, useRef } from "react";
import { fetchRecentParcels } from '../utils/recentParcels';
import api from "../src/api";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  RefreshControl,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import OfflineNotice from '../components/OfflineNotice';
import { ParcelCardSkeleton } from '../components/Skeleton';
import { InlineError } from '../components/ErrorRetry';
import logger from '../utils/logger';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [recentParcels, setRecentParcels] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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
  }, []);

  const loadRecentParcels = useCallback(async () => {
    try {
      setLoadingRecent(true);
      setRecentError(null);
      const data = await fetchRecentParcels();
      setRecentParcels(data);
    } catch (error) {
      setRecentError('Failed to load recent parcels');
      logger.error('Error loading recent parcels:', error);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    loadRecentParcels();
  }, [loadRecentParcels]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecentParcels();
    setRefreshing(false);
  }, [loadRecentParcels]);

  const handleContinue = async () => {
    try {
      const lastBookingStep = await AsyncStorage.getItem('lastBookingStep');
      const lastBookingData = await AsyncStorage.getItem('lastBookingData');
      if (lastBookingStep) {
        navigation.navigate('Booking', {
          step: lastBookingStep,
          savedData: lastBookingData ? JSON.parse(lastBookingData) : undefined,
        });
      } else {
        navigation.navigate('Booking');
      }
    } catch (e) {
      navigation.navigate('Booking');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '#10B981';
      case 'in_transit': return '#F59E0B';
      case 'pending': return '#6B7A90';
      default: return '#83C5FA';
    }
  };

  return (
    <LinearGradient
      colors={['#0F2744', '#0B1E38', '#071A2C']}
      style={styles.container}
    >
      <OfflineNotice />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: insets.top + 16, paddingBottom: 100 + insets.bottom }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#83C5FA"
            colors={['#83C5FA']}
          />
        }
      >
        {/* TOP BAR */}
        <Animated.View style={[
          styles.topRow,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            ) : (
              <Image source={require("../assets/user.jpg")} style={styles.profileImage} />
            )}
          </TouchableOpacity>
          
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>Mani <Text style={styles.brandAccent}>Me</Text></Text>
            <Text style={styles.brandSub}>Your Parcel, Our Priority</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color="#83C5FA" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => navigation.navigate('Chat', { shipment_id: null, driver_name: 'Support', tracking_number: null })}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#83C5FA" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* GREETING */}
        <Animated.View style={[
          styles.greetingRow,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <Text style={styles.greetingText}>Hello 👋</Text>
          <Text style={styles.greetingSub}>What would you like to do today?</Text>
        </Animated.View>

        {/* MAIN CTA - BOOK PARCEL */}
        <Animated.View style={[
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <TouchableOpacity 
            style={styles.heroCard}
            onPress={() => navigation.navigate('Booking')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#83C5FA', '#5A8DFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroIconCircle}>
                <MaterialCommunityIcons name="cube-send" size={32} color="#0B1A33" />
              </View>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroTitle}>Book a Parcel</Text>
                <Text style={styles.heroSubtitle}>Send your package to Ghana</Text>
              </View>
              <View style={styles.heroArrow}>
                <Ionicons name="arrow-forward" size={24} color="#0B1A33" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* RECENT PARCELS */}
        <Animated.View style={[
          styles.sectionCard,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Parcels</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RecentParcelScreen')}>
              <Text style={styles.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>
          
          {loadingRecent ? (
            <View>
              <ParcelCardSkeleton />
              <ParcelCardSkeleton />
            </View>
          ) : recentError ? (
            <InlineError message={recentError} onRetry={loadRecentParcels} />
          ) : recentParcels && recentParcels.length > 0 ? (
            recentParcels.slice(0, 2).map((parcel, idx) => (
              <TouchableOpacity
                key={parcel._id || idx}
                style={[
                  styles.parcelRow, 
                  idx === recentParcels.slice(0, 2).length - 1 && styles.parcelRowLast
                ]}
                onPress={() => navigation.navigate('Tracking', { tracking_number: parcel.tracking_number })}
                activeOpacity={0.7}
              >
                <View style={[styles.parcelIcon, { backgroundColor: getStatusColor(parcel.status) + '20' }]}>
                  <Ionicons name="cube" size={20} color={getStatusColor(parcel.status)} />
                </View>
                <View style={styles.parcelInfo}>
                  <Text style={styles.parcelName} numberOfLines={1}>{parcel.recipientName || 'Parcel'}</Text>
                  <Text style={styles.parcelTracking} numberOfLines={1}>{parcel.tracking_number || 'No tracking'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(parcel.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(parcel.status) }]}>
                    {parcel.status?.replace(/_/g, ' ') || 'Pending'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={40} color="#6B7A90" />
              <Text style={styles.emptyText}>No recent parcels</Text>
              <Text style={styles.emptySubtext}>Book your first parcel to get started</Text>
            </View>
          )}
        </Animated.View>

        {/* SHOPS SECTION */}
        <Animated.View style={[
          styles.shopsSection,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <Text style={styles.shopsSectionTitle}>Shop & Ship</Text>
          
          {/* Grocery Shop */}
          <TouchableOpacity
            style={styles.shopCard}
            onPress={() => navigation.navigate('GroceryShop')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.12)', 'rgba(16, 185, 129, 0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shopCardGradient}
            >
              <View style={[styles.shopIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <MaterialCommunityIcons name="storefront" size={28} color="#10B981" />
              </View>
              <View style={styles.shopContent}>
                <Text style={styles.shopTitle}>Grocery Shop</Text>
                <Text style={styles.shopSub}>Shop UK essentials for Ghana delivery</Text>
              </View>
              <View style={[styles.shopArrow, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="chevron-forward" size={20} color="#10B981" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Packaging Shop */}
          <TouchableOpacity
            style={styles.shopCard}
            onPress={() => navigation.navigate('PackagingShopScreen')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.12)', 'rgba(245, 158, 11, 0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shopCardGradient}
            >
              <View style={[styles.shopIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <MaterialCommunityIcons name="package-variant-closed" size={28} color="#F59E0B" />
              </View>
              <View style={styles.shopContent}>
                <Text style={styles.shopTitle}>Packaging Shop</Text>
                <Text style={styles.shopSub}>Buy boxes, tape & shipping supplies</Text>
              </View>
              <View style={[styles.shopArrow, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* CONTINUE BOOKING */}
        <Animated.View style={[
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <TouchableOpacity
            style={styles.continueCard}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(131, 197, 250, 0.15)' }]}>
              <Ionicons name="arrow-undo" size={26} color="#83C5FA" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Continue Booking</Text>
              <Text style={styles.featureSub}>Pick up where you left off</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#6B7A90" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  
  // Top Bar
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  profileButton: {
    padding: 2,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#83C5FA',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  brandBlock: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  brandAccent: {
    color: '#83C5FA',
  },
  brandSub: {
    color: '#6B7A90',
    fontSize: 11,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  // Greeting
  greetingRow: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  greetingSub: {
    fontSize: 15,
    color: '#9EB3D6',
  },
  
  // Hero Card
  heroCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#83C5FA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextBlock: {
    flex: 1,
    marginLeft: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B1A33',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#0B1A33',
    opacity: 0.7,
  },
  heroArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Section Card
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#83C5FA',
  },
  
  // Parcel Row
  parcelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  parcelRowLast: {
    borderBottomWidth: 0,
  },
  parcelIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parcelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  parcelName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  parcelTracking: {
    fontSize: 12,
    color: '#6B7A90',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9EB3D6',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7A90',
    marginTop: 4,
  },
  
  // Shops Section
  shopsSection: {
    marginBottom: 16,
  },
  shopsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 14,
  },
  shopCard: {
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  shopCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  shopIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopContent: {
    flex: 1,
    marginLeft: 14,
  },
  shopTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  shopSub: {
    fontSize: 13,
    color: '#9EB3D6',
  },
  shopArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Feature Cards
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(131, 197, 250, 0.3)',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: 14,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 13,
    color: '#9EB3D6',
  },
});
