import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../constants/theme';

/**
 * Skeleton loading component for better perceived performance
 * 
 * @param {Object} props
 * @param {number} props.width - Width of skeleton (default: '100%')
 * @param {number} props.height - Height of skeleton (default: 20)
 * @param {number} props.borderRadius - Border radius (default: 8)
 * @param {Object} props.style - Additional styles
 */
export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }) {
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
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? colors.surfaceAlt : colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton({ style }) {
  const { colors } = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={150} height={16} />
          <Skeleton width={100} height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton width="100%" height={14} style={{ marginTop: 16 }} />
      <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
    </View>
  );
}

/**
 * List item skeleton
 */
export function ListItemSkeleton({ style }) {
  const { colors } = useThemeColors();

  return (
    <View style={[styles.listItem, { backgroundColor: colors.surface }, style]}>
      <Skeleton width={48} height={48} borderRadius={8} />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
      </View>
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
  );
}

/**
 * Parcel card skeleton for orders/tracking screens
 */
export function ParcelCardSkeleton({ style }) {
  const { colors } = useThemeColors();

  return (
    <View style={[styles.parcelCard, { backgroundColor: colors.surface }, style]}>
      <View style={styles.parcelCardHeader}>
        <Skeleton width={50} height={50} borderRadius={8} />
        <View style={styles.parcelCardInfo}>
          <Skeleton width={120} height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={70} height={24} borderRadius={12} />
      </View>
      <View style={styles.parcelCardDivider} />
      <View style={styles.parcelCardFooter}>
        <Skeleton width="45%" height={14} />
        <Skeleton width="45%" height={14} />
      </View>
    </View>
  );
}

/**
 * Grid of skeleton items for shop screens
 */
export function ProductGridSkeleton({ count = 4, style }) {
  const { colors } = useThemeColors();

  return (
    <View style={[styles.productGrid, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.productCard, { backgroundColor: colors.surface }]}>
          <Skeleton width="100%" height={120} borderRadius={8} />
          <Skeleton width="80%" height={14} style={{ marginTop: 12 }} />
          <Skeleton width="50%" height={16} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

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
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  parcelCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  parcelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parcelCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  parcelCardDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 12,
  },
  parcelCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
  },
  productCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});

// PropTypes
Skeleton.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.number,
  borderRadius: PropTypes.number,
  style: PropTypes.object,
};

CardSkeleton.propTypes = {
  style: PropTypes.object,
};

ListItemSkeleton.propTypes = {
  style: PropTypes.object,
};

ParcelCardSkeleton.propTypes = {
  style: PropTypes.object,
};

ProductGridSkeleton.propTypes = {
  count: PropTypes.number,
  style: PropTypes.object,
};

export default Skeleton;
