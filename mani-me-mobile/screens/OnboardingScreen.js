import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar,
  Animated 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'Welcome to Mani Me',
    description: 'Send parcels from the UK to Ghana with ease. Fast, reliable, and affordable delivery service.',
    icon: 'cube-send',
    iconType: 'material',
    accentColor: '#83C5FA',
  },
  {
    key: '2',
    title: 'Real-Time Tracking',
    description: 'Track your parcels every step of the way. Get instant updates from pickup to delivery.',
    icon: 'location',
    iconType: 'ionicon',
    accentColor: '#10B981',
  },
  {
    key: '3',
    title: 'Door-to-Door Service',
    description: 'We pick up from your door in the UK and deliver right to your recipient in Ghana.',
    icon: 'truck-delivery',
    iconType: 'material',
    accentColor: '#F59E0B',
  },
  {
    key: '4',
    title: 'Shop & Ship',
    description: 'Buy groceries and supplies online. We\'ll deliver them with your parcels.',
    icon: 'cart',
    iconType: 'ionicon',
    accentColor: '#EC4899',
  },
];

export default function OnboardingScreen({ navigation }) {
  const flatListRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { 
      useNativeDriver: false,
      listener: (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
      }
    }
  );

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (e) {
      console.log('Error saving onboarding state:', e);
    }
    navigation.replace('Landing');
  };

  const renderIcon = (item) => {
    const IconComponent = item.iconType === 'material' ? MaterialCommunityIcons : Ionicons;
    return (
      <View style={[styles.iconContainer, { backgroundColor: item.accentColor + '20' }]}>
        <IconComponent name={item.icon} size={80} color={item.accentColor} />
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.iconWrapper, { transform: [{ scale }], opacity }]}>
          {renderIcon(item)}
        </Animated.View>
        <Animated.Text style={[styles.title, { opacity }]}>{item.title}</Animated.Text>
        <Animated.Text style={[styles.description, { opacity }]}>{item.description}</Animated.Text>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.pagination}>
        {slides.map((slide, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 28, 10],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { 
                  width: dotWidth, 
                  opacity: dotOpacity,
                  backgroundColor: slide.accentColor,
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#0B1A33', '#071A2C']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B1A33" />
      
      {/* Skip Button */}
      <TouchableOpacity 
        style={[styles.skipButton, { top: insets.top + 16 }]} 
        onPress={handleSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
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
        bounces={false}
        contentContainerStyle={styles.flatListContent}
      />

      {/* Pagination Dots */}
      {renderDots()}

      {/* Bottom Buttons */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 24 }]}>
        {currentIndex === slides.length - 1 ? (
          <TouchableOpacity 
            style={styles.getStartedButton} 
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#0B1A33" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-forward" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#83C5FA',
    letterSpacing: 0.5,
  },
  flatListContent: {
    alignItems: 'center',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: height * 0.15,
  },
  iconWrapper: {
    marginBottom: 48,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#9EB3D6',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: height * 0.22,
    alignSelf: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  nextButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#204080',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#204080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#83C5FA',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    gap: 8,
    shadowColor: '#83C5FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1A33',
    letterSpacing: 0.5,
  },
});
