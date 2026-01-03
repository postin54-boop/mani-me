import React, { useState, useContext } from "react";
import { Image, Alert, ActivityIndicator } from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { AuthContext } from "../context/AuthContext";

// Validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (result.success) {
      navigation.replace("Main");
    } else {
      Alert.alert("Login Failed", result.message || "Invalid email or password");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>Driver Login</Text>

      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Email"
        placeholderTextColor="#7CA6C7"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors({ ...errors, email: null });
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        placeholder="Password"
        placeholderTextColor="#7CA6C7"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors({ ...errors, password: null });
        }}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <TouchableOpacity onPress={() => navigation.navigate("Auth", { screen: "ForgotPassword" })}>
        <Text style={styles.forgot}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={NAVY} />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.signupButton} 
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={styles.signupText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const NAVY = "#0B1A33";
const SKY = "#83C5FA";
const WHITE = "#FFFFFF";

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
    marginBottom: 18,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'white',
    marginBottom: 2,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: NAVY,
  },
  title: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 20,
    color: WHITE,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1.5,
    borderColor: SKY,
    backgroundColor: WHITE,
    color: NAVY,
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  forgot: {
    color: SKY,
    textAlign: "right",
    marginBottom: 15,
    fontWeight: "600",
  },
  button: {
    backgroundColor: SKY,
    padding: 15,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: NAVY,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  signupButton: {
    marginTop: 8,
    alignItems: "center",
  },
  signupText: {
    color: SKY,
    fontWeight: "700",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
});
