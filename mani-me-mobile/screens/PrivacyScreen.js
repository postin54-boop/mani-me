import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/theme';

export default function PrivacyScreen({ navigation }) {
  const { colors } = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
            Last Updated: December 27, 2025
          </Text>

          <Text style={[styles.intro, { color: colors.text }]}>
            At Mani Me, we are committed to protecting your privacy and personal data. 
            This Privacy Policy explains how we collect, use, store, and protect your information 
            when you use our parcel delivery services.
          </Text>

          {/* Section 1 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Information We Collect</Text>
          
          <Text style={[styles.subheading, { color: colors.text }]}>Personal Information</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            When you create an account or book a parcel, we collect:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Full name and contact details (phone, email)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Pickup and delivery addresses
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Payment information (processed securely via Stripe)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Identification documents (for customs clearance)
          </Text>

          <Text style={[styles.subheading, { color: colors.text }]}>Usage Data</Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Device information (type, OS, app version)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • IP address and location data
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • App usage patterns and interactions
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Tracking and notification preferences
          </Text>

          {/* Section 2 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. How We Use Your Information</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We use your personal data to:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Process and deliver your parcels
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Send real-time tracking updates and notifications
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Process payments and issue receipts
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Provide customer support
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Handle customs documentation
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Improve our services and user experience
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Send promotional offers (with your consent)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Comply with legal obligations
          </Text>

          {/* Section 3 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Data Sharing and Disclosure</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We share your data only when necessary:
          </Text>

          <Text style={[styles.subheading, { color: colors.text }]}>Service Partners</Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Delivery drivers and warehouse staff (to fulfill orders)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Payment processors (Stripe) - encrypted and secure
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Shipping carriers and logistics partners
          </Text>

          <Text style={[styles.subheading, { color: colors.text }]}>Legal Requirements</Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Customs authorities (for clearance purposes)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Law enforcement (when required by law)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Regulatory bodies (compliance purposes)
          </Text>

          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We do NOT sell your personal data to third parties for marketing purposes.
          </Text>

          {/* Section 4 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Data Storage and Security</Text>
          
          <Text style={[styles.subheading, { color: colors.text }]}>Security Measures</Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • End-to-end encryption for sensitive data
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Secure cloud storage (Firebase, MongoDB)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Regular security audits and updates
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Two-factor authentication options
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Access controls and employee training
          </Text>

          <Text style={[styles.subheading, { color: colors.text }]}>Data Retention</Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Account data: retained while your account is active
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Transaction records: 7 years (legal requirement)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Support chat logs: 2 years
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Marketing data: until you opt-out
          </Text>

          {/* Section 5 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Your Privacy Rights</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Under GDPR and UK data protection laws, you have the right to:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Access: Request a copy of your personal data
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Rectification: Correct inaccurate or incomplete data
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Erasure: Request deletion of your data ("right to be forgotten")
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Portability: Receive your data in a machine-readable format
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Object: Opt-out of marketing communications
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Restriction: Limit how we use your data
          </Text>

          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            To exercise these rights, contact us at privacy@manimeapp.com or through the app's settings.
          </Text>

          {/* Section 6 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Cookies and Tracking</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We use cookies and similar technologies to:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Keep you logged in
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Remember your preferences
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Analyze app usage (Google Analytics, Firebase)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Improve app performance
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            You can manage tracking preferences in your device settings.
          </Text>

          {/* Section 7 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Children's Privacy</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Our services are not intended for users under 18 years of age. We do not knowingly 
            collect data from children. If we discover we have collected data from a minor, 
            we will delete it immediately.
          </Text>

          {/* Section 8 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>8. International Data Transfers</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Your data may be transferred and processed in the UK, Ghana, or other countries where 
            our service providers operate. We ensure adequate protection through:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Standard contractual clauses (EU-approved)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Adequacy decisions by regulatory bodies
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Encryption during transfer
          </Text>

          {/* Section 9 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>9. Push Notifications</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We use push notifications to send delivery updates and important alerts. 
            You can manage notification preferences in your device settings or the app's 
            notification settings.
          </Text>

          {/* Section 10 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>10. Changes to This Policy</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We may update this Privacy Policy periodically. Changes will be posted here with 
            an updated "Last Modified" date. Significant changes will be communicated via email 
            or app notification.
          </Text>

          {/* Contact */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            For privacy-related questions or to exercise your rights:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Email: privacy@manimeapp.com
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Data Protection Officer: dpo@manimeapp.com
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Phone: +44 20 1234 5678
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Live Chat: Available in the app 24/7
          </Text>

          <Text style={[styles.paragraph, { color: colors.textSecondary, marginTop: 16 }]}>
            You also have the right to lodge a complaint with the UK Information Commissioner's 
            Office (ICO) if you believe we have mishandled your data.
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    paddingBottom: 32,
  },
  lastUpdated: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    marginLeft: 8,
  },
});
