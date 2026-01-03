import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useThemeColors, SIZES } from '../constants/theme';

export default function ItemCategoryModal({ visible, onClose, onSelect, categories }) {
  const { colors } = useThemeColors();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>  
          <Text style={[styles.title, { color: colors.text }]}>Select Item Category</Text>
          <ScrollView>
            {categories.map((group) => (
              <View key={group.title} style={styles.group}>
                <Text style={[styles.groupTitle, { color: colors.secondary }]}>{group.title}</Text>
                {group.items.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.itemButton}
                    onPress={() => onSelect(item)}
                  >
                    <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label}</Text>
                    {item.size && (
                      <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>{item.size} {item.weight ? `• ~${item.weight}kg` : ''}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    maxHeight: '80%',
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    marginBottom: SIZES.md,
  },
  group: {
    marginBottom: SIZES.md,
  },
  groupTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    marginBottom: SIZES.xs,
  },
  itemButton: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radiusSm,
    marginBottom: 2,
  },
  itemLabel: {
    fontSize: SIZES.body,
  },
  itemMeta: {
    fontSize: SIZES.caption,
  },
  closeButton: {
    alignItems: 'center',
    marginTop: SIZES.md,
    padding: SIZES.sm,
  },
});
