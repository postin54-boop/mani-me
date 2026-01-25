import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text, Dimensions, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Brand Colors - Consistent across apps
const COLORS = {
  deepNavy: '#0B1F33',      // Primary background - premium, secure
  skyBlue: '#6EC1FF',       // Brand name color
  softGrey: '#8BA3B8',      // Tagline color - subtle, calm
  white: '#FFFFFF',         // Logo "M" color
  logoCircle: '#0D2847',    // Slightly lighter navy for logo circle
};

export default function AnimatedSplash({ onFinish }) {
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Stage 1: Logo fades in with gentle slide up and scale
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Stage 2: Brand name fades in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        // Stage 3: Driver badge and tagline fade in
        Animated.parallel([
          Animated.timing(badgeOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });

    // Loading dots animation (loops)
    const animateDots = () => {
      const dotSequence = Animated.sequence([
        Animated.timing(dot1Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(dot1Opacity, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(dot2Opacity, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(dot3Opacity, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        ]),
      ]);
      dotSequence.start(() => animateDots());
    };
    
    // Start dots after a delay
    const dotsTimer = setTimeout(animateDots, 800);

    // Finish splash after 2.5 seconds (increased for better visibility)
    const finishTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(badgeOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(taglineOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onFinish());
    }, 2500);

    return () => {
      clearTimeout(dotsTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.deepNavy} />
      
      {/* Main content centered */}
      <View style={styles.content}>
        {/* Circular Logo */}
        <Animated.View
          style={[
            styles.logoCircle,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoTranslateY },
              ],
            },
          ]}
        >
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Name */}
        <Animated.Text style={[styles.brandName, { opacity: textOpacity }]}>
          Mani Me
        </Animated.Text>

        {/* Driver Badge */}
        <Animated.View style={[styles.driverBadge, { opacity: badgeOpacity }]}>
          <Ionicons name="car-sport" size={16} color={COLORS.skyBlue} />
          <Text style={styles.driverText}>DRIVER</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Your Parcel, Our Priority
        </Animated.Text>

        {/* Loading Dots */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: width * 0.38,
    height: width * 0.38,
    borderRadius: width * 0.19,
    backgroundColor: COLORS.logoCircle,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    // Subtle border for definition
    borderWidth: 2,
    borderColor: 'rgba(110, 193, 255, 0.15)',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    marginTop: 24,
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.skyBlue,
    letterSpacing: 1,
  },
  driverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(110, 193, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginTop: 12,
  },
  driverText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.skyBlue,
    letterSpacing: 3,
  },
  tagline: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.softGrey,
    letterSpacing: 1.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.skyBlue,
  },
});
