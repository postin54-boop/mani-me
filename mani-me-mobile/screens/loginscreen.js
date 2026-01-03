import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Google from "expo-auth-session/providers/google";
import api from "../src/api";
import { useUser } from '../context/UserContext';
import logger from '../utils/logger';

const { width, height } = Dimensions.get('window');

// Validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LoginScreen({ navigation }) {
  const { login: loginUser, sessionExpired, setSessionExpired } = useUser();
  const insets = useSafeAreaInsets();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Clear session expired flag
  useEffect(() => {
    if (sessionExpired) {
      setSessionExpired(false);
    }
  }, [sessionExpired, setSessionExpired]);

  // Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "508869526140-uc5k1lo5o20vkcr6jnnlqf0q4f8t5m0s.apps.googleusercontent.com",
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    expoClientId: "YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      navigation.replace("Home");
    }
  }, [response, navigation]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setErrors({});
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      logger.log("Attempting login to:", api.defaults.baseURL);
      const res = await api.post("/auth/login", { 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (res.data.token && res.data.user) {
        await loginUser(res.data.user, res.data.token);
        navigation.replace("Home");
      } else {
        Alert.alert("Login Error", "Invalid response from server");
      }
    } catch (error) {
      logger.error("Login error:", error);
      if (error.isAuthError) {
        Alert.alert("Login Error", "Invalid email or password");
      } else if (error.code === 'ECONNABORTED') {
        Alert.alert("Login Error", "Connection timeout. Please check your connection.");
      } else if (error.isNetworkError) {
        Alert.alert("Login Error", "Cannot connect to server.");
      } else {
        Alert.alert("Login Error", error.response?.data?.error || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await promptAsync();
  };

  return (
    <LinearGradient
      colors={['#0B1A33', '#071A2C']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B1A33" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#83C5FA" />
          </TouchableOpacity>

          {/* Logo Header */}
          <Animated.View style={[
            styles.iconContainer,
            { 
              opacity: fadeAnim,
              transform: [{ scale: iconScale }]
            }
          ]}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Title */}
          <Animated.View style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={styles.title}>Akwaaba</Text>
            <Text style={styles.subtitle}>Sign in to continue with Mani Me</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[
            styles.formCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[
                styles.inputContainer,
                focusedField === 'email' && styles.inputFocused,
                errors.email && styles.inputError
              ]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={errors.email ? "#EF4444" : focusedField === 'email' ? "#83C5FA" : "#6B7A90"} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#6B7A90"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => { setEmail(text); setErrors(prev => ({ ...prev, email: null })); }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  editable={!loading}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[
                styles.inputContainer,
                focusedField === 'password' && styles.inputFocused,
                errors.password && styles.inputError
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={errors.password ? "#EF4444" : focusedField === 'password' ? "#83C5FA" : "#6B7A90"} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7A90"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => { setPassword(text); setErrors(prev => ({ ...prev, password: null })); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6B7A90"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
              disabled={loading}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0B1A33" />
              ) : (
                <>
                  <Text style={styles.signInText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#0B1A33" />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-in */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
            >
              <AntDesign name="google" size={20} color="#0B1A33" />
              <Text style={styles.googleText}>Google</Text>
            </TouchableOpacity>

            {/* Create Account Link */}
            <View style={styles.signupRow}>
              <Text style={styles.noAccountText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.signupLink}> Create Account</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Test Connection (Debug) */}
          <TouchableOpacity 
            onPress={() => navigation.navigate("ConnectionTest")}
            style={styles.debugButton}
          >
            <Text style={styles.debugText}>🔧 Test Connection</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(131, 197, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9EB3D6',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9EB3D6',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: '#83C5FA',
    backgroundColor: 'rgba(131, 197, 250, 0.1)',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#fff',
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#83C5FA',
    fontSize: 14,
    fontWeight: '600',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#83C5FA',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#83C5FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signInText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0B1A33',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7A90',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B1A33',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  noAccountText: {
    color: '#9EB3D6',
    fontSize: 15,
  },
  signupLink: {
    color: '#83C5FA',
    fontSize: 15,
    fontWeight: '700',
  },
  debugButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  debugText: {
    color: 'rgba(131, 197, 250, 0.5)',
    fontSize: 12,
  },
});
