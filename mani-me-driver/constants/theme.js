import { useColorScheme } from 'react-native';

// Brand Colors - Consistent across all Mani Me apps
export const BRAND_COLORS = {
  primary: '#0B1A33',    // Navy Blue
  secondary: '#83C5FA',  // Sky Blue
  accent: '#FFFFFF',     // White
  deepNavy: '#071D33',   // Deep Navy for premium backgrounds
};

// Light Mode Colors
export const LIGHT_COLORS = {
  primary: BRAND_COLORS.primary,
  secondary: BRAND_COLORS.secondary,
  accent: BRAND_COLORS.accent,
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
};

// Dark Mode Colors
export const DARK_COLORS = {
  primary: BRAND_COLORS.secondary,  // Sky blue becomes primary in dark mode
  secondary: BRAND_COLORS.primary,  // Navy becomes secondary
  accent: BRAND_COLORS.accent,
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  border: '#374151',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
};

// Helper function to get colors based on theme
export const getColors = (isDark) => {
  return isDark ? DARK_COLORS : LIGHT_COLORS;
};

// Custom hook for theme colors
export const useThemeColors = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    colors: getColors(isDark),
    isDark,
  };
};

// Typography
export const TYPOGRAPHY = {
  h1: { fontSize: 34, fontWeight: '700', lineHeight: 41 },
  h2: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h3: { fontSize: 24, fontWeight: '600', lineHeight: 29 },
  h4: { fontSize: 20, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
};
