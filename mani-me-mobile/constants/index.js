
// Brand color system for Booking/Payment screens (2025)
export const COLORS = {
	primary: '#0A2A5E',     // Mani-Me blue
	background: '#F9FAFB',
	card: '#FFFFFF',
	text: '#111827',
	muted: '#6B7280',
	border: '#E5E7EB',
	success: '#16A34A'
};

// Item types for BookingScreen (no typing)
export const ITEM_TYPES = [
	{ label: 'Clothes (Box)', value: 'clothes_box' },
	{ label: 'Rice Bag (25kg)', value: 'rice_25kg' },
	{ label: 'Rice Bag (50kg)', value: 'rice_50kg' },
	{ label: 'Groceries (Mixed)', value: 'groceries' },
	{ label: 'TV / Electronics', value: 'electronics' },
	{ label: 'Drum / Barrel', value: 'drum' },
	{ label: 'Suitcase', value: 'suitcase' },
	{ label: 'Other', value: 'other' },
];

import { getColors, SIZES, FONTS, SHADOWS } from './theme';
const colors = getColors ? getColors(false) : {};

export { colors, SIZES, FONTS, SHADOWS };
