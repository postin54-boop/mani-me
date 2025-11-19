import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

export default function AnimatedSplash({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simple elegant fade-in like Revolut/Wise
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      // Hold for a moment then finish
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, 800);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1A33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
});
