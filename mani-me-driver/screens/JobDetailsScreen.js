import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const BRAND = {
  primary: "#0B1A33",
  secondary: "#83C5FA",
  background: "#F9FAFB",
  card: "#FFFFFF",
  text: "#0B1A33",
};

export default function JobDetailsScreen({ route, navigation }) {
  // Get job from route params
  const job = route?.params?.job || {
    parcelId: "MM-839201",
    address: "London Bridge, SE1",
    status: "On Route",
    pickup: "London Bridge, SE1",
    dropoff: "Ghana Warehouse",
    pickupTime: "10:00 AM - 12:00 PM",
    customerName: "Kwame Mensah",
    customerPhone: "+233 24 123 4567",
  };
  // Simulate user role (replace with context/backend)
  const userRole = route?.params?.role || "UK_DRIVER";

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

  // Simulate API call for each step
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const markNextStep = async (steps, setSteps, stepKey, actionLabel) => {
    const idx = steps.findIndex(s => !s.done);
    if (idx !== -1 && steps[idx].key === stepKey) {
      setLoading(true);
      setSuccessMsg("");
      // Simulate API call delay
      setTimeout(() => {
        const newSteps = steps.map((s, i) => i === idx ? { ...s, done: true } : s);
        setSteps(newSteps);
        setLoading(false);
        setSuccessMsg(`${actionLabel} completed!`);
        setTimeout(() => setSuccessMsg(""), 1500);
      }, 1200);
    }
  };

  // Check if previous step is done
  const isStepEnabled = (steps, stepKey) => {
    const idx = steps.findIndex(s => s.key === stepKey);
    if (idx === 0) return true;
    return steps[idx - 1].done;
  };

  // Check if all steps are done
  const isWorkflowComplete = (steps) => steps.every(s => s.done);

  // UK_DRIVER workflow
  if (userRole === "UK_DRIVER") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.card}>
          <Text style={styles.title}>Pickup Details</Text>
          <Text style={styles.label}>Parcel ID:</Text>
          <Text style={styles.value}>{job.parcelId}</Text>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{job.customerName}</Text>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{job.address}</Text>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{job.status}</Text>
          
          {/* Chat with Customer Button */}
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('ChatScreen', {
              shipment_id: job.parcelId,
              customer_name: job.customerName,
              tracking_number: job.parcelId
            })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={BRAND.secondary} />
            <Text style={styles.chatText}>Chat with Customer</Text>
          </TouchableOpacity>
          {/* Step Indicator */}
          <View style={styles.stepsRow}>
            {ukSteps.map((step, idx) => (
              <View key={step.key} style={[styles.step, step.done && styles.stepDone]}>
                <Ionicons name={step.done ? "checkmark-circle" : "ellipse-outline"} size={18} color={step.done ? BRAND.success : BRAND.primary} />
                <Text style={styles.stepText}>{step.label}</Text>
                {idx < ukSteps.length - 1 && <View style={styles.stepDivider} />}
              </View>
            ))}
          </View>
          {/* Required Actions - only enabled if previous step is done */}
          <TouchableOpacity
            style={[styles.primaryBtn, !isStepEnabled(ukSteps, "arrived") || loading ? { opacity: 0.5 } : {}]}
            disabled={!isStepEnabled(ukSteps, "arrived") || loading}
            onPress={() => markNextStep(ukSteps, setUkSteps, "arrived", "Pickup Photo")}
          >
            <Ionicons name="camera" size={20} color={BRAND.primary} />
            <Text style={styles.primaryText}>Take Pickup Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, !isStepEnabled(ukSteps, "intake") || loading ? { opacity: 0.5 } : {}]}
            disabled={!isStepEnabled(ukSteps, "intake") || loading}
            onPress={() => markNextStep(ukSteps, setUkSteps, "intake", "Payment Confirmation")}
          >
            <Ionicons name="cash" size={20} color={BRAND.primary} />
            <Text style={styles.primaryText}>Confirm Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, !isStepEnabled(ukSteps, "paid") || loading ? { opacity: 0.5 } : {}]}
            disabled={!isStepEnabled(ukSteps, "paid") || loading}
            onPress={() => markNextStep(ukSteps, setUkSteps, "paid", "Label Printing")}
          >
            <Ionicons name="print" size={20} color={BRAND.primary} />
            <Text style={styles.primaryText}>Print Label</Text>
          </TouchableOpacity>
          {/* Loading Spinner and Success Message */}
          {loading && <ActivityIndicator size="small" color={BRAND.secondary} style={{ marginTop: 12 }} />}
          {successMsg ? <Text style={{ color: BRAND.success, fontWeight: "700", marginTop: 8 }}>{successMsg}</Text> : null}
          {/* Completion State */}
          {isWorkflowComplete(ukSteps) && (
            <View style={{ marginTop: 18, alignItems: "center" }}>
              <Ionicons name="checkmark-circle" size={32} color={BRAND.success} />
              <Text style={{ color: BRAND.success, fontWeight: "700", fontSize: 16, marginTop: 6 }}>Pickup Workflow Complete!</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // GH_DRIVER workflow
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.card}>
        <Text style={styles.title}>Delivery Details</Text>
        <Text style={styles.label}>Parcel ID:</Text>
        <Text style={styles.value}>{job.parcelId}</Text>
        <Text style={styles.label}>Customer:</Text>
        <Text style={styles.value}>{job.customerName}</Text>
        <Text style={styles.label}>Address:</Text>
        <Text style={styles.value}>{job.address}</Text>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{job.status}</Text>
        
        {/* Chat with Customer Button */}
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => navigation.navigate('ChatScreen', {
            shipment_id: job.parcelId,
            customer_name: job.customerName,
            tracking_number: job.parcelId
          })}
        >
          <Ionicons name="chatbubble-outline" size={20} color={BRAND.secondary} />
          <Text style={styles.chatText}>Chat with Customer</Text>
        </TouchableOpacity>
        {/* Step Indicator */}
        <View style={styles.stepsRow}>
          {ghSteps.map((step, idx) => (
            <View key={step.key} style={[styles.step, step.done && styles.stepDone]}>
              <Ionicons name={step.done ? "checkmark-circle" : "ellipse-outline"} size={18} color={step.done ? BRAND.success : BRAND.primary} />
              <Text style={styles.stepText}>{step.label}</Text>
              {idx < ghSteps.length - 1 && <View style={styles.stepDivider} />}
            </View>
          ))}
        </View>
        {/* Required Actions - only enabled if previous step is done */}
        <TouchableOpacity
          style={[styles.primaryBtn, !isStepEnabled(ghSteps, "scanned") || loading ? { opacity: 0.5 } : {}]}
          disabled={!isStepEnabled(ghSteps, "scanned") || loading}
          onPress={() => markNextStep(ghSteps, setGhSteps, "scanned", "Delivery Photo")}
        >
          <Ionicons name="camera" size={20} color={BRAND.primary} />
          <Text style={styles.primaryText}>Capture Delivery Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, !isStepEnabled(ghSteps, "delivered") || loading ? { opacity: 0.5 } : {}]}
          disabled={!isStepEnabled(ghSteps, "delivered") || loading}
          onPress={() => markNextStep(ghSteps, setGhSteps, "delivered", "Delivery Confirmation")}
        >
          <Ionicons name="checkmark" size={20} color={BRAND.primary} />
          <Text style={styles.primaryText}>Confirm Delivery</Text>
        </TouchableOpacity>
        {/* Loading Spinner and Success Message */}
        {loading && <ActivityIndicator size="small" color={BRAND.secondary} style={{ marginTop: 12 }} />}
        {successMsg ? <Text style={{ color: BRAND.success, fontWeight: "700", marginTop: 8 }}>{successMsg}</Text> : null}
        {/* Completion State */}
        {isWorkflowComplete(ghSteps) && (
          <View style={{ marginTop: 18, alignItems: "center" }}>
            <Ionicons name="checkmark-circle" size={32} color={BRAND.success} />
            <Text style={{ color: BRAND.success, fontWeight: "700", fontSize: 16, marginTop: 6 }}>Delivery Workflow Complete!</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.background },
  card: {
    backgroundColor: BRAND.card,
    borderRadius: 14,
    padding: 20,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: BRAND.primary,
  },
  label: {
    fontSize: 14,
    color: BRAND.primary,
    marginTop: 8,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    color: BRAND.text,
    marginBottom: 4,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    flexWrap: "wrap",
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  stepDone: {
    opacity: 0.7,
  },
  stepText: {
    marginLeft: 4,
    fontSize: 13,
    color: BRAND.primary,
    fontWeight: "600",
  },
  stepDivider: {
    width: 16,
    height: 2,
    backgroundColor: BRAND.secondary,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  primaryBtn: {
    flexDirection: "row",
    backgroundColor: BRAND.secondary,
    padding: 14,
    borderRadius: 10,
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: BRAND.primary,
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 15,
  },
  chatBtn: {
    flexDirection: "row",
    backgroundColor: BRAND.secondary + "20",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BRAND.secondary,
  },
  chatText: {
    color: BRAND.secondary,
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 15,
  },
});
