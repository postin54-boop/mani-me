import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { useThemeColors } from '../constants/theme';

/**
 * Error state component with retry functionality
 * 
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onRetry - Retry callback function
 * @param {string} props.icon - Ionicons icon name (default: 'cloud-offline')
 * @param {string} props.retryText - Retry button text (default: 'Try Again')
 */
export default function ErrorRetry({ 
  message = 'Something went wrong', 
  onRetry, 
  icon = 'cloud-offline',
  retryText = 'Try Again',
  style
}) {
  const { colors } = useThemeColors();

  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={48} color={colors.textSecondary} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" style={styles.retryIcon} />
          <Text style={styles.retryText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Inline error with retry - smaller version for inline use
 */
export function InlineError({ message, onRetry }) {
  const { colors } = useThemeColors();

  return (
    <View style={styles.inlineContainer}>
      <Ionicons name="warning-outline" size={20} color={colors.error} />
      <Text style={[styles.inlineMessage, { color: colors.error }]} numberOfLines={2}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.inlineRetry}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Empty state component
 */
export function EmptyState({ 
  message = 'No items found', 
  icon = 'cube-outline',
  actionText,
  onAction,
  style
}) {
  const { colors } = useThemeColors();

  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={64} color={colors.textLight} />
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {actionText && onAction && (
        <TouchableOpacity 
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Network error specific component
 */
export function NetworkError({ onRetry }) {
  return (
    <ErrorRetry
      icon="wifi-outline"
      message="No internet connection. Please check your network and try again."
      onRetry={onRetry}
      retryText="Retry"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginVertical: 8,
  },
  inlineMessage: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  inlineRetry: {
    padding: 8,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
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
});

// PropTypes
ErrorRetry.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func,
  icon: PropTypes.string,
  retryText: PropTypes.string,
  style: PropTypes.object,
};

InlineError.propTypes = {
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
};

EmptyState.propTypes = {
  message: PropTypes.string.isRequired,
  icon: PropTypes.string,
  actionText: PropTypes.string,
  onAction: PropTypes.func,
  style: PropTypes.object,
};

NetworkError.propTypes = {
  onRetry: PropTypes.func,
};
