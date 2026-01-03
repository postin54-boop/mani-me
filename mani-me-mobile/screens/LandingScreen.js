import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#0F2744', '#0B1E38', '#071A2C']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F2744" />
      
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Title Section */}
        <Animated.View
          style={[
            styles.titleSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Mani <Text style={styles.titleAccent}>Me</Text></Text>
          <Text style={styles.tagline}>Your Parcel, Our Priority</Text>
          <Text style={styles.subtitle}>
            Connecting the UK and Ghana with reliable, secure, and affordable parcel delivery
          </Text>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View
          style={[
            styles.statsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            </View>
            <Text style={styles.statValue}>99.8%</Text>
            <Text style={styles.statLabel}>Delivery Rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="flash" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>3-4</Text>
            <Text style={styles.statLabel}>Weeks Delivery</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(131, 197, 250, 0.15)' }]}>
              <Ionicons name="people" size={18} color="#83C5FA" />
            </View>
            <Text style={styles.statValue}>5K+</Text>
            <Text style={styles.statLabel}>Happy Users</Text>
          </View>
        </Animated.View>

        {/* Features Section */}
        <Animated.View
          style={[
            styles.featuresSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>What We Offer</Text>

          <FeatureCard
            icon="airplane"
            iconColor="#83C5FA"
            iconBg="rgba(131, 197, 250, 0.15)"
            title="Parcel Delivery"
            description="Send your parcels from the UK to Ghana with full tracking and insurance"
          />

          <FeatureCard
            icon="storefront"
            iconColor="#10B981"
            iconBg="rgba(16, 185, 129, 0.15)"
            title="UK Grocery Shop"
            description="Ghana residents can buy UK groceries and products - we ship them directly to you"
          />

          <FeatureCard
            icon="cube"
            iconColor="#F59E0B"
            iconBg="rgba(245, 158, 11, 0.15)"
            title="Packaging Materials"
            description="Buy quality boxes, tape, and materials for secure parcel packaging"
          />

          <FeatureCard
            icon="location"
            iconColor="#EC4899"
            iconBg="rgba(236, 72, 153, 0.15)"
            title="Real-Time Tracking"
            description="Track your parcel every step of the way with live updates and notifications"
          />
        </Animated.View>

        {/* Trust Badges */}
        <Animated.View
          style={[
            styles.trustSection,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <Text style={styles.trustText}>Secure & Insured</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="time" size={14} color="#83C5FA" />
            <Text style={styles.trustText}>24/7 Support</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.trustText}>Trusted Service</Text>
          </View>
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View
          style={[
            styles.ctaSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Register')}
          >
            <LinearGradient
              colors={['#83C5FA', '#5A8DFF']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#0B1A33" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryText}>Already have an account? <Text style={styles.secondaryAccent}>Log In</Text></Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function FeatureCard({ icon, iconColor, iconBg, title, description }) {
  return (
    <View style={styles.featureCard}>
      <LinearGradient
        colors={[iconBg, 'rgba(255,255,255,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureCardGradient}
      >
        <View style={[styles.featureIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureSub}>{description}</Text>
        </View>
        <View style={[styles.featureArrow, { backgroundColor: iconBg }]}>
          <Ionicons name="chevron-forward" size={14} color={iconColor} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(131, 197, 250, 0.2)',
  },
  logo: {
    width: 56,
    height: 56,
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: '#83C5FA',
  },
  tagline: {
    fontSize: 14,
    color: '#83C5FA',
    fontWeight: '600',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#9EB3D6',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    paddingHorizontal: 10,
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#9EB3D6',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 6,
  },

  // Features Section
  featuresSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureCard: {
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featureCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 11,
    color: '#9EB3D6',
    lineHeight: 16,
  },
  featureArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Trust Section
  trustSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9EB3D6',
  },

  // CTA Section
  ctaSection: {
    marginBottom: 16,
  },
  primaryBtn: {
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#83C5FA',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  primaryText: {
    color: '#0B1A33',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(131, 197, 250, 0.25)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  secondaryText: {
    color: '#9EB3D6',
    fontWeight: '500',
    fontSize: 13,
  },
  secondaryAccent: {
    color: '#83C5FA',
    fontWeight: '700',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 10,
    color: '#6B7A90',
    textAlign: 'center',
    lineHeight: 16,
  },
});
