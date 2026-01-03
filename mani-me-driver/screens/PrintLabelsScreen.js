import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from 'react-native-qrcode-svg';

export default function PrintLabelsScreen({ navigation }) {
  const [parcelId, setParcelId] = useState('');
  const [printing, setPrinting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);

  // Mock pickups - in production, fetch from API
  const [recentPickups] = useState([
    { 
      id: 'MM-839201', 
      sender: 'John Smith', 
      pickupAddress: '45 High Street, London, W1A 1AA',
      destination: 'Accra', 
      receiverName: 'Kwame Mensah',
      status: 'picked_up' 
    },
    { 
      id: 'MM-839202', 
      sender: 'Sarah Johnson', 
      pickupAddress: '12 Park Lane, Manchester, M1 4BT',
      destination: 'Kumasi', 
      receiverName: 'Abena Owusu',
      status: 'picked_up' 
    },
    { 
      id: 'MM-839203', 
      sender: 'David Brown', 
      pickupAddress: '78 Queen\'s Road, Birmingham, B5 4AA',
      destination: 'Takoradi', 
      receiverName: 'Kofi Asante',
      status: 'picked_up' 
    },
  ]);

  const handlePrintLabel = (parcel) => {
    // Show preview with QR code before printing
    setSelectedParcel(parcel);
    setPreviewVisible(true);
  };

  const confirmPrint = () => {
    setPrinting(true);
    setPreviewVisible(false);
    
    // TODO: Send to printer with QR code
    // Label format: Parcel ID + QR Code + Pickup Address + Destination + Receiver
    setTimeout(() => {
      setPrinting(false);
      Alert.alert(
        'Label Printed Successfully',
        `Label with QR code sent to printer!\n\nParcel: ${selectedParcel.id}\nPickup: ${selectedParcel.pickupAddress || 'UK Address'}\nDestination: ${selectedParcel.destination}`,
        [{ text: 'OK' }]
      );
      setSelectedParcel(null);
    }, 1500);
  };

  const handleScanAndPrint = () => {
    if (!parcelId.trim()) {
      Alert.alert('Error', 'Please enter a parcel ID');
      return;
    }

    // TODO: Verify parcel exists in system and fetch details
    Alert.alert(
      'Print Label with QR Code',
      `Ready to print label for ${parcelId}?\n\nLabel will include QR code for Ghana driver scanning.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Print', 
          onPress: () => {
            handlePrintLabel({ 
              id: parcelId, 
              sender: 'Customer', 
              pickupAddress: 'UK Address',
              destination: 'Ghana',
              receiverName: 'Receiver'
            });
            setParcelId('');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#0B1A33" />
      </TouchableOpacity>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="print" size={56} color="#83C5FA" />
          <Text style={styles.title}>Print Labels</Text>
          <Text style={styles.subtitle}>Print shipping labels with QR codes for picked up parcels</Text>
        </View>

        {/* Manual Entry */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter Parcel ID</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="MM-XXXXXX"
              value={parcelId}
              onChangeText={setParcelId}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => navigation.navigate('ScanParcelScreen', { returnScreen: 'PrintLabelsScreen' })}
            >
              <Ionicons name="qr-code" size={24} color="#83C5FA" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.printButton}
            onPress={handleScanAndPrint}
            disabled={printing || !parcelId.trim()}
          >
            <Ionicons name="print" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.printButtonText}>
              {printing ? 'Printing...' : 'Print Label'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Pickups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Pickups</Text>
          {recentPickups.map((parcel) => (
            <TouchableOpacity 
              key={parcel.id}
              style={styles.parcelCard}
              onPress={() => handlePrintLabel(parcel)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.parcelId}>{parcel.id}</Text>
                <Text style={styles.parcelSender}>Pickup: {parcel.pickupAddress}</Text>
                <Text style={styles.parcelDestination}>→ {parcel.destination} ({parcel.receiverName})</Text>
              </View>
              <View style={styles.printIconContainer}>
                <Ionicons name="print-outline" size={28} color="#83C5FA" />
                <Ionicons name="qr-code" size={16} color="#10B981" style={{ position: 'absolute', bottom: 2, right: 2 }} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>Label with QR Code</Text>
            <Text style={styles.infoText}>
              Each label includes a QR code for Ghana drivers to scan during delivery. Ensure printer is connected.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Label Preview Modal with QR Code */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Label Preview</Text>
            
            {selectedParcel && (
              <View style={styles.labelPreview}>
                {/* QR Code */}
                <View style={styles.qrContainer}>
                  <QRCode
                    value={selectedParcel.id}
                    size={120}
                    backgroundColor="white"
                  />
                </View>

                {/* Parcel Details */}
                <View style={styles.labelDetails}>
                  <Text style={styles.labelId}>{selectedParcel.id}</Text>
                  
                  <View style={styles.labelSection}>
                    <Text style={styles.labelSectionTitle}>PICKUP ADDRESS (UK)</Text>
                    <Text style={styles.labelSectionText}>{selectedParcel.pickupAddress || 'UK Address'}</Text>
                  </View>

                  <View style={styles.labelSection}>
                    <Text style={styles.labelSectionTitle}>DESTINATION</Text>
                    <Text style={styles.labelSectionText}>{selectedParcel.destination}, Ghana</Text>
                  </View>

                  <View style={styles.labelSection}>
                    <Text style={styles.labelSectionTitle}>RECEIVER</Text>
                    <Text style={styles.labelSectionText}>{selectedParcel.receiverName || 'Customer'}</Text>
                  </View>

                  <View style={styles.scanNote}>
                    <Ionicons name="qr-code-outline" size={16} color="#10B981" />
                    <Text style={styles.scanNoteText}>Scan QR code for delivery</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelModalButton}
                onPress={() => setPreviewVisible(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.printModalButton}
                onPress={confirmPrint}
                disabled={printing}
              >
                <Ionicons name="print" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.printModalText}>
                  {printing ? 'Printing...' : 'Print Label'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0B1A33",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1A33',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0B1A33',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scanButton: {
    marginLeft: 12,
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  printButton: {
    flexDirection: 'row',
    backgroundColor: '#83C5FA',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1A33',
    marginBottom: 12,
  },
  parcelCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  parcelId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1A33',
    marginBottom: 4,
  },
  parcelSender: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  parcelDestination: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  printIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0B1A33',
    textAlign: 'center',
    marginBottom: 20,
  },
  labelPreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  labelDetails: {
    gap: 12,
  },
  labelId: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1A33',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  labelSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  labelSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  labelSectionText: {
    fontSize: 14,
    color: '#0B1A33',
    fontWeight: '600',
  },
  scanNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  scanNoteText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelModalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  printModalButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#83C5FA',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printModalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
