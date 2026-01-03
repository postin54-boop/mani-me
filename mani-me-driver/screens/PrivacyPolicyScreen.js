import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../constants/theme';

export default function PrivacyPolicyScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();

  const sections = [
    {
      title: 'Information We Collect',
      content: `We collect information you provide directly to us, including:
• Personal information (name, email, phone number)
• Location data when you're on duty
• Vehicle information
• Delivery performance data
• Device information and push notification tokens`,
    },
    {
      title: 'How We Use Your Information',
      content: `We use the information we collect to:
• Assign and manage deliveries
• Track delivery progress and provide real-time updates
• Process payments and generate earnings reports
• Communicate with you about jobs and updates
• Improve our services and driver experience
• Ensure safety and security of all users`,
    },
    {
      title: 'Location Data',
      content: `We collect your location data only when:
• You are logged in and on duty
• You are actively completing a delivery
• You have enabled location services

You can disable location services in your device settings, but this may affect your ability to receive and complete deliveries.`,
    },
    {
      title: 'Data Sharing',
      content: `We may share your information with:
• Customers (limited to delivery-related information)
• Mani Me staff for support purposes
• Service providers who assist our operations
• Law enforcement when required by law

We never sell your personal information to third parties.`,
    },
    {
      title: 'Data Security',
      content: `We implement appropriate security measures to protect your information:
• Encryption of data in transit and at rest
• Secure authentication protocols
• Regular security audits
• Limited access to personal information`,
    },
    {
      title: 'Your Rights',
      content: `You have the right to:
• Access your personal information
• Request correction of inaccurate data
• Request deletion of your account
• Opt out of non-essential communications

Contact us at privacy@manime.com to exercise these rights.`,
    },
    {
      title: 'Contact Us',
      content: `If you have questions about this Privacy Policy, please contact:

Mani Me Ltd
Email: privacy@manime.com
Phone: +44 123 456 7890`,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : [colors.primary, '#0d2440']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.accent }]}>Privacy Policy</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Ionicons name="shield-checkmark" size={48} color={colors.secondary} />
          <Text style={[styles.introTitle, { color: colors.text }]}>Your Privacy Matters</Text>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            Last updated: December 2025
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {section.content}
            </Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            By using the Mani Me Driver app, you agree to this Privacy Policy.
          </Text>
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
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  intro: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  introText: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
