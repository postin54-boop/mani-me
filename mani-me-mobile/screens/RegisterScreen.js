import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../src/api';
import { useUser } from '../context/UserContext';

const { width, height } = Dimensions.get('window');

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^(\+44|0)[1-9]\d{8,9}$/;
  const cleanPhone = phone.replace(/[\s-]/g, '');
  return phoneRegex.test(cleanPhone);
};

const RegisterScreen = ({ navigation }) => {
  const { login } = useUser();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(phone.trim())) {
      newErrors.phone = 'Please enter a valid UK phone number';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setErrors({});

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim().replace(/[\s-]/g, ''),
        password,
      });
      
      if (res.data.token && res.data.user) {
        await login(res.data.user, res.data.token);
        navigation.replace('Home');
      } else {
        Alert.alert('Success', res.data.message || 'Registration successful!');
        navigation.replace('Login');
      }
    } catch (error) {
      Alert.alert('Registration Error', error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (field, icon, placeholder, value, setValue, options = {}) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{options.label || placeholder}</Text>
      <View style={[
        styles.inputContainer,
        focusedField === field && styles.inputFocused,
        errors[field] && styles.inputError
      ]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={errors[field] ? "#EF4444" : focusedField === field ? "#83C5FA" : "#6B7A90"} 
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#6B7A90"
          value={value}
          onChangeText={(text) => { setValue(text); setErrors(prev => ({ ...prev, [field]: null })); }}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
          editable={!loading}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={options.autoCapitalize || 'sentences'}
          secureTextEntry={options.secureTextEntry}
        />
        {options.rightIcon && (
          <TouchableOpacity onPress={options.onRightIconPress} style={styles.eyeButton}>
            <Ionicons name={options.rightIcon} size={20} color="#6B7A90" />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <LinearGradient
      colors={['#0B1A33', '#071A2C']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }
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

          {/* Icon Header */}
          <Animated.View style={[
            styles.iconContainer,
            { 
              opacity: fadeAnim,
              transform: [{ scale: iconScale }]
            }
          ]}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="account-plus" size={50} color="#10B981" />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Mani Me for fast, secure delivery</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[
            styles.formCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {/* Name Input */}
            {renderInput('name', 'person-outline', 'John Doe', name, setName, { label: 'Full Name' })}

            {/* Email Input */}
            {renderInput('email', 'mail-outline', 'your@email.com', email, setEmail, { 
              label: 'Email Address',
              keyboardType: 'email-address',
              autoCapitalize: 'none'
            })}

            {/* Phone Input */}
            {renderInput('phone', 'call-outline', '07123456789', phone, setPhone, { 
              label: 'Phone Number',
              keyboardType: 'phone-pad'
            })}

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
                  placeholder="Min 8 characters"
                  placeholderTextColor="#6B7A90"
                  value={password}
                  onChangeText={(text) => { setPassword(text); setErrors(prev => ({ ...prev, password: null })); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  editable={!loading}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7A90" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Password Strength Indicator */}
            <View style={styles.strengthContainer}>
              <View style={[styles.strengthBar, password.length >= 1 && styles.strengthWeak]} />
              <View style={[styles.strengthBar, password.length >= 4 && styles.strengthMedium]} />
              <View style={[styles.strengthBar, password.length >= 8 && styles.strengthStrong]} />
            </View>
            <Text style={styles.strengthText}>
              {password.length === 0 ? '' : password.length < 4 ? 'Weak' : password.length < 8 ? 'Medium' : 'Strong'}
            </Text>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0B1A33" />
              ) : (
                <>
                  <Text style={styles.signUpText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={20} color="#0B1A33" />
                </>
              )}
            </TouchableOpacity>

            {/* Terms Text */}
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink} onPress={() => navigation.navigate('Terms')}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink} onPress={() => navigation.navigate('Privacy')}>Privacy Policy</Text>
            </Text>

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={styles.hasAccountText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

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
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
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
    marginBottom: 16,
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
  strengthContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  strengthWeak: {
    backgroundColor: '#EF4444',
  },
  strengthMedium: {
    backgroundColor: '#F59E0B',
  },
  strengthStrong: {
    backgroundColor: '#10B981',
  },
  strengthText: {
    fontSize: 12,
    color: '#6B7A90',
    marginBottom: 20,
    marginLeft: 4,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0B1A33',
  },
  termsText: {
    fontSize: 12,
    color: '#6B7A90',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    color: '#83C5FA',
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  hasAccountText: {
    color: '#9EB3D6',
    fontSize: 15,
  },
  loginLink: {
    color: '#83C5FA',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default RegisterScreen;
