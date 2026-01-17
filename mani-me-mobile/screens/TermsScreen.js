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

export default function TermsScreen({ navigation }) {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
            Last Updated: December 27, 2025
          </Text>

          <Text style={[styles.intro, { color: colors.text }]}>
            Welcome to Mani Me. These Terms and Conditions govern your use of our parcel delivery services 
            between the UK and Ghana. By using our services, you agree to these terms.
          </Text>

          {/* Section 1 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Service Overview</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Mani Me provides parcel delivery services from the United Kingdom to Ghana. Our services include:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Door-to-door parcel collection and delivery
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Real-time tracking and notifications
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Customs clearance assistance
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Packaging materials shop
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • UK grocery shopping service for Ghana residents
          </Text>

          {/* Section 2 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. User Responsibilities</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            As a user of Mani Me services, you agree to:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Provide accurate and complete information for all bookings
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Ensure parcels do not contain prohibited items
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Package items securely to prevent damage during transit
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Pay all applicable fees and charges
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Be available at the specified pickup/delivery times
          </Text>

          {/* Section 3 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Prohibited Items</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            The following items are strictly prohibited from being shipped:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Illegal drugs and controlled substances
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Weapons, firearms, and ammunition
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Explosive and flammable materials
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Hazardous chemicals and toxic substances
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Counterfeit goods and pirated content
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Live animals and plants
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Perishable food items (unless using grocery service)
          </Text>

          {/* Section 4 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Pricing and Payment</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Shipping costs are calculated based on weight, dimensions, and service type
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • All prices are displayed in GBP (British Pounds)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Payment must be completed before parcel collection
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Additional customs duties and taxes may apply
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • We accept major credit cards, debit cards, and mobile money
          </Text>

          {/* Section 5 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Delivery Timeframes</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Standard delivery: 3-4 weeks from UK to Ghana
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Timeframes are estimates and may vary due to customs, weather, or other factors
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • We will notify you of any significant delays
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Delivery attempts: up to 3 attempts before parcel is returned
          </Text>

          {/* Section 6 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Liability and Insurance</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • All parcels are insured up to £500 by default
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Additional insurance can be purchased for high-value items
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Claims must be filed within 48 hours of delivery
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • We are not liable for delays caused by customs or force majeure
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Improperly packaged items may not be covered
          </Text>

          {/* Section 7 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Cancellations and Refunds</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Bookings can be cancelled before pickup for a full refund
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Cancellations after pickup are subject to a 20% processing fee
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Refunds are processed within 5-7 business days
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • No refunds for parcels already in transit
          </Text>

          {/* Section 8 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Customs and Duties</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            • Recipients are responsible for all customs duties and taxes
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • We provide customs documentation assistance
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Parcels may be inspected by customs authorities
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Customs clearance times vary and are beyond our control
          </Text>

          {/* Section 9 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>9. Privacy and Data Protection</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We collect and process personal data in accordance with our Privacy Policy. 
            Your data is used solely for service delivery and will not be shared with third parties 
            except as required for shipping and customs clearance.
          </Text>

          {/* Section 10 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>10. Changes to Terms</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We reserve the right to modify these Terms and Conditions at any time. 
            Changes will be effective immediately upon posting. Continued use of our services 
            constitutes acceptance of the updated terms.
          </Text>

          {/* Section 11 */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>11. Governing Law</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            These Terms and Conditions are governed by the laws of the United Kingdom and Ghana. 
            Any disputes will be resolved through arbitration in accordance with applicable laws.
          </Text>

          {/* Contact */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            For questions about these Terms and Conditions, please contact us:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Email: legal@manimeapp.com
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Phone: +44 7958 086887
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
            • Live Chat: Available in the app 24/7
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
