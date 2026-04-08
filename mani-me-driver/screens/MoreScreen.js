import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function MoreScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { isUKDriver } = useAuth();
  const insets = useSafeAreaInsets();
  const isUK = isUKDriver();

  const sections = [
    {
      title: 'Operations',
      items: [
        ...(isUK ? [
          { icon: 'car-outline', label: 'My Pickups', screen: 'UKPickups', color: '#83C5FA' },
          { icon: 'cash-outline', label: 'Record Cash Pickup', screen: 'RecordCashPickup', color: '#10B981' },
          { icon: 'calculator-outline', label: 'Cash Reconciliation', screen: 'CashReconciliation', color: '#F59E0B' },
          { icon: 'business-outline', label: 'Warehouse Return', screen: 'WarehouseReturn', color: '#8B5CF6' },
        ] : [
          { icon: 'bicycle-outline', label: 'My Deliveries', screen: 'GhanaDeliveries', color: '#83C5FA' },
        ]),
        { icon: 'qr-code-outline', label: 'Scan Parcel', screen: 'ScanParcelScreen', color: '#EC4899' },
        { icon: 'print-outline', label: 'Print Labels', screen: 'PrintLabelsScreen', color: '#3B82F6' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'notifications-outline', label: 'Notifications', screen: 'NotificationsScreen', color: '#F59E0B' },
        { icon: 'logo-whatsapp', label: 'Support Chat', url: 'https://wa.me/447958086887?text=Hi%2C%20I%27m%20a%20Mani%20Me%20driver%20and%20need%20assistance', color: '#25D366' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'document-text-outline', label: 'My Documents', screen: 'Documents', color: '#8B5CF6' },
        { icon: 'help-circle-outline', label: 'Help & Support', screen: 'HelpSupport', color: '#3B82F6' },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', url: 'https://manime.co.uk/privacy', color: '#6B7280' },
        { icon: 'document-lock-outline', label: 'Terms & Conditions', url: 'https://manime.co.uk/terms', color: '#6B7280' },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1A33" />

      <LinearGradient colors={['#0B1A33', '#0d2440']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>More</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title.toUpperCase()}</Text>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.screen || item.url}
                  style={[
                    styles.row,
                    index < section.items.length - 1 && [styles.rowBorder, { borderBottomColor: colors.border || '#E5E7EB' }],
                  ]}
                  onPress={() => item.url ? Linking.openURL(item.url) : navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  card: { borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
  },
  rowBorder: { borderBottomWidth: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 15, fontWeight: '600' },
});
