// screens/CashReconciliationScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { submitCashReconciliation } from '../utils/api';
import { useCashTracking } from '../context/CashTrackingContext';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

export default function CashReconciliationScreen({ navigation }) {
  const { totalCash, cashCount, clearCashPickups } = useCashTracking();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill amount with total cash collected
  useEffect(() => {
    if (totalCash > 0) {
      setAmount(totalCash.toFixed(2));
    }
  }, [totalCash]);

  const pickImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.cancelled) {
      setPhoto(result.uri);
    }
  };

  const handleSubmit = async () => {
    logger.log('Submit button pressed', { user, amount, photo });
    
    // Get user id from either id or _id field
    const userId = user?.id || user?._id;
    
    if (!userId) {
      setError('User not authenticated');
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      return;
    }

    if (!amount || isNaN(parseFloat(amount))) {
      setError('Please enter a valid amount');
      return;
    }

    if (!photo) {
      setError('Please upload a receipt photo');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      logger.log('Submitting cash reconciliation...', { userId, amount: parseFloat(amount) });
      
      const response = await submitCashReconciliation({
        driver_id: userId,
        amount: parseFloat(amount),
        photoUrl: photo, // Replace with uploaded URL in production
      });
      
      logger.log('Submission successful:', response.data);
      
      // Clear cash pickups after successful submission
      await clearCashPickups();
      
      setSubmitting(false);
      Alert.alert(
        'Submitted to Admin',
        `Your cash report has been submitted for admin approval.\n\nAmount: £${parseFloat(amount).toFixed(2)}\nPickups: ${cashCount}\n\nStatus: Pending Review`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (err) {
      logger.error('Submission error:', err);
      setSubmitting(false);
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Submission failed';
      setError(errorMessage);
      Alert.alert('Submission Failed', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Cash Reconciliation</Text>
        <Text style={styles.subtitle}>Report cash collected from pickups</Text>
      <TextInput
        style={styles.input}
        placeholder="Amount Submitted (£)"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        editable={!submitting}
      />
      <TouchableOpacity style={styles.photoButton} onPress={pickImage} disabled={submitting}>
        <Text style={styles.photoButtonText}>{photo ? 'Change Photo' : 'Upload Receipt Photo'}</Text>
      </TouchableOpacity>
      {photo && <Image source={{ uri: photo }} style={styles.photoPreview} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TouchableOpacity 
        style={[
          styles.submitButton, 
          (submitting || !amount || !photo) && styles.submitButtonDisabled
        ]} 
        onPress={handleSubmit} 
        disabled={submitting || !amount || !photo}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Report</Text>
        )}
      </TouchableOpacity>
      
      {(!amount || !photo) && !submitting && (
        <Text style={styles.helperText}>
          {!amount && !photo ? 'Please enter amount and upload photo' : 
           !amount ? 'Please enter amount' : 
           'Please upload receipt photo'}
        </Text>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071528',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#84C3EA',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 18,
  },
  photoButton: {
    backgroundColor: '#84C3EA',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  photoButtonText: {
    color: '#071528',
    fontWeight: '700',
    fontSize: 15,
  },
  photoPreview: {
    width: 180,
    height: 120,
    borderRadius: 8,
    marginBottom: 18,
    marginTop: 4,
  },
  error: {
    color: '#ff5252',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#071528',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#3a4a5f',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  helperText: {
    color: '#84C3EA',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});
