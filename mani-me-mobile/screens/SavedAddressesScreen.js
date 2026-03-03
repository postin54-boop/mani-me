import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getAddresses(user.id);
      setAddresses(res?.data || []);
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
        await createAddress({ ...form, userId: user?.id });
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
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteAddress(addressId);
              fetchAddresses();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete address');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.formContainer}>
      <View style={[styles.form, { backgroundColor: colors.surface }]}>
        <Text style={[styles.formTitle, { color: colors.text }]}>
          {editingId ? 'Edit Address' : 'Add New Address'}
        </Text>
        <TextInput 
          placeholder="House No. / Street" 
          value={form.houseNumber} 
          onChangeText={t => setForm(f => ({ ...f, houseNumber: t }))} 
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} 
          placeholderTextColor={colors.textLight} 
        />
        <TextInput 
          placeholder="Post Code" 
          value={form.postCode} 
          onChangeText={t => setForm(f => ({ ...f, postCode: t }))} 
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} 
          placeholderTextColor={colors.textLight}
          autoCapitalize="characters"
        />
        <TextInput 
          placeholder="City" 
          value={form.city} 
          onChangeText={t => setForm(f => ({ ...f, city: t }))} 
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} 
          placeholderTextColor={colors.textLight} 
        />
        <TextInput 
          placeholder="Phone Number" 
          value={form.phone} 
          onChangeText={t => setForm(f => ({ ...f, phone: t }))} 
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} 
          placeholderTextColor={colors.textLight}
          keyboardType="phone-pad"
        />
        <View style={styles.buttonRow}>
          {editingId && (
            <TouchableOpacity 
              onPress={() => {
                setForm({ houseNumber: '', postCode: '', city: '', phone: '' });
                setEditingId(null);
              }} 
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveBtn, { backgroundColor: colors.primary, flex: editingId ? 1 : undefined }]} 
            disabled={loading}
          >
            <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Add'} Address</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {addresses.length > 0 && (
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Addresses</Text>
      )}
    </View>
  );

  const renderAddressCard = ({ item }) => (
    <View style={[styles.addressCard, { backgroundColor: colors.surface }]}>
      <View style={styles.addressInfo}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="location" size={20} color={colors.primary} />
        </View>
        <View style={styles.addressText}>
          <Text style={[styles.addressMain, { color: colors.text }]}>
            {item.houseNumber}, {item.city}
          </Text>
          <Text style={[styles.addressSub, { color: colors.textSecondary }]}>
            {item.postCode}
          </Text>
          {item.phone && (
            <Text style={[styles.addressPhone, { color: colors.textSecondary }]}>
              📞 {item.phone}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity 
          onPress={() => handleEdit(item)} 
          style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
        >
          <Ionicons name="pencil" size={16} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDelete(item._id)} 
          style={[styles.actionBtn, { backgroundColor: '#FF3B3015' }]}
        >
          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={addresses}
          keyExtractor={item => item._id}
          renderItem={renderAddressCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No saved addresses yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
                Add your first address above
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchAddresses}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 32,
  },
  formContainer: {
    padding: 16,
  },
  form: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  saveBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  addressCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressText: {
    flex: 1,
  },
  addressMain: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  addressSub: {
    fontSize: 14,
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 13,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
});
