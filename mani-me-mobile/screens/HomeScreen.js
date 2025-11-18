import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { user } = useUser();
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.primary}
      />
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
        <Text style={[styles.greeting, { color: colors.accent }]}>Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!</Text>
        <Text style={[styles.title, { color: colors.accent }]}>UK to Ghana Deliveries</Text>
        <Text style={[styles.subtitle, { color: colors.accent + 'CC' }]}>Fast, Secure, and Reliable</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Book Pickup Card - Primary Action */}
        <TouchableOpacity 
          style={[styles.primaryCard, { backgroundColor: colors.primary }, SHADOWS.large]}
          onPress={() => navigation.navigate('Booking')}
          activeOpacity={0.9}
        >
          <View style={styles.primaryCardContent}>
            <View style={[styles.primaryCardIcon, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="cube" size={40} color={colors.secondary} />
            </View>
            <View style={styles.primaryCardText}>
              <Text style={[styles.primaryCardTitle, { color: colors.accent }]}>Book a Pickup</Text>
              <Text style={[styles.primaryCardDescription, { color: colors.accent + 'CC' }]}>
                Send parcels to Ghana from anywhere in the UK
              </Text>
            </View>
            <View style={[styles.primaryCardArrow, { backgroundColor: colors.secondary }]}>
              <Ionicons name="arrow-forward" size={24} color={colors.accent} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <View style={styles.actionsGrid}>
          {/* Track Parcel Card */}
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="location" size={28} color={colors.secondary} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Track Parcels</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>View & track deliveries</Text>
          </TouchableOpacity>

          {/* Shop Card (Coming Soon) */}
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.surface, opacity: 0.7 }]}
            onPress={() => alert("Shop feature coming soon!\n\nGhanians in Ghana will be able to order UK groceries and products.")}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.textLight + '20' }]}>
              <Ionicons name="cart" size={28} color={colors.textLight} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Shop</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>Order UK products</Text>
            <View style={[styles.comingSoonBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.comingSoonText, { color: colors.accent }]}>SOON</Text>
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
              <Text style={[styles.featureText, { color: colors.text }]}>Fast & Reliable</Text>
              <Text style={[styles.featureSubtext, { color: colors.textSecondary }]}>Express UK-Ghana shipping</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="location" size={24} color={colors.secondary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureText, { color: colors.text }]}>Real-time Tracking</Text>
              <Text style={[styles.featureSubtext, { color: colors.textSecondary }]}>Track every step</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="card" size={24} color={colors.secondary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureText, { color: colors.text }]}>Flexible Payment</Text>
              <Text style={[styles.featureSubtext, { color: colors.textSecondary }]}>Card or cash on pickup</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="home" size={24} color={colors.secondary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureText, { color: colors.text }]}>Door-to-Door</Text>
              <Text style={[styles.featureSubtext, { color: colors.textSecondary }]}>We pickup & deliver</Text>
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
  },
  header: {
    paddingTop: SIZES.xxl + SIZES.lg,
    paddingBottom: SIZES.xl,
    paddingHorizontal: SIZES.lg,
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: SIZES.radiusMd,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.sm,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  greeting: {
    fontSize: SIZES.body,
    ...FONTS.medium,
    marginBottom: SIZES.xs,
  },
  title: {
    fontSize: SIZES.h2,
    ...FONTS.bold,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.bodySmall,
    ...FONTS.regular,
  },
  content: {
    padding: SIZES.md,
  },
  primaryCard: {
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.lg,
    overflow: 'hidden',
  },
  primaryCardContent: {
    padding: SIZES.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryCardIcon: {
    width: 64,
    height: 64,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  primaryCardText: {
    flex: 1,
  },
  primaryCardTitle: {
    fontSize: SIZES.h4,
    ...FONTS.bold,
    marginBottom: SIZES.xs,
  },
  primaryCardDescription: {
    fontSize: SIZES.bodySmall,
    ...FONTS.regular,
  },
  primaryCardArrow: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusMd,
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
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginHorizontal: SIZES.xs,
    ...SHADOWS.medium,
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
    marginBottom: SIZES.xs,
  },
  actionDescription: {
    fontSize: SIZES.caption,
    lineHeight: 16,
    ...FONTS.regular,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
  },
  comingSoonText: {
    fontSize: 10,
    ...FONTS.bold,
  },
  featuresSection: {
    borderRadius: SIZES.radiusMd,
    padding: SIZES.lg,
    ...SHADOWS.small,
  },
  featuresTitle: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
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
    marginBottom: SIZES.xs,
  },
  featureSubtext: {
    fontSize: SIZES.bodySmall,
    ...FONTS.regular,
  },
});
