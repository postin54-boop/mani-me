import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CashTrackingProvider } from './context/CashTrackingContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { addNotificationReceivedListener, addNotificationResponseReceivedListener } from './utils/notifications';
import logger from './utils/logger';


import AnimatedSplash from './screens/AnimatedSplash';
import AuthStack from './navigation/AuthStack';
import HomeScreen from './screens/HomeScreen';
import UKPickupsScreen from './screens/UKPickupsScreen';
import GhanaDeliveriesScreen from './screens/GhanaDeliveriesScreen';
import ProfileScreen from './screens/ProfileScreen';
import MoreScreen from './screens/MoreScreen';
import CashReconciliationScreen from './screens/CashReconciliationScreen';
import RecordCashPickupScreen from './screens/RecordCashPickupScreen';
import WarehouseReturnScreen from './screens/WarehouseReturnScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ScanParcelScreen from './screens/ScanParcelScreen';
import PrintLabelsScreen from './screens/PrintLabelsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import AssignedJobsScreen from './screens/AssignedJobsScreen';
import JobDetailsScreen from './screens/JobDetailsScreen';
import ChatScreen from './screens/ChatScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import { useThemeColors } from './constants/theme';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { colors, isDark } = useThemeColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ShiftClock') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          // For ShiftClock, icon is handled in tabBarButton below
          if (route.name === 'ShiftClock') return null;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: 'transparent',
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 24,
          borderRadius: 28,
          height: 44,
          // No shadow, flat
          elevation: 0,
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      {/* ShiftClockScreen tab removed */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <AnimatedSplash
        onFinish={() => {
          setShowSplash(false);
          SplashScreen.hideAsync();
        }}
      />
    );
  }

  return (
    <AuthProvider>
      <CashTrackingProvider>
        <AppNavigator />
      </CashTrackingProvider>
    </AuthProvider>
  );
}

// Separate navigator component that has access to AuthContext
function AppNavigator() {
  const { user, loading } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Listen for notifications while app is in foreground
    notificationListener.current = addNotificationReceivedListener(notification => {
      logger.log('Driver received notification:', notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = addNotificationResponseReceivedListener(response => {
      logger.log('Driver notification response:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data.type === 'driver_pickup_assigned') {
        logger.nav('Pickup', { trackingNumber: data.trackingNumber });
      }
    });

    // Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1A33' }}>
        <ActivityIndicator size="large" color="#83C5FA" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="AssignedJobs" component={AssignedJobsScreen} />
            <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
            <Stack.Screen name="UKPickups" component={UKPickupsScreen} />
            <Stack.Screen name="GhanaDeliveries" component={GhanaDeliveriesScreen} />
            <Stack.Screen name="More" component={MoreScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="CashReconciliation" component={CashReconciliationScreen} />
            <Stack.Screen name="RecordCashPickup" component={RecordCashPickupScreen} />
            <Stack.Screen name="WarehouseReturn" component={WarehouseReturnScreen} />
            <Stack.Screen name="ScanParcelScreen" component={ScanParcelScreen} />
            <Stack.Screen name="PrintLabelsScreen" component={PrintLabelsScreen} />
            <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
            <Stack.Screen name="Documents" component={DocumentsScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
