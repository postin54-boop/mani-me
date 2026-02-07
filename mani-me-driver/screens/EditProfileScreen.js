import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        userId: user?.id || user?._id,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        vehicle_number: vehicle.trim() || undefined,
      };

      const response = await apiClient.put('/auth/update-profile', payload);

      // Update user in AuthContext so profile reflects changes immediately
      const updatedUser = response.data?.user;
      if (updatedUser) {
        setUser(prev => ({ ...prev, ...updatedUser }));
      } else {
        // Fallback: merge locally
        setUser(prev => ({
          ...prev,
          fullName: name.trim(),
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          vehicle_number: vehicle.trim(),
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
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 18 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 6, fontSize: 16 },
  saveButton: { marginTop: 32, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '700' },
});
