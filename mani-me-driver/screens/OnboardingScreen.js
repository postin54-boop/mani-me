
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors, SIZES, FONTS } from '../constants/theme';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'Welcome Driver',
    description: 'Get more deliveries and manage your shifts easily with Mani Me.',
    image: require('../assets/onboarding1.png'),
  },
  {
    key: '2',
    title: 'Track & Earn',
    description: 'Track your earnings and deliveries in real time.',
    image: require('../assets/onboarding2.png'),
  },
  {
    key: '3',
    title: 'Shift Management',
    description: 'Clock in and out, and get notified of new assignments instantly.',
    image: require('../assets/onboarding3.png'),
  },
];

export default function OnboardingScreen({ navigation }) {
  const flatListRef = useRef();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const { colors, isDark } = useThemeColors();

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <Text style={[styles.title, { color: colors.secondary }]}>{item.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={[colors.gradientEnd, colors.gradientStart]}
      style={styles.container}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: colors.textInverse }]}>Skip</Text>
      </TouchableOpacity>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flexGrow: 0 }}
      />
      <View style={styles.pagination}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, currentIndex === i && { backgroundColor: colors.secondary, width: 32 }]} />
        ))}
      </View>
      <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.secondary }]} onPress={handleNext}>
        <Ionicons name="arrow-forward" size={28} color={colors.accent} />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  skipButton: {
    position: 'absolute',
    top: 48,
    right: 32,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 32,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
    margin: 6,
    transition: 'width 0.2s',
  },
  nextButton: {
    position: 'absolute',
    bottom: 36,
    right: 36,
    borderRadius: 32,
    padding: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
});
