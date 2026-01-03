/**
 * Skeleton loading components for the Driver App
 * Use these to show loading states instead of spinners for better UX
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useThemeColors } from '../constants/theme';

const { width } = Dimensions.get('window');

/**
 * Base skeleton component with shimmer animation
 */
export const Skeleton = ({ width: w = '100%', height = 16, style, borderRadius = 8 }) => {
  const { colors, isDark } = useThemeColors();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: w,
          height,
          borderRadius,
          backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton for a single assignment card
 */
export const AssignmentCardSkeleton = () => {
  const { colors } = useThemeColors();
  
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Header row with status badge */}
      <View style={styles.cardHeader}>
        <Skeleton width={100} height={24} borderRadius={12} />
        <Skeleton width={80} height={20} borderRadius={10} />
      </View>
      
      {/* Address lines */}
      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="80%" height={14} style={{ marginBottom: 4 }} />
            <Skeleton width="60%" height={12} />
          </View>
        </View>
        
        <View style={[styles.addressRow, { marginTop: 12 }]}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="75%" height={14} style={{ marginBottom: 4 }} />
            <Skeleton width="50%" height={12} />
          </View>
        </View>
      </View>
      
      {/* Footer with date and button */}
      <View style={styles.cardFooter}>
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={36} borderRadius={18} />
      </View>
    </View>
  );
};

/**
 * Skeleton list for multiple assignment cards
 */
export const AssignmentListSkeleton = ({ count = 3 }) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <AssignmentCardSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Skeleton for the driver home screen stats
 */
export const HomeStatsSkeleton = () => {
  const { colors } = useThemeColors();
  
  return (
    <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
      {[1, 2, 3].map((_, index) => (
        <View key={index} style={styles.statItem}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <Skeleton width={60} height={16} style={{ marginTop: 8 }} />
          <Skeleton width={40} height={24} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
};

/**
 * Skeleton for shipment detail screen
 */
export const ShipmentDetailSkeleton = () => {
  const { colors } = useThemeColors();
  
  return (
    <View style={styles.detailContainer}>
      {/* Header */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
        <Skeleton width={120} height={32} borderRadius={16} />
      </View>
      
      {/* Address Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, marginTop: 16 }]}>
        <Skeleton width="30%" height={16} style={{ marginBottom: 12 }} />
        <View style={styles.addressRow}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="70%" height={16} style={{ marginBottom: 4 }} />
            <Skeleton width="90%" height={14} />
          </View>
        </View>
      </View>
      
      {/* Items List */}
      <View style={[styles.card, { backgroundColor: colors.surface, marginTop: 16 }]}>
        <Skeleton width="25%" height={16} style={{ marginBottom: 12 }} />
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={[styles.itemRow, { marginBottom: 8 }]}>
            <Skeleton width={48} height={48} borderRadius={8} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Skeleton width="60%" height={14} style={{ marginBottom: 4 }} />
              <Skeleton width="30%" height={12} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  listContainer: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  detailContainer: {
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default {
  Skeleton,
  AssignmentCardSkeleton,
  AssignmentListSkeleton,
  HomeStatsSkeleton,
  ShipmentDetailSkeleton,
};
