import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useThemeColors, SIZES, FONTS, SHADOWS } from '../constants/theme';

export default function MoreScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { user, logout } = useUser();

  const openURL = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', `Cannot open URL: ${url}`);
    }
  };

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

  const menuSections = [
    {
      title: 'Shopping',
      items: [
        {
          icon: 'cube-outline',
          label: 'Packaging Shop',
          subtitle: 'Buy boxes & materials',
          onPress: () => navigation.navigate('PackagingShopScreen'),
          color: '#F59E0B',
        },
        {
          icon: 'cart-outline',
          label: 'Grocery Shop',
          subtitle: 'Send groceries to Ghana',
          onPress: () => navigation.navigate('GroceryShop'),
          color: '#10B981',
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'location-outline',
          label: 'Saved Addresses',
          subtitle: 'Manage delivery locations',
          onPress: () => navigation.navigate('SavedAddressesScreen'),
          color: '#8B5CF6',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'Help & Support',
          subtitle: 'Get help with your orders',
          onPress: () => navigation.navigate('HelpSupport'),
          color: '#06B6D4',
        },
        {
          icon: 'document-text-outline',
          label: 'Terms & Conditions',
          subtitle: 'Read our policies',
          onPress: () => navigation.navigate('Terms'),
          color: '#6366F1',
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Privacy Policy',
          subtitle: 'How we handle your data',
          onPress: () => navigation.navigate('Privacy'),
          color: '#14B8A6',
        },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.accent }]}>More</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <TouchableOpacity
          style={[styles.userCard, { backgroundColor: colors.surface }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={[styles.avatarContainer, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="person" size={32} color={colors.secondary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
          </View>
        </TouchableOpacity>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      itemIndex < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                    ]}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                        <Ionicons name={item.icon} size={22} color={item.color} />
                      </View>
                      <View style={styles.menuTextContainer}>
                        <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                        <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: '#EF4444' }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: SIZES.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: SIZES.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
    ...SHADOWS.medium,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
    marginBottom: SIZES.xs / 2,
  },
  userEmail: {
    fontSize: SIZES.body,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.bodySmall,
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SIZES.sm,
    marginLeft: SIZES.xs,
  },
  menuCard: {
    borderRadius: SIZES.radiusMd,
    ...SHADOWS.medium,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: SIZES.bodySmall,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    marginVertical: 8,
    ...SHADOWS.medium,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
