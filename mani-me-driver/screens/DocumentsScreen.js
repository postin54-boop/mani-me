import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import logger from '../utils/logger';

export default function DocumentsScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Document status from user data or defaults
  const documents = [
    {
      id: 'driving_license',
      icon: 'card-outline',
      label: 'Driving License',
      status: user?.documents?.driving_license?.status || 'pending',
      expiry: user?.documents?.driving_license?.expiry || null,
      required: true,
    },
    {
      id: 'vehicle_insurance',
      icon: 'shield-outline',
      label: 'Vehicle Insurance',
      status: user?.documents?.vehicle_insurance?.status || 'pending',
      expiry: user?.documents?.vehicle_insurance?.expiry || null,
      required: true,
    },
    {
      id: 'vehicle_registration',
      icon: 'document-text-outline',
      label: 'Vehicle Registration',
      status: user?.documents?.vehicle_registration?.status || 'pending',
      expiry: user?.documents?.vehicle_registration?.expiry || null,
      required: true,
    },
    {
      id: 'profile_photo',
      icon: 'person-outline',
      label: 'Profile Photo',
      status: user?.documents?.profile_photo?.status || 'pending',
      expiry: null,
      required: true,
    },
    {
      id: 'dbs_check',
      icon: 'checkmark-circle-outline',
      label: 'DBS Check',
      status: user?.documents?.dbs_check?.status || 'not_required',
      expiry: user?.documents?.dbs_check?.expiry || null,
      required: false,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
        return '#EF4444';
      case 'expired':
        return '#EF4444';
      case 'not_required':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'rejected':
        return 'close-circle';
      case 'expired':
        return 'alert-circle';
      case 'not_required':
        return 'remove-circle-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      case 'expired':
        return 'Expired';
      case 'not_required':
        return 'Not Required';
      default:
        return 'Not Uploaded';
    }
  };

  const handleUploadDocument = async (documentId) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        // TODO: Upload document to backend
        logger.log('Uploading document:', documentId, result.assets[0].uri);
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        Alert.alert(
          'Document Uploaded',
          'Your document has been submitted for review. You will be notified once it\'s approved.',
          [{ text: 'OK' }]
        );
        setLoading(false);
      }
    } catch (error) {
      logger.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
      setLoading(false);
    }
  };

  const handleTakePhoto = async (documentId) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        // TODO: Upload document to backend
        logger.log('Uploading photo:', documentId, result.assets[0].uri);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        Alert.alert(
          'Photo Uploaded',
          'Your photo has been submitted for review.',
          [{ text: 'OK' }]
        );
        setLoading(false);
      }
    } catch (error) {
      logger.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      setLoading(false);
    }
  };

  const showUploadOptions = (doc) => {
    if (doc.status === 'not_required') return;
    
    Alert.alert(
      `Upload ${doc.label}`,
      'Choose how to add your document',
      [
        { text: 'Take Photo', onPress: () => handleTakePhoto(doc.id) },
        { text: 'Choose from Library', onPress: () => handleUploadDocument(doc.id) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : [colors.primary, '#0d2440']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.accent }]}>Documents</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Uploading...</Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.secondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Keep your documents up to date. Expired or rejected documents may affect your ability to accept jobs.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Documents</Text>
          
          {documents.filter(d => d.required).map((doc, index) => (
            <TouchableOpacity
              key={doc.id}
              style={[styles.documentCard, { backgroundColor: colors.surface }]}
              onPress={() => showUploadOptions(doc)}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name={doc.icon} size={24} color={colors.secondary} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={[styles.documentLabel, { color: colors.text }]}>{doc.label}</Text>
                <View style={styles.statusRow}>
                  <Ionicons name={getStatusIcon(doc.status)} size={16} color={getStatusColor(doc.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>
                    {getStatusLabel(doc.status)}
                  </Text>
                </View>
                {doc.expiry && (
                  <Text style={[styles.expiryText, { color: colors.textSecondary }]}>
                    Expires: {doc.expiry}
                  </Text>
                )}
              </View>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.secondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Optional Documents</Text>
          
          {documents.filter(d => !d.required).map((doc, index) => (
            <TouchableOpacity
              key={doc.id}
              style={[styles.documentCard, { backgroundColor: colors.surface }]}
              onPress={() => showUploadOptions(doc)}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name={doc.icon} size={24} color={colors.secondary} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={[styles.documentLabel, { color: colors.text }]}>{doc.label}</Text>
                <View style={styles.statusRow}>
                  <Ionicons name={getStatusIcon(doc.status)} size={16} color={getStatusColor(doc.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>
                    {getStatusLabel(doc.status)}
                  </Text>
                </View>
              </View>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 24,
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  expiryText: {
    fontSize: 12,
    marginTop: 4,
  },
});
