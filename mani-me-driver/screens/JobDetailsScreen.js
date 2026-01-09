import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Linking, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_BASE_URL } from "../utils/config";

const BRAND = {
  primary: "#0B1A33",
  secondary: "#83C5FA",
  background: "#F9FAFB",
  card: "#FFFFFF",
  text: "#0B1A33",
  success: "#10B981",
  warning: "#F59E0B",
};

export default function JobDetailsScreen({ route, navigation }) {
  const { isUKDriver, token } = useAuth();
  
  // Get job from route params
  const job = route?.params?.job || {};
  
  // Determine driver type
  const isUK = isUKDriver?.() ?? true;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Flexible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Open maps
  const openMaps = (address) => {
    if (!address) return;
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    Linking.openURL(url);
  };

  // Call customer
  const callCustomer = (phone) => {
    if (!phone) {
      Alert.alert('No Phone Number', 'Phone number not available');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  // Dynamic workflow state
  const [ukSteps, setUkSteps] = useState([
    { key: "assigned", label: "Assigned", done: true },
    { key: "arrived", label: "Arrived at Pickup", done: false },
    { key: "intake", label: "Parcel Intake", done: false },
    { key: "paid", label: "Payment Confirmed", done: false },
    { key: "loaded", label: "Loaded to Van", done: false },
  ]);
  const [ghSteps, setGhSteps] = useState([
    { key: "assigned", label: "Assigned", done: true },
    { key: "scanned", label: "Parcel Scanned", done: false },
    { key: "delivered", label: "Delivered", done: false },
    { key: "proof", label: "Proof of Delivery", done: false },
  ]);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Map step keys to actual shipment statuses
  const stepToStatus = {
    arrived: 'driver_arrived',
    intake: 'parcel_received',
    paid: 'payment_confirmed',
    loaded: 'picked_up',
    scanned: 'parcel_scanned',
    delivered: 'delivered',
    proof: 'delivery_confirmed',
  };

  const markNextStep = async (steps, setSteps, stepKey, actionLabel) => {
    const idx = steps.findIndex(s => !s.done);
    if (idx !== -1 && steps[idx].key === stepKey) {
      setLoading(true);
      setSuccessMsg("");
      
      try {
        // Get the shipment ID
        const shipmentId = job._id || job.id;
        
        if (!shipmentId) {
          throw new Error('No shipment ID found');
        }

        // Map step to backend status
        const newStatus = stepToStatus[stepKey];
        
        if (newStatus) {
          // Call backend API to update shipment status
          await axios.put(
            `${API_BASE_URL}/api/shipments/${shipmentId}/status`,
            { status: newStatus },
            token ? { headers: { Authorization: `Bearer ${token}` } } : {}
          );
        }

        // Update local state on success
        const newSteps = steps.map((s, i) => i === idx ? { ...s, done: true } : s);
        setSteps(newSteps);
        setSuccessMsg(`${actionLabel} completed!`);
        setTimeout(() => setSuccessMsg(""), 1500);
      } catch (error) {
        console.error('Status update error:', error);
        Alert.alert(
          'Update Failed',
          error.response?.data?.message || error.message || 'Failed to update status. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const isStepEnabled = (steps, stepKey) => {
    const idx = steps.findIndex(s => s.key === stepKey);
    if (idx === 0) return true;
    return steps[idx - 1].done;
  };

  const isWorkflowComplete = (steps) => steps.every(s => s.done);

  // Get full address
  const getPickupAddress = () => {
    const parts = [job.pickup_address, job.pickup_city, job.pickup_postcode].filter(Boolean);
    return parts.join(', ') || job.address || 'Address not provided';
  };

  const getDeliveryAddress = () => {
    const parts = [job.delivery_address, job.delivery_city, job.delivery_region].filter(Boolean);
    return parts.join(', ') || job.ghana_destination || 'Ghana';
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={BRAND.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isUK ? 'Pickup Details' : 'Delivery Details'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: job.status === 'picked_up' || job.status === 'delivered' ? BRAND.success + '20' : BRAND.warning + '20' }]}>
            <Text style={[styles.statusText, { color: job.status === 'picked_up' || job.status === 'delivered' ? BRAND.success : BRAND.warning }]}>
              {job.status?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}
            </Text>
          </View>
        </View>

        {/* Parcel ID Card */}
        <View style={styles.card}>
          <View style={styles.parcelIdRow}>
            <View>
              <Text style={styles.parcelIdLabel}>PARCEL ID</Text>
              <Text style={styles.parcelId}>{job.parcelId || job.tracking_number || job.parcel_id_short || 'N/A'}</Text>
            </View>
            {job.qr_code_url && (
              <TouchableOpacity style={styles.qrBtn}>
                <Ionicons name="qr-code" size={28} color={BRAND.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sender Details (UK Pickup) */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={24} color={BRAND.secondary} />
            <Text style={styles.sectionTitle}>Sender Details</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={BRAND.text} />
            <Text style={styles.infoText}>{job.sender_name || job.customerName || 'N/A'}</Text>
          </View>
          
          <TouchableOpacity style={styles.infoRow} onPress={() => callCustomer(job.sender_phone)}>
            <Ionicons name="call-outline" size={18} color={BRAND.secondary} />
            <Text style={[styles.infoText, { color: BRAND.secondary }]}>{job.sender_phone || 'No phone'}</Text>
            <Ionicons name="chevron-forward" size={18} color={BRAND.secondary} />
          </TouchableOpacity>
          
          {job.sender_email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color={BRAND.text} />
              <Text style={styles.infoText}>{job.sender_email}</Text>
            </View>
          )}
        </View>

        {/* Pickup Address */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={24} color={BRAND.success} />
            <Text style={styles.sectionTitle}>Pickup Address</Text>
          </View>
          
          <Text style={styles.addressText}>{getPickupAddress()}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={BRAND.text} />
            <Text style={styles.infoText}>{formatDate(job.pickup_date)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={BRAND.text} />
            <Text style={styles.infoText}>{job.pickup_time || job.pickupTime || 'Flexible'}</Text>
          </View>
          
          <TouchableOpacity style={styles.actionBtn} onPress={() => openMaps(getPickupAddress())}>
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Parcel Details */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={24} color={BRAND.warning} />
            <Text style={styles.sectionTitle}>Parcel Details</Text>
          </View>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{job.parcel_description || job.parcel_type || 'General'}</Text>
            </View>
            {job.parcel_size && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Size</Text>
                <Text style={styles.detailValue}>{job.parcel_size}</Text>
              </View>
            )}
            {job.weight_kg && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{job.weight_kg} kg</Text>
              </View>
            )}
            {job.dimensions && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Dimensions</Text>
                <Text style={styles.detailValue}>{job.dimensions}</Text>
              </View>
            )}
          </View>
          
          {/* Parcel Image */}
          {job.parcel_image_url && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: job.parcel_image_url }} style={styles.parcelImage} />
            </View>
          )}
        </View>

        {/* Destination (Ghana) */}
        <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: BRAND.success }]}>
          <View style={styles.sectionHeader}>
            <Text style={{ fontSize: 24 }}>🇬🇭</Text>
            <Text style={styles.sectionTitle}>Destination - Ghana</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={BRAND.text} />
            <Text style={styles.infoText}>{job.receiver_name || job.receiverName || 'N/A'}</Text>
          </View>
          
          <TouchableOpacity style={styles.infoRow} onPress={() => callCustomer(job.receiver_phone)}>
            <Ionicons name="call-outline" size={18} color={BRAND.success} />
            <Text style={[styles.infoText, { color: BRAND.success }]}>{job.receiver_phone || 'No phone'}</Text>
            <Ionicons name="chevron-forward" size={18} color={BRAND.success} />
          </TouchableOpacity>
          
          <Text style={styles.addressText}>{getDeliveryAddress()}</Text>
        </View>

        {/* Special Instructions */}
        {job.special_instructions && (
          <View style={[styles.card, { backgroundColor: BRAND.warning + '10', borderWidth: 1, borderColor: BRAND.warning }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={24} color={BRAND.warning} />
              <Text style={[styles.sectionTitle, { color: BRAND.warning }]}>Special Instructions</Text>
            </View>
            <Text style={styles.instructionsText}>{job.special_instructions}</Text>
          </View>
        )}

        {/* Payment Info */}
        {job.payment_method && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name={job.payment_method === 'cash' ? 'cash' : 'card'} size={24} color={BRAND.primary} />
              <Text style={styles.sectionTitle}>Payment</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentMethod}>
                {job.payment_method === 'cash' ? '💷 Cash on Pickup' : '💳 Paid by Card'}
              </Text>
              {job.total_cost > 0 && (
                <Text style={styles.paymentAmount}>£{job.total_cost?.toFixed(2)}</Text>
              )}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('ChatScreen', {
              shipment_id: job.id || job._id,
              customer_name: job.sender_name || job.customerName,
              tracking_number: job.tracking_number || job.parcelId
            })}
          >
            <Ionicons name="chatbubble-outline" size={24} color={BRAND.secondary} />
            <Text style={styles.quickActionText}>Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => callCustomer(job.sender_phone)}
          >
            <Ionicons name="call-outline" size={24} color={BRAND.success} />
            <Text style={styles.quickActionText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => openMaps(getPickupAddress())}
          >
            <Ionicons name="navigate-outline" size={24} color={BRAND.primary} />
            <Text style={styles.quickActionText}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Workflow Steps */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Workflow Progress</Text>
          <View style={styles.stepsContainer}>
            {(isUK ? ukSteps : ghSteps).map((step, idx) => (
              <View key={step.key} style={styles.stepRow}>
                <View style={[styles.stepCircle, step.done && styles.stepCircleDone]}>
                  {step.done ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Text style={styles.stepNumber}>{idx + 1}</Text>
                  )}
                </View>
                {idx < (isUK ? ukSteps : ghSteps).length - 1 && (
                  <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
                )}
                <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>{step.label}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          {isUK ? (
            <>
              {!ukSteps[1].done && (
                <TouchableOpacity
                  style={[styles.workflowBtn, loading && { opacity: 0.5 }]}
                  disabled={loading}
                  onPress={() => markNextStep(ukSteps, setUkSteps, "arrived", "Arrived")}
                >
                  <Ionicons name="location" size={20} color="#fff" />
                  <Text style={styles.workflowBtnText}>Mark Arrived</Text>
                </TouchableOpacity>
              )}
              {ukSteps[1].done && !ukSteps[2].done && (
                <TouchableOpacity
                  style={[styles.workflowBtn, loading && { opacity: 0.5 }]}
                  disabled={loading}
                  onPress={() => markNextStep(ukSteps, setUkSteps, "intake", "Parcel Collected")}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.workflowBtnText}>Take Photo & Collect</Text>
                </TouchableOpacity>
              )}
              {ukSteps[2].done && !ukSteps[3].done && (
                <TouchableOpacity
                  style={[styles.workflowBtn, { backgroundColor: BRAND.success }, loading && { opacity: 0.5 }]}
                  disabled={loading}
                  onPress={() => markNextStep(ukSteps, setUkSteps, "paid", "Payment")}
                >
                  <Ionicons name="cash" size={20} color="#fff" />
                  <Text style={styles.workflowBtnText}>Confirm Payment</Text>
                </TouchableOpacity>
              )}
              {ukSteps[3].done && !ukSteps[4].done && (
                <TouchableOpacity
                  style={[styles.workflowBtn, loading && { opacity: 0.5 }]}
                  disabled={loading}
                  onPress={() => markNextStep(ukSteps, setUkSteps, "loaded", "Loading")}
                >
                  <Ionicons name="car" size={20} color="#fff" />
                  <Text style={styles.workflowBtnText}>Loaded to Van</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              {!ghSteps[1].done && (
                <TouchableOpacity
                  style={[styles.workflowBtn, loading && { opacity: 0.5 }]}
                  disabled={loading}
                  onPress={() => markNextStep(ghSteps, setGhSteps, "scanned", "Scan")}
                >
                  <Ionicons name="qr-code" size={20} color="#fff" />
                  <Text style={styles.workflowBtnText}>Scan Parcel</Text>
                </TouchableOpacity>
              )}
              {ghSteps[1].done && !ghSteps[2].done && (
                <TouchableOpacity
                  style={[styles.workflowBtn, loading && { opacity: 0.5 }]}
                  disabled={loading}
                  onPress={() => markNextStep(ghSteps, setGhSteps, "delivered", "Delivery")}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.workflowBtnText}>Mark Delivered</Text>
                </TouchableOpacity>
              )}
              {ghSteps[2].done && !ghSteps[3].done && (
                <TouchableOpacity
                  style={[styles.workflowBtn, { backgroundColor: BRAND.success }, loading && { opacity: 0.5 }]}
                  disabled={loading}
                  onPress={() => markNextStep(ghSteps, setGhSteps, "proof", "Proof")}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.workflowBtnText}>Upload Proof of Delivery</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {loading && <ActivityIndicator size="small" color={BRAND.secondary} style={{ marginTop: 12 }} />}
          {successMsg ? <Text style={styles.successMsg}>{successMsg}</Text> : null}

          {isWorkflowComplete(isUK ? ukSteps : ghSteps) && (
            <View style={styles.completionContainer}>
              <Ionicons name="checkmark-circle" size={48} color={BRAND.success} />
              <Text style={styles.completionText}>
                {isUK ? 'Pickup Complete!' : 'Delivery Complete!'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND.card,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: BRAND.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  parcelIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parcelIdLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 1,
  },
  parcelId: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.primary,
    marginTop: 4,
    letterSpacing: 1,
  },
  qrBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    color: BRAND.text,
    flex: 1,
  },
  addressText: {
    fontSize: 15,
    color: BRAND.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    backgroundColor: BRAND.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: BRAND.text,
    fontWeight: '600',
    marginTop: 2,
  },
  imageContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  parcelImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  instructionsText: {
    fontSize: 14,
    color: BRAND.text,
    lineHeight: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 15,
    color: BRAND.text,
    fontWeight: '600',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.success,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: BRAND.card,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: BRAND.text,
    fontWeight: '600',
  },
  stepsContainer: {
    marginTop: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepCircleDone: {
    backgroundColor: BRAND.success,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  stepLine: {
    position: 'absolute',
    left: 13,
    top: 28,
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
  },
  stepLineDone: {
    backgroundColor: BRAND.success,
  },
  stepLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  stepLabelDone: {
    color: BRAND.primary,
    fontWeight: '600',
  },
  workflowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primary,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 12,
    gap: 8,
  },
  workflowBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  successMsg: {
    color: BRAND.success,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  completionContainer: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 16,
  },
  completionText: {
    color: BRAND.success,
    fontWeight: '700',
    fontSize: 18,
    marginTop: 8,
  },
});
