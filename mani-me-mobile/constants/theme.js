// Theme configuration for Mani Me app
// Uber-style minimal flat design with navy blue branding

import { useColorScheme } from 'react-native';

// Brand Colors
export const BRAND_COLORS = {
  primary: '#0B1A33',        // Navy Blue - Primary brand color
  secondary: '#83C5FA',      // Sky Blue - Secondary brand color
  accent: '#FFFFFF',         // White - Accent color
};

// Light Theme Colors
const LIGHT_COLORS = {
  // Primary brand colors
  primary: BRAND_COLORS.primary,
  primaryLight: '#152847',
  primaryDark: '#06101F',
  
  // Secondary colors
  secondary: BRAND_COLORS.secondary,
  secondaryLight: '#A8D8FC',
  secondaryDark: '#5EB3F8',
  
  // Accent
  accent: BRAND_COLORS.accent,
  
  // Status colors - Uber-style minimal
  success: '#10B981',        // Green
  warning: '#F59E0B',        // Amber
  error: '#EF4444',          // Red
  info: '#83C5FA',           // Sky Blue
  
  // Neutral colors - Light mode
  background: '#F9FAFB',     // Light gray background
  surface: '#FFFFFF',        // White cards/surfaces
  surfaceAlt: '#F3F4F6',     // Alternate surface
  border: '#E5E7EB',         // Light gray borders
  borderLight: '#F3F4F6',    // Very light borders
  
  // Text colors - Light mode
  text: '#0B1A33',           // Navy blue text
  textSecondary: '#6B7280',  // Gray
  textLight: '#9CA3AF',      // Light gray
  textInverse: '#FFFFFF',    // White text
  
  // Gradient colors
  gradientStart: '#0B1A33',  // Navy Blue
  gradientEnd: '#83C5FA',    // Sky Blue
};

// Dark Theme Colors
const DARK_COLORS = {
  // Primary brand colors
  primary: '#83C5FA',        // Sky Blue becomes primary in dark mode
  primaryLight: '#A8D8FC',
  primaryDark: '#5EB3F8',
  
  // Secondary colors
  secondary: '#0B1A33',      // Navy Blue becomes secondary
  secondaryLight: '#152847',
  secondaryDark: '#06101F',
  
  // Accent
  accent: '#FFFFFF',
  
  // Status colors - Same as light mode
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#83C5FA',
  
  // Neutral colors - Dark mode
  background: '#0B1A33',     // Navy blue background
  surface: '#152847',        // Dark navy cards/surfaces
  surfaceAlt: '#1F3A5F',     // Lighter surface
  border: '#2A4A6F',         // Dark borders
  borderLight: '#1F3A5F',    // Very light borders
  
  // Text colors - Dark mode
  text: '#FFFFFF',           // White text
  textSecondary: '#9CA3AF',  // Light gray
  textLight: '#6B7280',      // Gray
  textInverse: '#0B1A33',    // Navy text
  
  // Gradient colors
  gradientStart: '#0B1A33',  // Navy Blue
  gradientEnd: '#83C5FA',    // Sky Blue
};

// Function to get colors based on theme
export const getColors = (isDark) => isDark ? DARK_COLORS : LIGHT_COLORS;

// Export default as light theme (will be updated dynamically)
export const COLORS = LIGHT_COLORS;

export const SIZES = {
  // Font sizes - Uber-style hierarchy
  h1: 34,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  h6: 16,
  body: 16,
  bodySmall: 14,
  caption: 12,
  tiny: 10,
  
  // Spacing - Consistent 8px grid
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Border radius - Uber-style rounded
  radiusXs: 4,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 9999,
  
  // Icon sizes
  iconXs: 16,
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 48,
  iconXxl: 64,
};

export const SHADOWS = {
  // Minimal shadows for flat design
  none: {},
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const FONTS = {
  // Font weights - Clean typography
  regular: {
    fontWeight: '400',
  },
  medium: {
    fontWeight: '500',
  },
  semiBold: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  },
};

export const SPACING = {
  container: {
    paddingHorizontal: SIZES.md,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  card: {
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
};

// Uber-style animation timings
export const ANIMATIONS = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Hook to get theme-aware colors
export const useThemeColors = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return { colors: getColors(isDark), isDark };
};
