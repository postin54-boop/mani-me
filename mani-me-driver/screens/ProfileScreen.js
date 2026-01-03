import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { user, logout, driverType, role } = useAuth();
  const [isOnline, setIsOnline] = React.useState(true);

  // Get initials from user name
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get driver type display
  const getDriverTypeDisplay = () => {
    if (role === 'UK_DRIVER' || driverType === 'pickup') return 'UK Pickup Driver';
    if (role === 'GH_DRIVER' || driverType === 'delivery') return 'Ghana Delivery Driver';
    return 'Driver';
  };

  const profile = {
    name: user?.fullName || user?.name || 'Driver',
    phone: user?.phone || 'Not provided',
    email: user?.email || 'Not provided',
    vehicle: user?.vehicle_number || 'Not assigned',
    driverId: user?.id || user?._id || 'N/A',
    driverType: getDriverTypeDisplay(),
    isVerified: user?.is_verified || false,
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Personal Info', value: profile.name, editable: true },
    { icon: 'call-outline', label: 'Phone', value: profile.phone },
    { icon: 'mail-outline', label: 'Email', value: profile.email },
    { icon: 'car-outline', label: 'Vehicle', value: profile.vehicle },
    { icon: 'briefcase-outline', label: 'Driver Type', value: profile.driverType },
  ];

  const settingsItems = [
    { icon: 'notifications-outline', label: 'Notifications', hasToggle: true, key: 'notifications' },
    { icon: 'location-outline', label: 'Location Services', hasToggle: true, key: 'location' },
    { icon: 'document-text-outline', label: 'Documents', screen: 'Documents' },
    { icon: 'help-circle-outline', label: 'Help & Support', screen: 'HelpSupport' },
    { icon: 'shield-checkmark-outline', label: 'Privacy Policy', screen: 'PrivacyPolicy' },
  ];

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);

  const handleSettingPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  const handleToggle = (key, value) => {
    if (key === 'notifications') {
      setNotificationsEnabled(value);
    } else if (key === 'location') {
      setLocationEnabled(value);
    }
  };

  const getToggleValue = (key) => {
    if (key === 'notifications') return notificationsEnabled;
    if (key === 'location') return locationEnabled;
    return true;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : [colors.primary, '#0d2440']}
        style={styles.header}
      >
        <View style={[styles.profileCard, { borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.04)', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 }]}> 
          <View style={[styles.avatar, { backgroundColor: colors.secondary, borderRadius: 24, width: 88, height: 88 }]}> 
            <Text style={[styles.avatarText, { color: colors.primary, fontSize: 36, fontWeight: '800' }]}>
              {getInitials(profile.name)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={{ color: colors.accent, fontSize: 28, fontWeight: '800', letterSpacing: -1 }}>
              {profile.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: colors.accent, opacity: 0.8, fontSize: 16, fontWeight: '600' }}>
                ID: {profile.driverId.toString().slice(-6)}
              </Text>
              {profile.isVerified && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
                    Verified
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ color: colors.accent, opacity: 0.7, fontSize: 14, fontWeight: '600' }}>
              {profile.driverType}
            </Text>
          </View>
        </View>

        <View style={[styles.statusCard, { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 18, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 }]}> 
          <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '700' }}>Status</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '700', marginRight: 8 }}>{isOnline ? 'Online' : 'Offline'}</Text>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: '#767577', true: colors.secondary }}
              thumbColor={colors.accent}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Details */}
        <View style={styles.section}> 
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 20, letterSpacing: -0.5 }}>Profile Details</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 }]}
              onPress={item.editable ? () => navigation.navigate('EditProfile', { profile }) : undefined}
              activeOpacity={item.editable ? 0.8 : 1}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary + '20', borderRadius: 12, width: 48, height: 48 }]}> 
                <Ionicons name={item.icon} size={28} color={colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 2 }}>{item.label}</Text>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{item.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.section}> 
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 20, letterSpacing: -0.5 }}>Settings</Text>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.surface, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 }]}
              onPress={() => handleSettingPress(item)}
              activeOpacity={item.hasToggle ? 1 : 0.8}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary + '20', borderRadius: 12, width: 48, height: 48 }]}> 
                <Ionicons name={item.icon} size={28} color={colors.secondary} />
              </View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', flex: 1, marginLeft: 16 }}>{item.label}</Text>
              {item.hasToggle ? (
                <Switch
                  value={getToggleValue(item.key)}
                  onValueChange={(value) => handleToggle(item.key, value)}
                  trackColor={{ false: '#767577', true: colors.secondary }}
                  thumbColor={colors.accent}
                />
              ) : (
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View style={styles.section}> 
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 }]}
            onPress={async () => {
              await logout();
              navigation.replace('Login');
            }}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.accent} style={{ marginRight: 10 }} />
            <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '700' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  trips: {
    fontSize: 14,
    marginLeft: 4,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  menuValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
