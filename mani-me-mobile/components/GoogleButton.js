import React from 'react';
import { TouchableOpacity, Text, View, Image, StyleSheet } from 'react-native';
import { useThemeColors, SIZES, FONTS } from '../constants/theme';

export default function GoogleButton({ onPress, style, text = 'Continue with Google' }) {
  const { colors } = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={styles.iconContainer}>
        <Image
          source={require('../assets/google-icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: SIZES.radiusMd,
    height: 56,
    paddingHorizontal: SIZES.lg,
    marginVertical: SIZES.sm,
    justifyContent: 'center',
    ...FONTS.medium,
  },
  iconContainer: {
    width: 28,
    height: 28,
    backgroundColor: 'transparent',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  icon: {
    width: 24,
    height: 24,
  },
  text: {
    fontSize: SIZES.body,
    ...FONTS.medium,
  },
});
