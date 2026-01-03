import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, StatusBar, TextInput, ActivityIndicator, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../context/UserContext';
import { updateProfile, updateEmail } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { updateDoc, doc } from 'firebase/firestore';
import { useThemeColors, SIZES, FONTS, SHADOWS } from '../constants/theme';

export default function ProfileScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useUser();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const takeProfilePhoto = async () => {
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
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takeProfilePhoto },
        { text: 'Choose from Gallery', onPress: pickProfileImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = async () => {
    if (!editedUser.name || !editedUser.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    setIsSaving(true);
    try {
      // Update Firebase Auth profile
      if (auth.currentUser) {
        // Update displayName
        await updateProfile(auth.currentUser, { displayName: editedUser.name });
        // Update email if changed
        if (auth.currentUser.email !== editedUser.email) {
          await updateEmail(auth.currentUser, editedUser.email);
        }
        // Update Firestore profile
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          fullName: editedUser.name,
          phone: editedUser.phone,
          address: editedUser.address,
          profileImage: profileImage || '',
        });
      }
      // Update local user context
      updateUser({ ...user, ...editedUser, profileImage });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </View>
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
                style={[styles.fieldInput, { color: colors.text }]}
                value={editedUser.address}
                onChangeText={(text) => setEditedUser({ ...editedUser, address: text })}
                placeholder="Enter your address"
                placeholderTextColor={colors.textSecondary}
                multiline
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

        {/* Logout Button */}
        {!isEditing && (
          <>
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
    </View>
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
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
});
