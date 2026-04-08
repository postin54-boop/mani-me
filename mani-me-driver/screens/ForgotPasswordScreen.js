
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../utils/config";

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // Step 1 = enter email, step 2 = enter code + new password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const animateStep = (nextStep) => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    setStep(nextStep);
  };

  // ── Step 1: Send code ─────────────────────────────────────────────────────
  const handleSendCode = async () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      newErrors.email = "Enter a valid email address";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      animateStep(2);
    } catch {
      Alert.alert("Error", "Could not send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Reset password ───────────────────────────────────────────────
  const handleResetPassword = async () => {
    const newErrors = {};
    if (!code.trim() || code.trim().length !== 6) newErrors.code = "Enter the 6-digit code from your email";
    if (!newPassword) newErrors.newPassword = "New password is required";
    else if (newPassword.length < 8) newErrors.newPassword = "Password must be at least 8 characters";
    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Error", data.error || "Reset failed. Check your code and try again.");
        return;
      }
      Alert.alert(
        "Password Reset!",
        "Your password has been updated. Please log in with your new password.",
        [{ text: "Log In", onPress: () => navigation.replace("Login") }]
      );
    } catch {
      Alert.alert("Error", "Could not reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, icon, error, children }) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputContainer,
        focusedField === label && styles.inputFocused,
        error && styles.inputError,
      ]}>
        <Ionicons
          name={icon}
          size={20}
          color={error ? "#EF4444" : focusedField === label ? "#83C5FA" : "#6B7A90"}
        />
        {children}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <LinearGradient colors={["#0B1A33", "#071A2C"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1A33" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (step === 2 ? animateStep(1) : navigation.goBack())}
          >
            <Ionicons name="arrow-back" size={22} color="#83C5FA" />
            <Text style={styles.backBtnText}>{step === 2 ? "Change Email" : "Back to Login"}</Text>
          </TouchableOpacity>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <Ionicons
                name={step === 1 ? "lock-open-outline" : "key-outline"}
                size={40}
                color="#83C5FA"
              />
            </View>

            {/* Header */}
            <Text style={styles.title}>
              {step === 1 ? "Forgot Password?" : "Enter Reset Code"}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? "No worries — we'll send a 6-digit code to your email."
                : `We sent a 6-digit code to\n${email}`}
            </Text>

            {/* Card */}
            <View style={styles.card}>
              {step === 1 ? (
                <>
                  <InputField label="email" icon="mail-outline" error={errors.email}>
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor="#6B7A90"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={(t) => { setEmail(t); setErrors(p => ({ ...p, email: null })); }}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      editable={!loading}
                    />
                  </InputField>

                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && styles.btnDisabled]}
                    onPress={handleSendCode}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#0B1A33" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Send Reset Code</Text>
                        <Ionicons name="send-outline" size={18} color="#0B1A33" />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* 6-digit code */}
                  <InputField label="code" icon="keypad-outline" error={errors.code}>
                    <TextInput
                      style={styles.input}
                      placeholder="6-digit code"
                      placeholderTextColor="#6B7A90"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={code}
                      onChangeText={(t) => { setCode(t); setErrors(p => ({ ...p, code: null })); }}
                      onFocus={() => setFocusedField("code")}
                      onBlur={() => setFocusedField(null)}
                      editable={!loading}
                    />
                  </InputField>

                  {/* New password */}
                  <InputField label="newPassword" icon="lock-closed-outline" error={errors.newPassword}>
                    <TextInput
                      style={styles.input}
                      placeholder="New password (min 8 chars)"
                      placeholderTextColor="#6B7A90"
                      secureTextEntry={!showNew}
                      value={newPassword}
                      onChangeText={(t) => { setNewPassword(t); setErrors(p => ({ ...p, newPassword: null })); }}
                      onFocus={() => setFocusedField("newPassword")}
                      onBlur={() => setFocusedField(null)}
                      editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                      <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7A90" />
                    </TouchableOpacity>
                  </InputField>

                  {/* Confirm password */}
                  <InputField label="confirmPassword" icon="shield-checkmark-outline" error={errors.confirmPassword}>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm new password"
                      placeholderTextColor="#6B7A90"
                      secureTextEntry={!showConfirm}
                      value={confirmPassword}
                      onChangeText={(t) => { setConfirmPassword(t); setErrors(p => ({ ...p, confirmPassword: null })); }}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                      <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7A90" />
                    </TouchableOpacity>
                  </InputField>

                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && styles.btnDisabled]}
                    onPress={handleResetPassword}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#0B1A33" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Reset Password</Text>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#0B1A33" />
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Resend code */}
                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleSendCode}
                    disabled={loading}
                  >
                    <Text style={styles.resendText}>Didn't receive it? </Text>
                    <Text style={styles.resendLink}>Resend code</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Step indicator */}
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, step === 1 && styles.stepDotActive]} />
              <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 32,
  },
  backBtnText: { color: "#83C5FA", fontSize: 15, fontWeight: "600" },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(131,197,250,0.12)",
    borderWidth: 1,
    borderColor: "rgba(131,197,250,0.25)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#8FA0B8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#122040",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(131,197,250,0.1)",
  },
  inputWrapper: { marginBottom: 16 },
  inputLabel: { color: "#8FA0B8", fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B1A33",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "rgba(131,197,250,0.15)",
    gap: 10,
  },
  inputFocused: { borderColor: "#83C5FA" },
  inputError: { borderColor: "#EF4444" },
  input: { flex: 1, color: "#fff", fontSize: 15 },
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4 },
  primaryBtn: {
    backgroundColor: "#83C5FA",
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: "#0B1A33", fontSize: 16, fontWeight: "700" },
  resendBtn: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  resendText: { color: "#8FA0B8", fontSize: 14 },
  resendLink: { color: "#83C5FA", fontSize: 14, fontWeight: "600" },
  stepRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(131,197,250,0.25)",
  },
  stepDotActive: { backgroundColor: "#83C5FA", width: 24 },
  // kept for legacy reference (unused)
  link: {
    textAlign: "center",
    color: "#071528",
    fontWeight: "600",
  },
});
