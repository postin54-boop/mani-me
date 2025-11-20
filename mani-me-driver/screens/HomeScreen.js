import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();

  const stats = [
    { label: 'Today\'s Deliveries', value: '12', icon: 'cube-outline' },
    { label: 'Completed', value: '8', icon: 'checkmark-circle-outline' },
    { label: 'Earnings', value: '₦24,500', icon: 'wallet-outline' },
  ];

  const deliveries = [
    {
      id: 'DEL001',
      pickup: 'Ikeja City Mall',
      delivery: '15 Allen Avenue, Ikeja',
      status: 'pending',
      fee: '₦2,500',
      distance: '3.2 km',
    },
    {
      id: 'DEL002',
      pickup: 'Shoprite Surulere',
      delivery: '24 Adeniran Ogunsanya',
      status: 'in_progress',
      fee: '₦3,000',
      distance: '5.1 km',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'in_progress':
        return colors.info;
      case 'completed':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'New';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : [colors.primary, '#0d2440']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.greeting, { color: colors.accent }]}>
              Hello, Driver! 👋
            </Text>
            <Text style={[styles.subtitle, { color: colors.accent, opacity: 0.8 }]}>
              Ready for deliveries
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: colors.success }]}
          >
            <Text style={styles.statusText}>Online</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[styles.statCard, { backgroundColor: colors.surface }]}
            >
              <View style={[styles.statIcon, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name={stat.icon} size={24} color={colors.secondary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Active Deliveries */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Deliveries
          </Text>

          {deliveries.map((delivery) => (
            <View
              key={delivery.id}
              style={[styles.deliveryCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.deliveryHeader}>
                <Text style={[styles.deliveryId, { color: colors.text }]}>
                  {delivery.id}
                </Text>
                <View
                  style={[
                    styles.statusBadge2,
                    { backgroundColor: getStatusColor(delivery.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: getStatusColor(delivery.status) },
                    ]}
                  >
                    {getStatusText(delivery.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.locationContainer}>
                <View style={styles.locationItem}>
                  <Ionicons name="location" size={16} color={colors.secondary} />
                  <Text style={[styles.locationText, { color: colors.text }]}>
                    {delivery.pickup}
                  </Text>
                </View>
                <View style={styles.locationDivider}>
                  <View style={[styles.dashedLine, { borderColor: colors.border }]} />
                </View>
                <View style={styles.locationItem}>
                  <Ionicons name="flag" size={16} color={colors.error} />
                  <Text style={[styles.locationText, { color: colors.text }]}>
                    {delivery.delivery}
                  </Text>
                </View>
              </View>

              <View style={styles.deliveryFooter}>
                <View style={styles.deliveryInfo}>
                  <Ionicons name="navigate" size={14} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    {delivery.distance}
                  </Text>
                  <Text style={[styles.fee, { color: colors.secondary }]}>
                    {delivery.fee}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                >
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                    {delivery.status === 'pending' ? 'Accept' : 'View'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  deliveryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge2: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  locationDivider: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  dashedLine: {
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    height: 20,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
  },
  fee: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
