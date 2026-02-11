import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../utils/config';

const DEEP_NAVY = "#071528";
const SKY_BLUE = "#84C3EA";

export default function ResetPassword({ route, navigation }) {
  const { email } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRefs = useRef([]);

  const handleCodeChange = (value, index) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, '');
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleReset = async () => {
    const resetCode = code.join('');
    if (resetCode.length !== 6) {
      Alert.alert('Error', 'Please enter the full 6-digit code.');
      return;
    }
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: resetCode,
          newPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert(
          'Password Reset',
          'Your password has been reset successfully. Please log in with your new password.',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to reset password. The code may be invalid or expired.');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Please check your internet connection and try again.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        Alert.alert('Code Resent', 'A new reset code has been sent to your email.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (e) {
      Alert.alert('Network Error', 'Please try again.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={DEEP_NAVY} />
      <Ionicons name="shield-checkmark-outline" size={64} color="#83C5FA" style={{ marginBottom: 24 }} />
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to{'\n'}
        <Text style={styles.emailHighlight}>{email}</Text>
      </Text>

      {/* Code Input */}
      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
            value={digit}
            onChangeText={(value) => handleCodeChange(value, index)}
            onKeyPress={(e) => handleCodeKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            editable={!loading}
          />
        ))}
      </View>

      {/* New Password */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="New password (min 8 characters)"
          placeholderTextColor="#b0b8c1"
          secureTextEntry={!showPassword}
          value={newPassword}
          onChangeText={setNewPassword}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#b0b8c1"
          />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Confirm new password"
        placeholderTextColor="#b0b8c1"
        secureTextEntry={!showPassword}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleReset}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={loading} style={styles.resendLink}>
        <Text style={styles.resendText}>Didn't receive the code? <Text style={styles.resendBold}>Resend</Text></Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
        <Ionicons name="arrow-back" size={18} color="#83C5FA" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: DEEP_NAVY,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b8c1',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailHighlight: {
    color: '#83C5FA',
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    width: '100%',
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#23325c',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#16244a',
    color: '#fff',
  },
  codeInputFilled: {
    borderColor: '#83C5FA',
    backgroundColor: '#1a2d5a',
  },
  passwordContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 12,
  },
  passwordInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#23325c',
    borderRadius: 8,
    padding: 14,
    paddingRight: 48,
    fontSize: 16,
    backgroundColor: '#16244a',
    color: '#fff',
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#23325c',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#16244a',
    color: '#fff',
  },
  button: {
    width: '100%',
    backgroundColor: SKY_BLUE,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: SKY_BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendLink: {
    marginBottom: 12,
  },
  resendText: {
    color: '#b0b8c1',
    fontSize: 14,
  },
  resendBold: {
    color: '#83C5FA',
    fontWeight: '600',
  },
  backLink: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: '#83C5FA',
    fontSize: 15,
  },
});
