import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/theme';

export default function EditProfileScreen({ navigation, route }) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { profile } = route.params;
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [vehicle, setVehicle] = useState(profile.vehicle);

  const handleSave = () => {
    // TODO: Save profile changes to backend
    navigation.goBack();
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
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
          <Text style={[styles.saveButtonText, { color: colors.accent }]}>Save Changes</Text>
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
