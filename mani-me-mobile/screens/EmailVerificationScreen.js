import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../src/api';
import { useUser } from '../context/UserContext';

export default function EmailVerificationScreen({ navigation, route }) {
  const { user, login } = useUser();
  const insets = useSafeAreaInsets();
  const email = route?.params?.email || user?.email || '';
  
  // Redirect if no email is available
  useEffect(() => {
    if (!email) {
      Alert.alert(
        'Error',
        'No email address found. Please try registering again.',
        [{ text: 'OK', onPress: () => navigation.navigate('Register') }]
      );
    }
  }, [email, navigation]);
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const inputRefs = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (value, index) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace - move to previous input
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-email', {
        email,
        code: verificationCode,
      });

      if (res.data.user) {
        // Update user context with verified status
        await login(res.data.user, route?.params?.token);
      }

      Alert.alert(
        'Success! 🎉',
        'Your email has been verified successfully!',
        [
          {
            text: 'Continue',
            onPress: () => navigation.replace('Home'),
          },
        ]
      );
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Verification failed';
      Alert.alert('Verification Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      Alert.alert('Success', 'A new verification code has been sent to your email');
      setCountdown(60); // 60 second cooldown
      setCode(['', '', '', '', '', '']);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to resend code';
      Alert.alert('Error', errorMsg);
    } finally {
      setResending(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Verification?',
      'You can verify your email later from your profile settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => navigation.replace('Home') },
      ]
    );
  };

  return (
    <LinearGradient colors={['#0B1A33', '#071A2C']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, paddingTop: insets.top + 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={48} color="#83C5FA" />
            </View>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to
            </Text>
            <Text style={styles.email}>{email || 'your email'}</Text>
          </View>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value.replace(/\D/g, ''), index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0B1A33" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#0B1A33" />
                <Text style={styles.verifyButtonText}>Verify Email</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={countdown > 0 || resending}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#83C5FA" />
              ) : countdown > 0 ? (
                <Text style={styles.countdownText}>Resend in {countdown}s</Text>
              ) : (
                <Text style={styles.resendLink}>Resend Code</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#6B7A90" />
            <Text style={styles.infoText}>
              Check your spam folder if you don't see the email.
            </Text>
          </View>
        </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#83C5FA20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BA8B4',
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#83C5FA',
    fontWeight: '600',
    marginTop: 4,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#16244a',
    borderWidth: 2,
    borderColor: '#23325c',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: '#83C5FA',
    backgroundColor: '#83C5FA10',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#83C5FA',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B1A33',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#9BA8B4',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#83C5FA',
  },
  countdownText: {
    fontSize: 14,
    color: '#6B7A90',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color: '#6B7A90',
    textDecorationLine: 'underline',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 'auto',
    marginBottom: 32,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7A90',
  },
});
