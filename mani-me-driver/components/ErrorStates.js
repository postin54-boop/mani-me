/**
 * Error and Empty State Components for Driver App
 * Provides consistent UI for error handling and empty states
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/theme';

/**
 * Error component with retry button
 */
export const ErrorView = ({ 
  message = 'Something went wrong', 
  onRetry,
  retryText = 'Try Again',
  icon = 'alert-circle-outline',
}) => {
  const { colors } = useThemeColors();
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${colors.error || '#FF6B6B'}15` }]}>
        <Ionicons name={icon} size={48} color={colors.error || '#FF6B6B'} />
      </View>
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]} 
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={18} color={colors.accent || '#fff'} style={{ marginRight: 8 }} />
          <Text style={[styles.retryText, { color: colors.accent || '#fff' }]}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Network error component
 */
export const NetworkError = ({ onRetry }) => {
  const { colors } = useThemeColors();
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${colors.warning || '#FFA500'}15` }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.warning || '#FFA500'} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>No Connection</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Please check your internet connection and try again.
      </Text>
      {onRetry && (
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]} 
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={18} color={colors.accent || '#fff'} style={{ marginRight: 8 }} />
          <Text style={[styles.retryText, { color: colors.accent || '#fff' }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Empty state component
 */
export const EmptyState = ({ 
  title = 'Nothing Here Yet',
  message = 'No items to display',
  icon = 'cube-outline',
  actionText,
  onAction,
}) => {
  const { colors } = useThemeColors();
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${colors.secondary}20` }]}>
        <Ionicons name={icon} size={48} color={colors.secondary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{message}</Text>
      {actionText && onAction && (
        <TouchableOpacity 
          style={[styles.actionButton, { borderColor: colors.secondary }]} 
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionText, { color: colors.secondary }]}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * No Assignments Empty State
 */
export const NoAssignmentsState = ({ driverType = 'pickup' }) => {
  const { colors } = useThemeColors();
  const isPickup = driverType === 'pickup';
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${colors.secondary}20` }]}>
        <Ionicons 
          name={isPickup ? "car-outline" : "bicycle-outline"} 
          size={48} 
          color={colors.secondary} 
        />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        No {isPickup ? 'Pickups' : 'Deliveries'} Assigned
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
        {isPickup 
          ? 'New pickup requests will appear here when assigned to you.'
          : 'Delivery assignments will appear here when shipments arrive.'
        }
      </Text>
    </View>
  );
};

/**
 * Loading Failed with Cached Data Message
 */
export const CachedDataBanner = ({ onRetry }) => {
  const { colors } = useThemeColors();
  
  return (
    <View style={[styles.banner, { backgroundColor: `${colors.warning || '#FFA500'}15` }]}>
      <Ionicons name="information-circle" size={20} color={colors.warning || '#FFA500'} />
      <Text style={[styles.bannerText, { color: colors.text }]}>
        Showing cached data. 
      </Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry}>
          <Text style={[styles.bannerLink, { color: colors.secondary }]}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  bannerText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  bannerLink: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default {
  ErrorView,
  NetworkError,
  EmptyState,
  NoAssignmentsState,
  CachedDataBanner,
};
