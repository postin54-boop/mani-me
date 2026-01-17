import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/theme';

export default function HelpSupportScreen({ navigation }) {
  const { colors } = useThemeColors();

  const openURL = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const FAQItem = ({ question, answer }) => {
    const [expanded, setExpanded] = React.useState(false);
    
    return (
      <TouchableOpacity
        style={[styles.faqItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <Text style={[styles.faqQuestion, { color: colors.text }]}>{question}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.primary}
          />
        </View>
        {expanded && (
          <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{answer}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const ContactOption = ({ icon, title, subtitle, onPress, color }) => (
    <TouchableOpacity
      style={[styles.contactOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
          
          <ContactOption
            icon="chatbubble-ellipses"
            title="Live Chat"
            subtitle="Chat with our support team"
            color="#10B981"
            onPress={() => navigation.navigate('Chat', { 
              shipment_id: null, 
              driver_name: 'Support Team', 
              tracking_number: null 
            })}
          />
          
          <ContactOption
            icon="mail"
            title="Email Support"
            subtitle="support@manimeapp.com"
            color="#3B82F6"
            onPress={() => openURL('mailto:support@manimeapp.com')}
          />
          
          <ContactOption
            icon="call"
            title="Phone Support"
            subtitle="+44 7958 086887"
            color="#8B5CF6"
            onPress={() => openURL('tel:+447958086887')}
          />
          
          <ContactOption
            icon="logo-whatsapp"
            title="WhatsApp"
            subtitle="Message us on WhatsApp"
            color="#25D366"
            onPress={() => openURL('https://wa.me/447958086887')}
          />
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          
          <FAQItem
            question="How long does delivery take?"
            answer="Delivery from the UK to Ghana typically takes 3-4 weeks. You'll receive tracking updates throughout the journey."
          />
          
          <FAQItem
            question="How do I track my parcel?"
            answer="You can track your parcel using the tracking number provided. Go to the Tracking tab and enter your tracking number, or view all your parcels in the Orders tab."
          />
          
          <FAQItem
            question="What items can I send?"
            answer="You can send most personal items including clothing, electronics, books, and non-perishable food items. Prohibited items include hazardous materials, weapons, and illegal substances."
          />
          
          <FAQItem
            question="How is shipping cost calculated?"
            answer="Shipping costs are calculated based on the weight and dimensions of your parcel. We offer competitive rates with transparent pricing - no hidden fees."
          />
          
          <FAQItem
            question="Can I change my delivery address?"
            answer="Yes, you can change the delivery address before the parcel is dispatched from the UK. Contact our support team through live chat or email."
          />
          
          <FAQItem
            question="What if my parcel is damaged?"
            answer="All parcels are insured. If your parcel arrives damaged, please report it within 48 hours with photos. We'll process your claim and provide compensation."
          />
          
          <FAQItem
            question="How do I cancel my booking?"
            answer="You can cancel your booking before pickup. Go to your Orders, select the parcel, and tap 'Cancel Booking'. Refunds are processed within 5-7 business days."
          />
          
          <FAQItem
            question="Do you offer customs clearance assistance?"
            answer="Yes, we handle all customs documentation and clearance. Our team will contact you if any additional information is needed."
          />
        </View>

        {/* Quick Links */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>More Information</Text>
          
          <TouchableOpacity
            style={[styles.linkItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Terms')}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.text }]}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.linkItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Privacy')}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 13,
  },
  faqItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
});
