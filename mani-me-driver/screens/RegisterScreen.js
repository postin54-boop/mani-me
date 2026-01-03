
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/theme';
import { AuthContext } from '../context/AuthContext';

// Validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const isValidPhone = (phone) => {
  // Accept various phone formats with at least 10 digits
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

export default function RegisterScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { register } = useContext(AuthContext);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [driverType, setDriverType] = useState('UK'); // 'UK' or 'Ghana'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Phone validation
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhone(phone)) {
      newErrors.phone = "Please enter a valid phone number (10-15 digits)";
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

  const renderError = (field) => {
    if (!errors[field]) return null;
    return <Text style={[styles.errorText, { color: '#FF6B6B' }]}>{errors[field]}</Text>;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={28} color={colors.secondary} />
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign up to start driving</Text>
      </View>
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Driver Type</Text>
        <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 8 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: driverType === 'UK' ? colors.secondary : colors.surface,
              borderRadius: 10,
              paddingVertical: 10,
              marginRight: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: driverType === 'UK' ? colors.secondary : colors.border,
            }}
            onPress={() => setDriverType('UK')}
          >
            <Text style={{ color: driverType === 'UK' ? colors.primary : colors.text }}>UK Driver</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: driverType === 'Ghana' ? colors.secondary : colors.surface,
              borderRadius: 10,
              paddingVertical: 10,
              marginLeft: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: driverType === 'Ghana' ? colors.secondary : colors.border,
            }}
            onPress={() => setDriverType('Ghana')}
          >
            <Text style={{ color: driverType === 'Ghana' ? colors.primary : colors.text }}>Ghana Driver</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
        <TextInput 
          style={[styles.input, { color: colors.text, borderColor: errors.fullName ? '#FF6B6B' : colors.border }]} 
          value={fullName} 
          onChangeText={(text) => { setFullName(text); clearError('fullName'); }}
          placeholder="John Doe" 
          placeholderTextColor={colors.textSecondary} 
        />
        {renderError('fullName')}
        
        <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
        <TextInput 
          style={[styles.input, { color: colors.text, borderColor: errors.email ? '#FF6B6B' : colors.border }]} 
          value={email} 
          onChangeText={(text) => { setEmail(text); clearError('email'); }}
          placeholder="driver@manime.com" 
          placeholderTextColor={colors.textSecondary} 
          keyboardType="email-address" 
          autoCapitalize="none" 
          autoCorrect={false}
        />
        {renderError('email')}
        
        <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
        <TextInput 
          style={[styles.input, { color: colors.text, borderColor: errors.phone ? '#FF6B6B' : colors.border }]} 
          value={phone} 
          onChangeText={(text) => { setPhone(text); clearError('phone'); }}
          placeholder="+234 801 234 5678" 
          placeholderTextColor={colors.textSecondary} 
          keyboardType="phone-pad" 
        />
        {renderError('phone')}
        
        <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
        <TextInput 
          style={[styles.input, { color: colors.text, borderColor: errors.password ? '#FF6B6B' : colors.border }]} 
          value={password} 
          onChangeText={(text) => { setPassword(text); clearError('password'); }}
          placeholder="Enter password (min 6 characters)" 
          placeholderTextColor={colors.textSecondary} 
          secureTextEntry 
        />
        {renderError('password')}
        <TouchableOpacity style={[styles.registerButton, { backgroundColor: colors.primary }]} onPress={handleRegister} disabled={loading}>
          <Text style={[styles.registerButtonText, { color: colors.accent }]}>{loading ? 'Registering...' : 'Sign Up'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 18 }} onPress={() => navigation.navigate('Login')}>
          <Text style={{ color: colors.secondary, textAlign: 'center' }}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 28,
    left: 18,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
    padding: 6,
  },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  subtitle: { fontSize: 16, marginTop: 6, fontWeight: '500' },
  form: { padding: 24 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 18 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 6, fontSize: 16 },
  registerButton: { marginTop: 32, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  registerButtonText: { fontSize: 16, fontWeight: '700' },
  errorText: { fontSize: 12, marginTop: 2, marginBottom: 4, marginLeft: 4 },
});
