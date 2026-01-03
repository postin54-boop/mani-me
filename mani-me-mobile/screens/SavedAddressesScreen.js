import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../src/api';
import { useUser } from '../context/UserContext';
import { useThemeColors, SIZES, FONTS, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SavedAddressesScreen({ navigation }) {
  const { user } = useUser();
  const { colors, isDark } = useThemeColors();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ houseNumber: '', postCode: '', city: '', phone: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await getAddresses(user.id);
      setAddresses(res.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleSave = async () => {
    if (!form.houseNumber || !form.city) {
      Alert.alert('Validation', 'House Number and City are required');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await updateAddress(editingId, form);
      } else {
        await createAddress({ ...form, userId: user.id });
      }
      setForm({ houseNumber: '', postCode: '', city: '', phone: '' });
      setEditingId(null);
      fetchAddresses();
    } catch (e) {
      Alert.alert('Error', 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address) => {
    setForm(address);
    setEditingId(address._id);
  };

  const handleDelete = async (addressId) => {
    setLoading(true);
    try {
      await deleteAddress(addressId);
      fetchAddresses();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}> 
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: SIZES.xxl, paddingBottom: SIZES.md, backgroundColor: colors.primary }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: SIZES.md }}>
          <Ionicons name="arrow-back" size={SIZES.iconMd} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.accent, flex: 1 }]}>Saved Addresses</Text>
      </View>
      <View style={[styles.form, { backgroundColor: colors.surface, ...SHADOWS.small, marginBottom: SIZES.lg, position: 'relative', bottom: undefined, left: undefined, right: undefined, zIndex: undefined }] }>
        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: SIZES.body, marginBottom: SIZES.xs }}>Add / Edit Address</Text>
        <TextInput placeholder="House No." value={form.houseNumber} onChangeText={t => setForm(f => ({ ...f, houseNumber: t }))} style={[styles.input, { color: colors.text, borderColor: colors.border, fontSize: SIZES.h4, ...FONTS.regular }]} placeholderTextColor={colors.textLight} />
        <TextInput placeholder="Post Code" value={form.postCode} onChangeText={t => setForm(f => ({ ...f, postCode: t }))} style={[styles.input, { color: colors.text, borderColor: colors.border, fontSize: SIZES.h4, ...FONTS.regular }]} placeholderTextColor={colors.textLight} />
        <TextInput placeholder="City" value={form.city} onChangeText={t => setForm(f => ({ ...f, city: t }))} style={[styles.input, { color: colors.text, borderColor: colors.border, fontSize: SIZES.h4, ...FONTS.regular }]} placeholderTextColor={colors.textLight} />
        <TextInput placeholder="Phone No." value={form.phone} onChangeText={t => setForm(f => ({ ...f, phone: t }))} style={[styles.input, { color: colors.text, borderColor: colors.border, fontSize: SIZES.h4, ...FONTS.regular }]} placeholderTextColor={colors.textLight} />
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]} disabled={loading}>
          <Text style={{ color: colors.accent, fontWeight: '600', fontSize: SIZES.h4, ...FONTS.semiBold }}>{editingId ? 'Update' : 'Add'} Address</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        contentContainerStyle={{ paddingBottom: 180 }}
        data={addresses}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleEdit(item)} activeOpacity={0.8}>
            <View style={[styles.addressCard, { backgroundColor: colors.surface, ...SHADOWS.small }] }>
              <Text style={[styles.label, { color: colors.primary }]}>{item.houseNumber}, {item.postCode}, {item.city}</Text>
              <Text style={{ color: colors.textSecondary }}>{item.phone}</Text>
              <View style={styles.row}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.editBtn, { backgroundColor: colors.secondary }]}><Text style={{ color: colors.accent }}>Edit</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id)} style={[styles.deleteBtn, { backgroundColor: colors.error }]}><Text style={{ color: colors.accent }}>Delete</Text></TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: SIZES.lg }}>No addresses saved.</Text>}
        refreshing={loading}
        onRefresh={fetchAddresses}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SIZES.md },
  title: { fontSize: SIZES.h3, fontWeight: '700', marginBottom: SIZES.sm },
  addressCard: { padding: SIZES.md, borderRadius: SIZES.radiusMd, marginBottom: SIZES.sm },
  label: { fontWeight: 'bold', fontSize: SIZES.body },
  row: { flexDirection: 'row', marginTop: SIZES.sm },
  editBtn: { marginRight: SIZES.sm, padding: SIZES.xs, borderRadius: SIZES.radiusSm },
  deleteBtn: { padding: SIZES.xs, borderRadius: SIZES.radiusSm },
  form: { marginTop: SIZES.lg, padding: SIZES.md, borderRadius: SIZES.radiusMd },
  input: { backgroundColor: 'transparent', borderWidth: 1, borderRadius: SIZES.radiusSm, padding: SIZES.sm, marginBottom: SIZES.sm },
  saveBtn: { padding: SIZES.md, borderRadius: SIZES.radiusMd, alignItems: 'center', marginTop: SIZES.sm },
});
