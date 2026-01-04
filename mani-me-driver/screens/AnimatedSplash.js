import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Text, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function AnimatedSplash({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoFade = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(30)).current;
  const badgeFade = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Main animation sequence
    Animated.sequence([
      // Logo fade in and scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Text slide up
      Animated.parallel([
        Animated.timing(textSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(badgeFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Wait
      Animated.delay(1000),
      // Fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      pulse.stop();
      onFinish();
    });

    return () => pulse.stop();
  }, []);

  return (
    <LinearGradient
      colors={['#0B1A33', '#071A2C', '#051525']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B1A33" />
      
      {/* Background decorative circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo with glow effect */}
        <Animated.View style={[
          styles.logoWrapper,
          { 
            opacity: logoFade,
            transform: [{ scale: pulseAnim }]
          }
        ]}>
          <View style={styles.logoGlow} />
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Text */}
        <Animated.View style={[
          styles.textContainer,
          {
            opacity: logoFade,
            transform: [{ translateY: textSlide }]
          }
        ]}>
          <Text style={styles.brandName}>Mani Me</Text>
          <View style={styles.driverBadge}>
            <Ionicons name="car-sport" size={16} color="#83C5FA" />
            <Text style={styles.driverText}>DRIVER</Text>
          </View>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[
          styles.tagline,
          { opacity: badgeFade }
        ]}>
          Delivering trust, one parcel at a time
        </Animated.Text>
      </Animated.View>

      {/* Bottom branding */}
      <Animated.View style={[styles.bottom, { opacity: badgeFade }]}>
        <Text style={styles.bottomText}>UK to Ghana Delivery</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    top: -height * 0.2,
    right: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(131, 197, 250, 0.03)',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -height * 0.15,
    left: -width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(131, 197, 250, 0.02)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(131, 197, 250, 0.15)',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 28,
  },
  textContainer: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  driverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(131, 197, 250, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  driverText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#83C5FA',
    letterSpacing: 3,
  },
  tagline: {
    marginTop: 32,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  bottom: {
    position: 'absolute',
    bottom: 60,
  },
  bottomText: {
    fontSize: 13,
    color: 'rgba(131, 197, 250, 0.5)',
    fontWeight: '500',
    letterSpacing: 1,
  },
});
