import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
  Modal,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/theme';
import { fetchDriverAssignmentsPaginated, updateDeliveryStatus } from '../utils/optimizedApi';
import { useAuth } from '../context/AuthContext';

export default function GhanaDeliveriesScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { user } = useAuth();
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchDeliveries(1);
  }, []);

  const fetchDeliveries = async (pageNum = 1, append = false) => {
    if (!user?.id && !user?._id) {
      console.warn('No user ID available');
      setLoading(false);
      return;
    }

    try {
      const userId = user.id || user._id;
      const result = await fetchDriverAssignmentsPaginated(userId, 'delivery', pageNum, 20);
      
      // Extract shipments array from nested response structure
      let newDeliveries = [];
      if (result.data?.data?.shipments) {
        newDeliveries = result.data.data.shipments;
      } else if (result.data?.shipments) {
        newDeliveries = result.data.shipments;
      } else if (Array.isArray(result.data)) {
        newDeliveries = result.data;
      }
      
      if (append) {
        setDeliveries(prev => [...prev, ...newDeliveries]);
      } else {
        setDeliveries(newDeliveries);
      }
      
      setHasMore(newDeliveries.length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      Alert.alert('Error', 'Failed to load deliveries. Using offline mode.');
      
      // Fallback to mock data only on first load
      if (pageNum === 1) {
        setDeliveries([
          {
            id: 'DEL001',
            receiverName: 'Kwame Mensah',
            address: 'House 12, Airport Residential Area, Accra',
            phone: '+233 24 123 4567',
            parcelSize: 'Large Box (15kg)',
            deliveryNotes: 'Call before arrival, gate code: 1234',
            status: 'pending',
            arrivalDate: 'Nov 20, 2025',
          },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchDeliveries(1, false);
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !refreshing) {
      setLoadingMore(true);
      fetchDeliveries(page + 1, true);
    }
  }, [loadingMore, hasMore, refreshing, page]);

  const openMaps = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    Linking.openURL(url);
  };

  const callReceiver = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const chatReceiver = (deliveryId) => {
    console.log('Chat with receiver:', deliveryId);
  };

  const handleDeliveryProof = (delivery) => {
    setSelectedDelivery(delivery);
    setShowProofModal(true);
  };

  const handleFailedDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setShowFailModal(true);
  };

  const confirmDelivery = async () => {
    try {
      await updateDeliveryStatus(selectedDelivery.id, 'delivered', {
        proofType: 'signature',
        deliveredAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Delivery marked as completed');
      setShowProofModal(false);
      onRefresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to update delivery status');
    }
  };

  const reportFailedDelivery = async (reason) => {
    try {
      await updateDeliveryStatus(selectedDelivery.id, 'failed', {
        failReason: reason,
        attemptedAt: new Date().toISOString(),
      });
      Alert.alert('Reported', 'Delivery failure has been reported');
      setShowFailModal(false);
      onRefresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to report delivery failure');
    }
  };

  const renderDeliveryCard = ({ item: delivery }) => (
    <View
      style={[
        styles.deliveryCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.deliveryId, { color: colors.textSecondary }]}>
            {delivery.id}
          </Text>
          <Text style={[styles.receiverName, { color: colors.text }]}>
            {delivery.receiverName}
          </Text>
          <Text style={[styles.arrivalDate, { color: colors.secondary }]}>
            <Ionicons name="calendar-outline" size={14} /> Arrived: {delivery.arrivalDate}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                delivery.status === 'delivered'
                  ? colors.success + '20'
                  : colors.warning + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  delivery.status === 'delivered'
                    ? colors.success
                    : colors.warning,
              },
            ]}
          >
            {delivery.status === 'delivered' ? 'Delivered' : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Address */}
      <View style={styles.detailRow}>
        <Ionicons name="location" size={18} color={colors.secondary} />
        <Text style={[styles.detailText, { color: colors.text }]}>
          {delivery.address}
        </Text>
      </View>

      {/* Phone */}
      <View style={styles.detailRow}>
        <Ionicons name="call" size={18} color={colors.secondary} />
        <Text style={[styles.detailText, { color: colors.text }]}>
          {delivery.phone}
        </Text>
      </View>

      {/* Parcel Size */}
      <View style={styles.detailRow}>
        <Ionicons name="cube" size={18} color={colors.secondary} />
        <Text style={[styles.detailText, { color: colors.text }]}>
          {delivery.parcelSize}
        </Text>
      </View>

      {/* Delivery Notes */}
      {delivery.deliveryNotes && (
        <View style={[styles.notesBox, { backgroundColor: colors.info + '10', borderColor: colors.info }]}>
          <Ionicons name="information-circle" size={16} color={colors.info} />
          <Text style={[styles.notesText, { color: colors.text }]}>
            {delivery.deliveryNotes}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
          onPress={() => openMaps(delivery.address)}
        >
          <Ionicons name="navigate" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>
            Navigate
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => callReceiver(delivery.phone)}
        >
          <Ionicons name="call" size={20} color={colors.secondary} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            Call
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => chatReceiver(delivery.id)}
        >
          <Ionicons name="chatbubble" size={20} color={colors.secondary} />
          <Text style={[styles.actionText, { color: colors.text }]}>
            Chat
          </Text>
        </TouchableOpacity>
      </View>

      {/* Delivery Proof / Failed Buttons */}
      {delivery.status === 'pending' && (
        <View style={styles.proofActions}>
          <TouchableOpacity
            style={[styles.proofBtn, { backgroundColor: colors.success }]}
            onPress={() => handleDeliveryProof(delivery)}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.proofBtnText}>Deliver & Get Proof</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.failBtn, { backgroundColor: colors.error }]}
            onPress={() => handleFailedDelivery(delivery)}
          >
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.failBtnText}>Failed Delivery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 16 }]}>
            Loading deliveries...
          </Text>
        </View>
      );
    }
    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <Ionicons name="cube-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 16 }]}>
          No deliveries found
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Ghana Deliveries - Today
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.secondary + '20' }]}> 
          <Text style={[styles.badgeText, { color: colors.secondary }]}> 
            {deliveries.filter(d => d.status === 'pending').length} Pending
          </Text>
        </View>
      </View>

      {/* FlatList */}
      <FlatList
        data={deliveries}
        renderItem={renderDeliveryCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={5}
      />

      {/* Delivery Proof Modal */}
      <Modal
        visible={showProofModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProofModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Delivery Proof
              </Text>
              <TouchableOpacity onPress={() => setShowProofModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {selectedDelivery?.id} - {selectedDelivery?.receiverName}
            </Text>

            <TouchableOpacity style={[styles.photoBtn, { backgroundColor: colors.secondary }]}>
              <Ionicons name="camera" size={48} color={colors.primary} />
              <Text style={[styles.photoBtnText, { color: colors.primary }]}>
                Take Photo of Parcel
              </Text>
            </TouchableOpacity>

            <View style={[styles.signatureBox, { borderColor: colors.border }]}>
              <Text style={[styles.signatureLabel, { color: colors.textSecondary }]}>
                Receiver Signature
              </Text>
              <Text style={[styles.signaturePlaceholder, { color: colors.textSecondary }]}>
                (Tap to collect signature)
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.success }]}
              onPress={confirmDelivery}
            >
              <Text style={styles.confirmBtnText}>Confirm Delivery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Failed Delivery Modal */}
      <Modal
        visible={showFailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Failed Delivery
              </Text>
              <TouchableOpacity onPress={() => setShowFailModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {selectedDelivery?.id} - {selectedDelivery?.receiverName}
            </Text>

            <Text style={[styles.reasonLabel, { color: colors.text }]}>
              Reason for failure:
            </Text>

            <TouchableOpacity 
              style={[styles.reasonBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => reportFailedDelivery('Customer Not Home')}
            >
              <Ionicons name="home-outline" size={20} color={colors.text} />
              <Text style={[styles.reasonText, { color: colors.text }]}>
                Customer Not Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.reasonBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => reportFailedDelivery('Phone Unreachable')}
            >
              <Ionicons name="call-outline" size={20} color={colors.text} />
              <Text style={[styles.reasonText, { color: colors.text }]}>
                Phone Unreachable
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.reasonBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={20} color={colors.text} />
              <Text style={[styles.reasonText, { color: colors.text }]}>
                Requested Reschedule
              </Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Additional notes..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.error }]}
              onPress={() => setShowFailModal(false)}
            >
              <Text style={styles.confirmBtnText}>Submit Failed Delivery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  deliveryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deliveryId: {
    fontSize: 12,
    marginBottom: 4,
  },
  receiverName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  arrivalDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  notesBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  notesText: {
    fontSize: 13,
    flex: 1,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  proofActions: {
    marginTop: 12,
    gap: 8,
  },
  proofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  proofBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  failBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  failBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  photoBtn: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginBottom: 24,
  },
  photoBtnText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  signatureBox: {
    height: 150,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  signaturePlaceholder: {
    fontSize: 14,
  },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  reasonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  reasonText: {
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
});
