// screens/CashReconciliationScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  Alert,
  FlatList
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../utils/firebase';
import { submitCashReconciliation } from '../utils/api';
import { useCashTracking } from '../context/CashTrackingContext';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

const COLORS = {
  deepNavy: '#071528',
  surface: '#0D2847',
  skyBlue: '#83C5FA',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
};

export default function CashReconciliationScreen({ navigation }) {
  const { totalCash, cashCount, cashPickups, clearCashPickups } = useCashTracking();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1 = Review, 2 = Photo, 3 = Confirm

  const pickImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setPhoto(result.assets[0].uri);
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    const userId = user?.id || user?._id;
    
    if (!userId) {
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      return;
    }

    if (totalCash <= 0) {
      Alert.alert('No Cash', 'There are no cash pickups to submit.');
      return;
    }

    if (!photo) {
      Alert.alert('Photo Required', 'Please take a photo of the cash/receipt first.');
      return;
    }

    setSubmitting(true);
    try {
      logger.log('Submitting cash reconciliation...', { userId, amount: totalCash });

      // Upload receipt photo to Firebase Storage
      const filename = `cash-receipts/${userId}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      const blob = await (await fetch(photo)).blob();
      await uploadBytes(storageRef, blob);
      const photoUrl = await getDownloadURL(storageRef);

      const response = await submitCashReconciliation({
        driver_id: userId,
        amount: totalCash,
        photoUrl,
        pickupCount: cashCount,
        pickups: cashPickups.map(p => ({ id: p.id, amount: p.amount, parcelId: p.parcelId })),
      });
      
      logger.log('Submission successful:', response.data);
      await clearCashPickups();
      
      setSubmitting(false);
      Alert.alert(
        '✅ Submitted Successfully',
        `Your cash report has been submitted.\n\nTotal: £${totalCash.toFixed(2)}\nPickups: ${cashCount}\n\nStatus: Pending Admin Review`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      logger.error('Submission error:', err);
      setSubmitting(false);
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Submission failed';
      Alert.alert('Submission Failed', errorMessage);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const renderPickupItem = ({ item, index }) => (
    <View style={styles.pickupItem}>
      <View style={styles.pickupLeft}>
        <View style={styles.pickupIndex}>
          <Text style={styles.pickupIndexText}>{index + 1}</Text>
        </View>
        <View>
          <Text style={styles.pickupAmount}>£{item.amount.toFixed(2)}</Text>
          <Text style={styles.pickupTime}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
      {item.parcelId && (
        <Text style={styles.pickupParcelId}>#{item.parcelId.slice(-6)}</Text>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="cash-remove" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Cash Pickups</Text>
      <Text style={styles.emptySubtitle}>
        You haven't recorded any cash pickups today.{'\n'}Cash payments will appear here automatically.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.deepNavy, COLORS.surface]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cash Handover</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>1</Text>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>2</Text>
          </View>
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>3</Text>
          </View>
        </View>
        <View style={styles.stepLabels}>
          <Text style={styles.stepLabel}>Review</Text>
          <Text style={styles.stepLabel}>Photo</Text>
          <Text style={styles.stepLabel}>Confirm</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <MaterialCommunityIcons name="cash-multiple" size={28} color={COLORS.success} />
            <Text style={styles.summaryTitle}>Cash to Hand Over</Text>
          </View>
          <Text style={styles.summaryAmount}>£{totalCash.toFixed(2)}</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Ionicons name="receipt-outline" size={18} color={COLORS.skyBlue} />
              <Text style={styles.summaryStatText}>{cashCount} pickup{cashCount !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.summaryStat}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.skyBlue} />
              <Text style={styles.summaryStatText}>Today</Text>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={COLORS.skyBlue} />
          <Text style={styles.infoBannerText}>
            Hand over this cash to the warehouse supervisor and take a photo of the receipt.
          </Text>
        </View>

        {/* Pickups List */}
        <Text style={styles.sectionTitle}>Breakdown</Text>
        {cashPickups.length > 0 ? (
          <View style={styles.pickupsList}>
            {cashPickups.map((item, index) => (
              <View key={item.id}>
                {renderPickupItem({ item, index })}
              </View>
            ))}
          </View>
        ) : (
          renderEmptyState()
        )}

        {/* Photo Section */}
        {cashCount > 0 && (
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Receipt Photo</Text>
            {photo ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: photo }} style={styles.photoPreview} />
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={pickImage}
                >
                  <Ionicons name="camera" size={18} color="#fff" />
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.photoButton}
                onPress={() => { setStep(2); pickImage(); }}
              >
                <Ionicons name="camera-outline" size={32} color={COLORS.skyBlue} />
                <Text style={styles.photoButtonText}>Take Receipt Photo</Text>
                <Text style={styles.photoButtonHint}>Photo of cash handover or supervisor signature</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      {cashCount > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!photo || submitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!photo || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.submitButtonText}>
                  Submit £{totalCash.toFixed(2)} Handover
                </Text>
              </>
            )}
          </TouchableOpacity>
          {!photo && (
            <Text style={styles.submitHint}>Take a photo to continue</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepNavy,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.skyBlue,
  },
  stepDotText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepLine: {
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: COLORS.skyBlue,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  stepLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(131, 197, 250, 0.2)',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginLeft: 10,
  },
  summaryAmount: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 20,
  },
  summaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryStatText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(131, 197, 250, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  infoBannerText: {
    color: COLORS.skyBlue,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  pickupsList: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  pickupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  pickupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickupIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(131, 197, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupIndexText: {
    color: COLORS.skyBlue,
    fontSize: 12,
    fontWeight: '600',
  },
  pickupAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickupTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  pickupParcelId: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  photoSection: {
    marginBottom: 20,
  },
  photoButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(131, 197, 250, 0.3)',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  photoButtonHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.deepNavy,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    paddingTop: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#3a4a5f',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  submitHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
