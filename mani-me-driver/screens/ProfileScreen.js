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

export default function ProfileScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const [isOnline, setIsOnline] = React.useState(true);

  const menuItems = [
    { icon: 'person-outline', label: 'Personal Info', value: 'John Doe' },
    { icon: 'call-outline', label: 'Phone', value: '+234 801 234 5678' },
    { icon: 'mail-outline', label: 'Email', value: 'driver@manime.com' },
    { icon: 'car-outline', label: 'Vehicle', value: 'Honda Civic - ABC 123 XY' },
  ];

  const settingsItems = [
    { icon: 'notifications-outline', label: 'Notifications', hasToggle: true },
    { icon: 'location-outline', label: 'Location Services', hasToggle: true },
    { icon: 'document-text-outline', label: 'Documents' },
    { icon: 'help-circle-outline', label: 'Help & Support' },
    { icon: 'shield-checkmark-outline', label: 'Privacy Policy' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : [colors.primary, '#0d2440']}
        style={styles.header}
      >
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>JD</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.accent }]}>John Doe</Text>
            <Text style={[styles.role, { color: colors.accent, opacity: 0.8 }]}>
              Driver ID: DRV001
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FCD34D" />
              <Text style={[styles.rating, { color: colors.accent }]}>4.8</Text>
              <Text style={[styles.trips, { color: colors.accent, opacity: 0.8 }]}>
                (234 trips)
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.statusCard, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <Text style={[styles.statusLabel, { color: colors.accent }]}>
            Status
          </Text>
          <View style={styles.statusToggle}>
            <Text style={[styles.statusText, { color: colors.accent }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Profile Details
          </Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.surface }]}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name={item.icon} size={20} color={colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>
                  {item.label}
                </Text>
                <Text style={[styles.menuValue, { color: colors.text }]}>
                  {item.value}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Settings
          </Text>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.surface }]}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name={item.icon} size={20} color={colors.secondary} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {item.label}
              </Text>
              {item.hasToggle ? (
                <Switch
                  value={true}
                  trackColor={{ false: '#767577', true: colors.secondary }}
                  thumbColor={colors.accent}
                />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={() => navigation.replace('Login')}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.accent} />
            <Text style={[styles.logoutText, { color: colors.accent }]}>
              Logout
            </Text>
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
