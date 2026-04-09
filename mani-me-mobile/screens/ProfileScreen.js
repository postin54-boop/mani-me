import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, StatusBar, TextInput, ActivityIndicator, Image, Platform, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, Linking, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { storage, auth } from '../firebaseConfig';
import { useUser } from '../context/UserContext';
import { useThemeColors, SIZES, FONTS, SHADOWS } from '../constants/theme';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';
import { 
  isBiometricSupported, 
  isBiometricEnabled, 
  enableBiometric, 
  disableBiometric, 
  getBiometricName,
  authenticateWithBiometrics 
} from '../utils/biometricAuth';

export default function ProfileScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser, token } = useUser();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  
  // Biometric auth state
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometric');
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Sync profile image state when user context changes (e.g., on screen focus)
  useEffect(() => {
    setProfileImage(user?.profileImage || null);
    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
  }, [user?.profileImage, user?.name, user?.email, user?.phone, user?.address]);
  
  // Check biometric support on mount
  useEffect(() => {
    const checkBiometric = async () => {
      const supported = await isBiometricSupported();
      setBiometricSupported(supported);
      if (supported) {
        const enabled = await isBiometricEnabled();
        setBiometricEnabled(enabled);
        const name = await getBiometricName();
        setBiometricName(name);
      }
    };
    checkBiometric();
  }, []);
  
  const handleBiometricToggle = async (value) => {
    setBiometricLoading(true);
    try {
      if (value) {
        // Verify biometrics before enabling
        const result = await authenticateWithBiometrics(`Verify ${biometricName} to enable`);
        if (result.success) {
          await enableBiometric();
          setBiometricEnabled(true);
          Alert.alert('Success', `${biometricName} login enabled`);
        } else if (result.error !== 'Cancelled') {
          Alert.alert('Failed', 'Could not verify biometrics');
        }
      } else {
        await disableBiometric();
        setBiometricEnabled(false);
      }
    } catch (error) {
      logger.error('Biometric toggle error:', error);
      Alert.alert('Error', 'Failed to update biometric settings');
    } finally {
      setBiometricLoading(false);
    }
  };

  const pickProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed', 
          'Please allow access to your photo library in Settings > Privacy > Photos',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        setIsEditing(true); // Enter edit mode to show Save button
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open photo library');
    }
  };

  const takeProfilePhoto = async () => {
    try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setIsEditing(true); // Enter edit mode to show Save button
    }
    } catch (err) {
      Alert.alert('Camera Error', 'Unable to open camera. Please try again.');
    }
  };

  const deleteProfileImage = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setProfileImage(null);
            setIsEditing(true); // Enter edit mode to show Save button
          }
        },
      ]
    );
  };

  const showImageOptions = () => {
    const options = [
      { text: 'Take Photo', onPress: takeProfilePhoto },
      { text: 'Choose from Gallery', onPress: pickProfileImage },
    ];
    
    // Add delete option if there's an existing image
    if (profileImage) {
      options.push({ text: 'Delete Photo', onPress: deleteProfileImage, style: 'destructive' });
    }
    
    options.push({ text: 'Cancel', style: 'cancel' });
    
    Alert.alert('Profile Picture', 'Choose an option', options);
  };

  const handleSave = async () => {
    if (!editedUser.name || !editedUser.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = user?.profileImage || null;

      // Upload new profile image to Firebase Storage if changed
      if (profileImage && profileImage !== user?.profileImage && !profileImage.startsWith('http')) {
        try {
          // Ensure Firebase Auth is signed in (required for Storage rules)
          if (!auth.currentUser) {
            await signInAnonymously(auth);
            logger.log('Signed in anonymously to Firebase for storage access');
          }
          
          // Convert local file URI to blob using XMLHttpRequest (more reliable in React Native)
          const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () => reject(new Error('Failed to load image'));
            xhr.responseType = 'blob';
            xhr.open('GET', profileImage, true);
            xhr.send(null);
          });
          
          const filename = `profile_images/${user?.id}_${Date.now()}.jpg`;
          const storageRef = ref(storage, filename);
          await uploadBytes(storageRef, blob);
          imageUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
          logger.error('Image upload error:', uploadError);
          Alert.alert('Warning', 'Could not upload profile picture, but other changes will be saved');
        }
      }

      // Update backend MongoDB profile
      const response = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editedUser.name,
          email: editedUser.email,
          phone: editedUser.phone,
          address: editedUser.address,
          profileImage: imageUrl || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Backend error:', errorData);
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      
      // Update local user context with response data including new image URL
      const updatedUserData = { ...user, ...data.user, profileImage: imageUrl };
      await updateUser(updatedUserData);
      setProfileImage(imageUrl);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      logger.error('handleSave error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setProfileImage(user?.profileImage || null);
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.navigate('Login');
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Simple Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        {isEditing ? (
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 150 }}
        >
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={showImageOptions}
            activeOpacity={0.7}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="person" size={56} color={colors.textSecondary} />
              </View>
            )}
            <View style={[styles.editOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
              <Text style={styles.editOverlayText}>Edit</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={showImageOptions}
            activeOpacity={0.7}
          >
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Fields */}
        <View style={styles.fieldsContainer}>
          {/* Name Field */}
          <TouchableOpacity 
            style={[styles.fieldItem, { borderBottomColor: colors.border }]}
            onPress={() => !isEditing && setIsEditing(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
            {isEditing ? (
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={editedUser.name}
                onChangeText={(text) => setEditedUser({ ...editedUser, name: text })}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
            ) : (
              <View style={styles.fieldValueContainer}>
                <Text style={[styles.fieldValue, { color: colors.text }]}>{user?.name || 'Add name'}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>

          {/* Email Field */}
          <TouchableOpacity 
            style={[styles.fieldItem, { borderBottomColor: colors.border }]}
            onPress={() => !isEditing && setIsEditing(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
            {isEditing ? (
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={editedUser.email}
                onChangeText={(text) => setEditedUser({ ...editedUser, email: text })}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <View style={styles.fieldValueContainer}>
                <Text style={[styles.fieldValue, { color: colors.text }]}>{user?.email || 'Add email'}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>

          {/* Phone Field */}
          <TouchableOpacity 
            style={[styles.fieldItem, { borderBottomColor: colors.border }]}
            onPress={() => !isEditing && setIsEditing(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone</Text>
            {isEditing ? (
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={editedUser.phone}
                onChangeText={(text) => setEditedUser({ ...editedUser, phone: text })}
                placeholder="Enter your phone"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            ) : (
              <View style={styles.fieldValueContainer}>
                <Text style={[styles.fieldValue, { color: colors.text }]}>{user?.phone || 'Add phone'}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>

          {/* Address Field */}
          <TouchableOpacity 
            style={[styles.fieldItem, { borderBottomWidth: 0 }]}
            onPress={() => !isEditing && setIsEditing(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Address</Text>
            {isEditing ? (
              <TextInput
                style={[styles.fieldInput, { color: colors.text, minHeight: 60 }]}
                value={editedUser.address}
                onChangeText={(text) => setEditedUser({ ...editedUser, address: text })}
                placeholder="Enter your address"
                placeholderTextColor={colors.textSecondary}
                multiline
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.fieldValueContainer}>
                <Text style={[styles.fieldValue, { color: colors.text }]} numberOfLines={1}>
                  {user?.address || 'Add address'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Edit/Cancel Buttons - Only show when not editing */}
        {!isEditing && (
          <TouchableOpacity 
            style={[styles.editProfileButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setIsEditing(true)}
          >
            <Text style={[styles.editProfileText, { color: colors.text }]}>Edit Profile</Text>
          </TouchableOpacity>
        )}

        {/* Cancel Button - Only show when editing */}
        {isEditing && (
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleCancel}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        )}

        {/* Legal Links & Actions */}
        {!isEditing && (
          <>
            {/* Legal Section */}
            <View style={[styles.legalSection, { backgroundColor: colors.surface, marginHorizontal: SIZES.lg, borderRadius: 12, marginTop: SIZES.xl, marginBottom: SIZES.md }]}>
              <TouchableOpacity 
                style={[styles.legalItem, { borderBottomColor: colors.border }]}
                onPress={() => Linking.openURL('https://www.manime.co.uk/privacy.html')}
                activeOpacity={0.7}
              >
                <View style={styles.legalItemContent}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.legalItemText, { color: colors.text }]}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.legalItem}
                onPress={() => Linking.openURL('https://www.manime.co.uk/terms.html')}
                activeOpacity={0.7}
              >
                <View style={styles.legalItemContent}>
                  <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.legalItemText, { color: colors.text }]}>Terms & Conditions</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Biometric Security Section */}
            {biometricSupported && (
              <View style={[styles.legalSection, { backgroundColor: colors.surface, marginHorizontal: SIZES.lg, borderRadius: 12, marginBottom: SIZES.md }]}>
                <View style={[styles.legalItem, { borderBottomWidth: 0 }]}>
                  <View style={styles.legalItemContent}>
                    <Ionicons 
                      name={biometricName === 'Face ID' ? 'scan-outline' : 'finger-print-outline'} 
                      size={20} 
                      color={biometricEnabled ? colors.secondary : colors.textSecondary} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.legalItemText, { color: colors.text }]}>{biometricName} Login</Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        Quick and secure app unlock
                      </Text>
                    </View>
                  </View>
                  {biometricLoading ? (
                    <ActivityIndicator size="small" color={colors.secondary} />
                  ) : (
                    <Switch
                      value={biometricEnabled}
                      onValueChange={handleBiometricToggle}
                      trackColor={{ false: colors.border, true: colors.secondary + '50' }}
                      thumbColor={biometricEnabled ? colors.secondary : '#f4f3f4'}
                    />
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.supportButton, { backgroundColor: colors.secondary + '15', borderColor: colors.secondary }]}
              onPress={() => navigation.navigate('Chat', { 
                shipment_id: null, 
                driver_name: 'Support Team', 
                tracking_number: 'SUPPORT' 
              })}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.secondary} />
              <Text style={[styles.supportText, { color: colors.secondary }]}>Contact Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: '#EF4444' }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={[styles.logoutText, { color: '#EF4444' }]}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 60 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 16,
    paddingHorizontal: SIZES.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: SIZES.sm,
    marginLeft: -4,
  },
  title: {
    fontSize: 20,
    ...FONTS.bold,
    flex: 1,
  },
  doneButton: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
  },
  doneText: {
    fontSize: 16,
    ...FONTS.semiBold,
  },
  container: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: SIZES.xl * 1.5,
    paddingHorizontal: SIZES.lg,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  editOverlayText: {
    color: '#FFFFFF',
    fontSize: 13,
    ...FONTS.medium,
  },
  changePhotoButton: {
    marginTop: SIZES.md,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
  },
  changePhotoText: {
    fontSize: 15,
    ...FONTS.semiBold,
  },
  fieldsContainer: {
    marginHorizontal: SIZES.lg,
    backgroundColor: 'transparent',
  },
  fieldItem: {
    paddingVertical: SIZES.lg,
    borderBottomWidth: 1,
  },
  fieldLabel: {
    fontSize: 13,
    ...FONTS.medium,
    marginBottom: 8,
  },
  fieldInput: {
    fontSize: 17,
    ...FONTS.regular,
    paddingVertical: 0,
  },
  fieldValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontSize: 17,
    ...FONTS.regular,
    flex: 1,
  },
  editProfileButton: {
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.xl,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 16,
    ...FONTS.semiBold,
  },
  cancelButton: {
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.md,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    ...FONTS.semiBold,
  },
  supportButton: {
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.xl,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  supportText: {
    fontSize: 16,
    ...FONTS.semiBold,
  },
  logoutButton: {
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.xl,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    ...FONTS.semiBold,
  },
  legalSection: {
    overflow: 'hidden',
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.md,
    borderBottomWidth: 1,
  },
  legalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legalItemText: {
    fontSize: 16,
    ...FONTS.medium,
  },
});
