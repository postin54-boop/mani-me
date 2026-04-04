import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../utils/config';
import { useThemeColors } from '../constants/theme';

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useThemeColors();

  const handleReset = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert(
          'Reset Code Sent',
          'If an account with that email exists, a 6-digit reset code has been sent. Check your email (including spam folder).',
          [
            {
              text: 'Enter Code',
              onPress: () => navigation.navigate('ResetPassword', { email: trimmedEmail }),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || data.message || 'Failed to send reset code.');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Please check your internet connection and try again.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Ionicons name="lock-closed-outline" size={64} color="#83C5FA" style={{ marginBottom: 24 }} />
      <Text style={[styles.title, { color: colors.text }]}>Forgot Password</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your email and we'll send you a 6-digit code to reset your password.</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder="Email address"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
        autoFocus
      />
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.buttonDisabled]} 
        onPress={handleReset} 
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: colors.textInverse }]}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
        <Ionicons name="arrow-back" size={18} color="#83C5FA" />
        <Text style={styles.backText}>Back to Login</Text>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  backLink: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: '#83C5FA',
    fontSize: 15,
  },
});
