import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useThemeColors, SIZES, FONTS, SHADOWS } from '../constants/theme';

export default function ProfileScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { user, logout } = useUser();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.navigate('Login');
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <Text style={[styles.title, { color: colors.accent }]}>Profile</Text>
      </LinearGradient>

      <ScrollView style={styles.container}>
        {/* User Info Card */}
        <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="person" size={48} color={colors.secondary} />
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={20} color={colors.secondary} />
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Name</Text>
                <Text style={[styles.menuValue, { color: colors.text }]}>{user?.name || 'Not set'}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="mail-outline" size={20} color={colors.secondary} />
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.menuValue, { color: colors.text }]}>{user?.email || 'Not set'}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="call-outline" size={20} color={colors.secondary} />
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Phone</Text>
                <Text style={[styles.menuValue, { color: colors.text }]}>{user?.phone || 'Not set'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: '#EF4444' }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: SIZES.lg,
  },
  title: {
    fontSize: SIZES.h2,
    ...FONTS.bold,
  },
  container: {
    flex: 1,
    paddingHorizontal: SIZES.md,
  },
  userCard: {
    borderRadius: SIZES.radiusMd,
    padding: SIZES.xl,
    alignItems: 'center',
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
    ...SHADOWS.medium,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
  },
  userName: {
    fontSize: SIZES.h4,
    ...FONTS.bold,
    marginBottom: SIZES.xs,
  },
  userEmail: {
    fontSize: SIZES.body,
  },
  menuCard: {
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.md,
    ...SHADOWS.medium,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTextContainer: {
    marginLeft: SIZES.md,
    flex: 1,
  },
  menuLabel: {
    fontSize: SIZES.caption,
    ...FONTS.medium,
    marginBottom: SIZES.xs / 2,
  },
  menuValue: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.xl,
    marginBottom: SIZES.xxl,
    ...SHADOWS.medium,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: SIZES.h6,
    ...FONTS.semiBold,
    marginLeft: SIZES.sm,
  },
});
