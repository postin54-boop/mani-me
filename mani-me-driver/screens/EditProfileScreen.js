import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../utils/firebase';
import { useThemeColors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';

export default function EditProfileScreen({ navigation, route }) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { profile } = route.params;
  const { user, setUser } = useAuth();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone === 'Not provided' ? '' : profile.phone);
  const [email, setEmail] = useState(profile.email === 'Not provided' ? '' : profile.email);
  const [vehicle, setVehicle] = useState(profile.vehicle === 'Not assigned' ? '' : profile.vehicle);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [saving, setSaving] = useState(false);

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['image'],
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
    Alert.alert('Profile Picture', 'Choose an option', [
      { text: 'Take Photo', onPress: takeProfilePhoto },
      { text: 'Choose from Gallery', onPress: pickProfileImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = user?.profileImage || null;

      // Upload new profile image to Firebase Storage if changed
      if (profileImage && profileImage !== user?.profileImage && !profileImage.startsWith('http')) {
        try {
          const response = await fetch(profileImage);
          const blob = await response.blob();
          const filename = `profile_images/driver_${user?.id || user?._id}_${Date.now()}.jpg`;
          const storageRef = ref(storage, filename);
          await uploadBytes(storageRef, blob);
          imageUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          Alert.alert('Warning', 'Could not upload profile picture, but other changes will be saved');
        }
      }

      const payload = {
        userId: user?.id || user?._id,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        vehicle_number: vehicle.trim() || undefined,
        profileImage: imageUrl,
      };

      const response = await apiClient.put('/auth/update-profile', payload);

      // Update user in AuthContext so profile reflects changes immediately
      const updatedUser = response.data?.user;
      if (updatedUser) {
        setUser(prev => ({ ...prev, ...updatedUser, profileImage: imageUrl }));
      } else {
        // Fallback: merge locally
        setUser(prev => ({
          ...prev,
          fullName: name.trim(),
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          vehicle_number: vehicle.trim(),
          profileImage: imageUrl,
        }));
      }

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to update profile';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
      </View>
      
      {/* Profile Image Section */}
      <TouchableOpacity style={styles.imageSection} onPress={showImageOptions}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImage, styles.profileImagePlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.initials}>{getInitials(name)}</Text>
          </View>
        )}
        <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="camera" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
      <Text style={[styles.imageHint, { color: colors.textSecondary }]}>Tap to change photo</Text>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={name} onChangeText={setName} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Vehicle</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={vehicle} onChangeText={setVehicle} />
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.accent }]}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  backButton: { padding: 8, marginRight: 12, marginLeft: -4 },
  title: { fontSize: 22, fontWeight: '700' },
  imageSection: { alignSelf: 'center', marginTop: 16, position: 'relative' },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  profileImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#fff', fontSize: 36, fontWeight: '700' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  imageHint: { textAlign: 'center', marginTop: 8, fontSize: 13 },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 18 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 6, fontSize: 16 },
  saveButton: { marginTop: 32, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '700' },
});

