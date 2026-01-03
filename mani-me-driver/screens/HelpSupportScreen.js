import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../constants/theme';

export default function HelpSupportScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();

  const faqItems = [
    {
      question: 'How do I accept a delivery?',
      answer: 'Go to the Home screen and tap on any available job. Review the details and tap "Accept Job" to confirm.',
    },
    {
      question: 'How do I scan a parcel?',
      answer: 'Tap the scan button on the Home screen or Job Details. Point your camera at the QR code on the parcel label.',
    },
    {
      question: 'What if a customer is not available?',
      answer: 'Try calling the customer using the phone button. If unreachable, mark the delivery as "Customer Unavailable" and follow the return procedure.',
    },
    {
      question: 'How do I report a problem with a delivery?',
      answer: 'Go to Job Details and tap "Report Issue". Select the issue type and provide details. Our support team will assist you.',
    },
    {
      question: 'How do I update my vehicle information?',
      answer: 'Go to Profile > Personal Info and update your vehicle number. Changes will be reviewed by the admin.',
    },
  ];

  const contactOptions = [
    {
      icon: 'call-outline',
      label: 'Call Support',
      value: '+44 123 456 7890',
      action: () => Linking.openURL('tel:+441234567890'),
    },
    {
      icon: 'mail-outline',
      label: 'Email Support',
      value: 'drivers@manime.com',
      action: () => Linking.openURL('mailto:drivers@manime.com'),
    },
    {
      icon: 'logo-whatsapp',
      label: 'WhatsApp',
      value: '+44 123 456 7890',
      action: () => Linking.openURL('https://wa.me/441234567890'),
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
          <Text style={[styles.headerTitle, { color: colors.accent }]}>Help & Support</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
          {contactOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.contactCard, { backgroundColor: colors.surface }]}
              onPress={option.action}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name={option.icon} size={24} color={colors.secondary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>{option.label}</Text>
                <Text style={[styles.contactValue, { color: colors.text }]}>{option.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          {faqItems.map((item, index) => (
            <View key={index} style={[styles.faqCard, { backgroundColor: colors.surface }]}>
              <View style={styles.faqQuestion}>
                <Ionicons name="help-circle" size={20} color={colors.secondary} />
                <Text style={[styles.questionText, { color: colors.text }]}>{item.question}</Text>
              </View>
              <Text style={[styles.answerText, { color: colors.textSecondary }]}>{item.answer}</Text>
            </View>
          ))}
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Mani Me Driver App v1.0.0
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
  section: {
    padding: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  faqCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 28,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 12,
  },
});
