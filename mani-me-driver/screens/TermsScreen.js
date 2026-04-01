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

export default function TermsScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();

  const sections = [
    {
      title: '1. Service Overview',
      content: `Mani Me provides parcel delivery services from the UK to Ghana. As a driver, you are an independent contractor who picks up parcels from customers and delivers them to our designated locations or directly to recipients.`,
    },
    {
      title: '2. Driver Responsibilities',
      content: `As a Mani Me driver, you agree to:
• Complete pickups and deliveries in a timely manner
• Handle all parcels with care to prevent damage
• Maintain accurate records of all pickups
• Follow all traffic laws and regulations
• Keep your vehicle clean and presentable
• Maintain valid insurance and driving license
• Communicate professionally with customers`,
    },
    {
      title: '3. Conduct Standards',
      content: `You must maintain professional conduct at all times:
• Treat all customers with respect and courtesy
• Never open or tamper with parcels
• Do not consume alcohol or drugs while on duty
• Dress appropriately and maintain hygiene
• Respond promptly to app notifications
• Report any issues or incidents immediately`,
    },
    {
      title: '4. Payment Terms',
      content: `• Earnings are calculated based on completed deliveries
• Payments are processed weekly/monthly as agreed
• Cash collected must be remitted promptly
• Tips from customers are yours to keep
• Deductions may apply for damaged or lost parcels
• Payment disputes must be raised within 7 days`,
    },
    {
      title: '5. Insurance & Liability',
      content: `• You must maintain valid vehicle insurance
• Mani Me provides basic parcel coverage
• You are liable for damage caused by negligence
• Report all accidents immediately
• Claims must be filed within 24 hours
• Fraudulent claims will result in termination`,
    },
    {
      title: '6. Account Termination',
      content: `Your account may be suspended or terminated for:
• Violation of these terms
• Customer complaints
• Failure to complete assigned pickups
• Fraudulent activity
• Criminal behavior
• Extended inactivity without notice`,
    },
    {
      title: '7. Communication',
      content: `By using this app, you consent to receive:
• Push notifications for new pickups
• SMS for urgent communications
• Email updates and announcements
• In-app messages from support

You can manage notification preferences in Settings.`,
    },
    {
      title: '8. Governing Law',
      content: `These Terms are governed by the laws of England and Wales. Any disputes will be resolved in the courts of England and Wales.`,
    },
    {
      title: '9. Contact Us',
      content: `For questions about these Terms:

Mani Me Ltd
Email: manimeappinfo@gmail.com
Phone: +44 7958 086887
WhatsApp: +44 7958 086887`,
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
          <Text style={[styles.headerTitle, { color: colors.accent }]}>Terms & Conditions</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Ionicons name="document-text" size={48} color={colors.secondary} />
          <Text style={[styles.introTitle, { color: colors.text }]}>Driver Terms of Service</Text>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            Last updated: January 2026
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
            By using the Mani Me Driver app, you agree to these terms and conditions.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
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
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  intro: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
  },
  introText: {
    fontSize: 12,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
