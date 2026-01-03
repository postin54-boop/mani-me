// screens/Register.js
import React, { useState } from "react";
import api from "../src/api";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DEEP_NAVY = "#071528";
const SKY_BLUE = "#84C3EA";
const WHITE = "#FFFFFF";

export default function Register({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await api.post("/users", { email, password });
      Alert.alert("Success", res.data.message || "Registered successfully!");
      navigation.replace("Home");
    } catch (error) {
      Alert.alert("Registration Error", error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: DEEP_NAVY }}
    >
      <StatusBar barStyle="light-content" backgroundColor={DEEP_NAVY} />
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={28} color={WHITE} />
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color={WHITE} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.65)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={WHITE} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.65)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={WHITE} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="rgba(255,255,255,0.65)"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
          </View>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={DEEP_NAVY} />
            ) : (
              <Text style={styles.registerText}>Register</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.loginRow}>
          <Text style={styles.haveAccount}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}> 
            <Text style={styles.loginLink}> Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 28,
    left: 18,
    zIndex: 10,
    backgroundColor: "rgba(7,21,40,0.7)",
    borderRadius: 24,
    padding: 6,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  title: {
    color: WHITE,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 18,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(7,21,40,0.85)",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginBottom: 18,
  },
  inputRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SKY_BLUE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: DEEP_NAVY,
    fontSize: 16,
  },
  registerButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: SKY_BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  registerText: {
    color: DEEP_NAVY,
    fontWeight: "700",
    fontSize: 16,
  },
  loginRow: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  haveAccount: {
    color: "rgba(255,255,255,0.75)",
  },
  loginLink: {
    color: SKY_BLUE,
    fontWeight: "700",
  },
});
