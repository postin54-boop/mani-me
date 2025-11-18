import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.header}
      >
        <Text style={styles.title}>Mani Me</Text>
        <Text style={styles.subtitle}>UK to Ghana Parcel Delivery</Text>
        <View style={styles.headerIconsContainer}>
          <View style={styles.headerIconBadge}>
            <Ionicons name="airplane" size={24} color={COLORS.surface} />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Book Pickup Card - Primary Action */}
        <TouchableOpacity 
          style={styles.primaryCard}
          onPress={() => navigation.navigate('Booking')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.success, COLORS.secondaryLight]}
            style={styles.primaryCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.primaryCardIcon}>
              <Ionicons name="cube-outline" size={40} color={COLORS.surface} />
            </View>
            <Text style={styles.primaryCardTitle}>Book Pickup</Text>
            <Text style={styles.primaryCardDescription}>
              Send parcels to Ghana from anywhere in the UK
            </Text>
            <View style={styles.primaryCardArrow}>
              <Ionicons name="arrow-forward" size={24} color={COLORS.surface} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <View style={styles.actionsGrid}>
          {/* Track Parcel Card */}
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.info + '15' }]}>
              <Ionicons name="location-outline" size={28} color={COLORS.info} />
            </View>
            <Text style={styles.actionTitle}>Track Parcels</Text>
            <Text style={styles.actionDescription}>View & track deliveries</Text>
          </TouchableOpacity>

          {/* Shop Card (Coming Soon) */}
          <TouchableOpacity 
            style={[styles.actionCard, styles.actionCardDisabled]}
            onPress={() => alert("Shop feature coming soon!\n\nGhanians in Ghana will be able to order UK groceries and products.")}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="cart-outline" size={28} color={COLORS.warning} />
            </View>
            <Text style={styles.actionTitle}>Shop</Text>
            <Text style={styles.actionDescription}>Order UK products</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>SOON</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Why Choose Mani Me?</Text>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="rocket" size={24} color={COLORS.success} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Fast & Reliable Delivery</Text>
              <Text style={styles.featureSubtext}>Express shipping UK-Ghana</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.info + '15' }]}>
              <Ionicons name="location" size={24} color={COLORS.info} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Real-time Tracking</Text>
              <Text style={styles.featureSubtext}>Track every step of the way</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="card" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Flexible Payment</Text>
              <Text style={styles.featureSubtext}>Pay by card or cash on pickup</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="home" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Door-to-Door Service</Text>
              <Text style={styles.featureSubtext}>We pickup and deliver</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: SIZES.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.h1,
    ...FONTS.bold,
    color: COLORS.surface,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SIZES.md,
  },
  headerIconsContainer: {
    marginTop: SIZES.sm,
  },
  headerIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SIZES.md,
    marginTop: -20,
  },
  primaryCard: {
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    marginBottom: SIZES.lg,
    ...SHADOWS.large,
  },
  primaryCardGradient: {
    padding: SIZES.xl,
    alignItems: 'center',
  },
  primaryCardIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
  },
  primaryCardTitle: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    color: COLORS.surface,
    marginBottom: SIZES.sm,
  },
  primaryCardDescription: {
    fontSize: SIZES.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  primaryCardArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginHorizontal: SIZES.xs,
    ...SHADOWS.medium,
  },
  actionCardDisabled: {
    opacity: 0.8,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  actionTitle: {
    fontSize: SIZES.h6,
    ...FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  actionDescription: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    backgroundColor: COLORS.warning,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  comingSoonText: {
    color: COLORS.surface,
    fontSize: 10,
    ...FONTS.bold,
  },
  featuresSection: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.lg,
    ...SHADOWS.small,
  },
  featuresTitle: {
    fontSize: SIZES.h4,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  featureContent: {
    flex: 1,
  },
  featureText: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  featureSubtext: {
    fontSize: SIZES.bodySmall,
    color: COLORS.textSecondary,
  },
});
