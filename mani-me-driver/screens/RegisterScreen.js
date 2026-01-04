import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// Validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const isValidPhone = (phone) => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { register } = useContext(AuthContext);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [driverType, setDriverType] = useState('UK');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhone(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const result = await register({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role: driverType === 'UK' ? 'UK_DRIVER' : 'GH_DRIVER',
      driver_type: driverType === 'UK' ? 'pickup' : 'delivery',
      country: driverType === 'UK' ? 'UK' : 'Ghana',
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Registration successful! You can now login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } else {
      Alert.alert('Registration Failed', result.message || 'Please try again');
    }
  };

  const renderInput = (label, value, setValue, placeholder, icon, field, options = {}) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
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
          onChangeText={(text) => { setValue(text); clearError(field); }}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
          editable={!loading}
          {...options}
        />
        {field === 'password' && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7A90" />
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
      <StatusBar barStyle="light-content" backgroundColor="#0B1A33" />
      
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

          {/* Title */}
          <Animated.View style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our driver team today</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[
            styles.formCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {/* Driver Type Selection */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>I want to be a</Text>
              <View style={styles.driverTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.driverTypeButton,
                    driverType === 'UK' && styles.driverTypeActive
                  ]}
                  onPress={() => setDriverType('UK')}
                >
                  <Ionicons 
                    name="car-sport" 
                    size={20} 
                    color={driverType === 'UK' ? '#0B1A33' : '#83C5FA'} 
                  />
                  <Text style={[
                    styles.driverTypeText,
                    driverType === 'UK' && styles.driverTypeTextActive
                  ]}>🇬🇧 UK Driver</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.driverTypeButton,
                    driverType === 'Ghana' && styles.driverTypeActive
                  ]}
                  onPress={() => setDriverType('Ghana')}
                >
                  <Ionicons 
                    name="car-sport" 
                    size={20} 
                    color={driverType === 'Ghana' ? '#0B1A33' : '#83C5FA'} 
                  />
                  <Text style={[
                    styles.driverTypeText,
                    driverType === 'Ghana' && styles.driverTypeTextActive
                  ]}>🇬🇭 Ghana Driver</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Inputs */}
            {renderInput('Full Name', fullName, setFullName, 'John Doe', 'person-outline', 'fullName')}
            {renderInput('Email Address', email, setEmail, 'driver@email.com', 'mail-outline', 'email', { 
              keyboardType: 'email-address', 
              autoCapitalize: 'none',
              autoCorrect: false 
            })}
            {renderInput('Phone Number', phone, setPhone, '+44 7123 456789', 'call-outline', 'phone', { 
              keyboardType: 'phone-pad' 
            })}
            {renderInput('Password', password, setPassword, 'Min 6 characters', 'lock-closed-outline', 'password', { 
              secureTextEntry: !showPassword 
            })}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0B1A33" />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Create Account</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#0B1A33" />
                </>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
    marginBottom: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 18,
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
  driverTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  driverTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(131, 197, 250, 0.1)',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(131, 197, 250, 0.3)',
  },
  driverTypeActive: {
    backgroundColor: '#83C5FA',
    borderColor: '#83C5FA',
  },
  driverTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#83C5FA',
  },
  driverTypeTextActive: {
    color: '#0B1A33',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#83C5FA',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
    shadowColor: '#83C5FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0B1A33',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#9EB3D6',
    fontSize: 15,
  },
  loginLink: {
    color: '#83C5FA',
    fontSize: 15,
    fontWeight: '700',
  },
});
