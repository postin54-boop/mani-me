import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProvider, useUser } from './context/UserContext';
import { UnifiedCartProvider } from './context/UnifiedCartContext';
import { registerForPushNotificationsAsync, updatePushToken } from './utils/notifications';
import { getColors } from './constants/theme';
import logger from './utils/logger';

// Keep splash screen visible while we load
SplashScreen.preventAutoHideAsync();

// Get Stripe key from environment - ensure it's properly configured
const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey || 
  process.env.EXPO_PUBLIC_STRIPE_KEY || 
  '';

if (__DEV__) {
  logger.log('App initialized with environment:', Constants.expoConfig?.extra?.environment);
  if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.length < 20) {
    logger.warn('Warning: Stripe publishable key may not be properly configured');
  }
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

import AnimatedSplash from './screens/AnimatedSplash';
import PackagingShopScreen from './screens/PackagingShopScreen';
import PackagingPaymentScreen from './screens/PackagingPaymentScreen';
import RecentParcelScreen from './screens/RecentParcelScreen';
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/loginscreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import OrdersScreen from './screens/OrdersScreen';
import ProfileScreen from './screens/ProfileScreen';
import MoreScreen from './screens/MoreScreen';
import BookingScreen from './screens/BookingScreen';
import ReceiverDetailsScreen from './screens/ReceiverDetailsScreen';
import TrackingScreen from './screens/TrackingScreen';
import TrackingSearchScreen from './screens/TrackingSearchScreen';
import PaymentScreen from './screens/PaymentScreen';
import PaymentConfirmationScreen from './screens/PaymentConfirmationScreen';
import ChatScreen from './screens/ChatScreen';
import ShopScreen from './screens/ShopScreen';
import ShopCartScreen from './screens/ShopCartScreen';
import ShopCheckoutScreen from './screens/ShopCheckoutScreen';
import GroceryShopScreen from './screens/GroceryShopScreen';
import GroceryPaymentScreen from './screens/GroceryPaymentScreen';
import QRCodeScreen from './screens/QRCodeScreen';
import ForgotPassword from './screens/ForgotPassword';
import SavedAddressesScreen from './screens/SavedAddressesScreen';
import ConnectionTest from './screens/ConnectionTest';
import HelpSupportScreen from './screens/HelpSupportScreen';
import TermsScreen from './screens/TermsScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ErrorBoundary from './components/ErrorBoundary';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme === 'dark');
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Track') {
            iconName = focused ? 'location' : 'location-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          paddingHorizontal: 0,
          height: 65 + insets.bottom,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{ tabBarLabel: 'My Parcels' }}
      />
      <Tab.Screen 
        name="Track" 
        component={TrackingSearchScreen}
        options={{ tabBarLabel: 'Track Parcel' }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user } = useUser();
  const notificationListener = useRef();
  const responseListener = useRef();
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    // Check if user has seen onboarding
    const checkOnboarding = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        setInitialRoute(hasSeenOnboarding === 'true' ? 'Landing' : 'Onboarding');
      } catch (e) {
        setInitialRoute('Onboarding');
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    // Register for push notifications when user logs in
    if (user?.id) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          updatePushToken(user.id, token);
        }
      });

      // Listen for notifications while app is running
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        logger.log('Notification received:', notification);
      });

      // Listen for user tapping on notification
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        logger.log('Notification tapped:', response);
        // You can navigate to tracking screen here if needed
      });

      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      };
    }
  }, [user?.id]);

  // Wait for initial route to be determined
  if (!initialRoute) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ConnectionTest" component={ConnectionTest} />
        <Stack.Screen name="Home" component={TabNavigator} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="More" component={MoreScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="ReceiverDetails" component={ReceiverDetailsScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="PaymentConfirmation" component={PaymentConfirmationScreen} />
        <Stack.Screen name="Tracking" component={TrackingScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Shop" component={ShopScreen} />
        <Stack.Screen name="ShopCart" component={ShopCartScreen} />
        <Stack.Screen name="ShopCheckout" component={ShopCheckoutScreen} />
        <Stack.Screen name="GroceryShop" component={GroceryShopScreen} />
        <Stack.Screen name="GroceryPayment" component={GroceryPaymentScreen} />
        <Stack.Screen name="PackagingShopScreen" component={PackagingShopScreen} />
        <Stack.Screen name="PackagingPayment" component={PackagingPaymentScreen} />
        <Stack.Screen name="QRCode" component={QRCodeScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="RecentParcelScreen" component={RecentParcelScreen} />
        <Stack.Screen name="SavedAddressesScreen" component={SavedAddressesScreen} options={{ title: 'Saved Addresses' }} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide the native splash screen
    SplashScreen.hideAsync();
  }, []);

  if (showSplash) {
    return <AnimatedSplash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <UnifiedCartProvider>
            <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
              <UserProvider>
                <AppNavigator />
              </UserProvider>
            </StripeProvider>
          </UnifiedCartProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
