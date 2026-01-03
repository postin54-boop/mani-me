import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useThemeColors } from "../constants/theme";

export default function ScanParcelScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [parcelId, setParcelId] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    
    // Vibrate or play sound feedback could be added here
    Alert.alert(
      "Parcel Scanned!",
      `Parcel ID: ${data}`,
      [
        {
          text: "Scan Another",
          onPress: () => setScanned(false),
        },
        {
          text: "View Details",
          onPress: () => {
            // Navigate to parcel details or process the scan
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleManualSubmit = () => {
    if (parcelId.trim()) {
      Alert.alert(
        "Parcel Found",
        `Parcel ID: ${parcelId.trim()}`,
        [
          {
            text: "OK",
            onPress: () => {
              setParcelId("");
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      Alert.alert("Error", "Please enter a parcel ID");
    }
  };

  // Permission loading state
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Permission not granted - show manual input option
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 12, backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color={colors.textSecondary} />
          <Text style={[styles.title, { color: colors.text }]}>Camera Access Required</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Allow camera access to scan parcel QR codes and barcodes
          </Text>
          
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Ionicons name="camera" size={20} color={colors.accent} />
            <Text style={[styles.permissionButtonText, { color: colors.accent }]}>Enable Camera</Text>
          </TouchableOpacity>

          <Text style={[styles.orText, { color: colors.textSecondary }]}>or</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter Parcel ID manually"
              placeholderTextColor={colors.textSecondary}
              value={parcelId}
              onChangeText={setParcelId}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.secondary }]}
              onPress={handleManualSubmit}
            >
              <Text style={[styles.submitButtonText, { color: '#fff' }]}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Camera scanner view
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={[styles.headerBackBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Parcel</Text>
        <TouchableOpacity
          style={[styles.headerBackBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={() => setShowManualInput(!showManualInput)}
        >
          <Ionicons name="keypad-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "code128", "code39", "ean13", "ean8", "upc_a"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Scan Frame Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.scanText}>
            {scanned ? "Scanned!" : "Align QR code or barcode within frame"}
          </Text>
        </View>
      </CameraView>

      {/* Manual Input Panel */}
      {showManualInput && (
        <View style={[styles.manualPanel, { backgroundColor: colors.surface }]}>
          <Text style={[styles.manualTitle, { color: colors.text }]}>Enter Parcel ID Manually</Text>
          <View style={styles.manualInputRow}>
            <TextInput
              style={[styles.manualInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., MM-839201"
              placeholderTextColor={colors.textSecondary}
              value={parcelId}
              onChangeText={setParcelId}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.manualSubmitBtn, { backgroundColor: colors.primary }]}
              onPress={handleManualSubmit}
            >
              <Ionicons name="checkmark" size={24} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20, backgroundColor: colors.surface }]}>
        {scanned && (
          <TouchableOpacity
            style={[styles.rescanButton, { backgroundColor: colors.primary }]}
            onPress={() => setScanned(false)}
          >
            <Ionicons name="scan-outline" size={20} color={colors.accent} />
            <Text style={[styles.rescanText, { color: colors.accent }]}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBackBtn: {
    borderRadius: 20,
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomActions: {
    padding: 20,
    alignItems: 'center',
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 8,
  },
  rescanText: {
    fontSize: 16,
    fontWeight: '700',
  },
  manualPanel: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  manualInput: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
  },
  manualSubmitBtn: {
    padding: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Permission screen styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backBtn: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  orText: {
    marginVertical: 20,
    fontSize: 14,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  submitButton: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
