import React, { useEffect, useState } from 'react';
import logger from '../utils/logger';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	RefreshControl,
	TouchableOpacity,
	StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/theme';
import { API_BASE_URL } from '../utils/config';

export default function TrackingScreen({ route, navigation }) {
	// Support both { tracking_number } and { parcel } navigation params
	const { tracking_number: directTrackingNumber, parcel } = route.params || {};
	const tracking_number = directTrackingNumber || parcel?.tracking_number;
	const { colors, isDark } = useThemeColors();
	const [shipmentData, setShipmentData] = useState(parcel || null);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState(null);

	const fetchTracking = async () => {
		if (!tracking_number) {
			setError('No tracking number provided');
			return;
		}
		setError(null);
		try {
			console.log('[TrackingScreen] Fetching:', `${API_BASE_URL}/api/shipments/track/${tracking_number}`);
			const response = await fetch(
				`${API_BASE_URL}/api/shipments/track/${tracking_number}`
			);
			const json = await response.json();
			console.log('[TrackingScreen] Response:', JSON.stringify(json).substring(0, 200));
			if (json?.shipment) {
				setShipmentData(json.shipment);
			} else if (json?.error) {
				setError(json.error);
			} else {
				setError('Shipment not found');
			}
		} catch (err) {
			console.log('[TrackingScreen] Error:', err.message);
			logger.error('Tracking fetch error:', err);
			setError('Failed to load tracking data. Please check your connection.');
		}
	};

	useEffect(() => {
		fetchTracking();
	}, [tracking_number]);

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchTracking();
		setRefreshing(false);
	};

	if (error) {
		return (
			<View style={[styles.center, { backgroundColor: colors.background }]}> 
				<Text style={{ color: colors.text, marginBottom: 16 }}>{error}</Text>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={{ color: colors.secondary }}>← Go Back</Text>
				</TouchableOpacity>
			</View>
		);
	}

	if (!shipmentData) {
		return (
			<View style={[styles.center, { backgroundColor: colors.background }]}> 
				<Text style={{ color: colors.text }}>Loading tracking data...</Text>
				<Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>
					Tracking: {tracking_number || 'N/A'}
				</Text>
			</View>
		);
	}

	const trackingSteps = [
		'pickup_scheduled',
		'driver_on_way',
		'parcel_collected',
		'at_uk_warehouse',
		'departed_uk',
		'arrived_ghana',
		'out_for_delivery_ghana',
		'delivered',
	];

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
			
			{/* Header with Back Button */}
			<View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
				<TouchableOpacity 
					style={styles.backButtonHeader} 
					onPress={() => navigation.goBack()}
				>
					<Ionicons name="arrow-back" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>Parcel Tracking</Text>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView
				style={[styles.container, { backgroundColor: colors.background }]}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				<View style={styles.header}>
					<Text style={[styles.trackingNumber, { color: colors.secondary }]}>{tracking_number}</Text>
				</View>

			<View style={[styles.card, { backgroundColor: colors.surface }]}> 
				<Text style={[styles.statusText, { color: colors.text }]}>{shipmentData.status.replace(/_/g, ' ').toUpperCase()}</Text>
			</View>

			<View style={[styles.card, { backgroundColor: colors.surface }]}> 
				<Text style={[styles.sectionTitle, { color: colors.text }]}>Tracking Timeline</Text>
				{trackingSteps.map((step) => {
					const completed = trackingSteps.indexOf(step) <= trackingSteps.indexOf(shipmentData.status);
					return (
						<View key={step} style={styles.timelineRow}>
							<Text style={{ color: completed ? 'green' : colors.textSecondary }}>{completed ? '●' : '○'}</Text>
							<Text style={[styles.timelineText, { color: completed ? colors.text : colors.textSecondary }]}>{step.replace(/_/g, ' ')}</Text>
						</View>
					);
				})}
			</View>

			<View style={[styles.card, { backgroundColor: colors.surface }]}> 
				<Text style={[styles.sectionTitle, { color: colors.text }]}>Parcel Information</Text>
				<Info label="Sender" value={shipmentData.sender_name} colors={colors} />
				<Info label="Receiver" value={shipmentData.receiver_name} colors={colors} />
				<Info label="Weight" value={`${shipmentData.weight_kg} kg`} colors={colors} />
				<Info label="Total Cost" value={`£${shipmentData.total_cost}`} colors={colors} />
			</View>

			<View style={{ height: 30 }} />
			</ScrollView>
		</View>
	);
}

function Info({ label, value, colors }) {
	return (
		<View style={styles.infoRow}>
			<Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
			<Text style={[styles.infoValue, { color: colors.text }]}>{value || '—'}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingTop: 50,
		paddingBottom: 16,
		borderBottomWidth: 1,
	},
	backButtonHeader: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
	},
	header: {
		padding: 24,
		paddingTop: 16,
		alignItems: 'center',
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
	},
	trackingNumber: {
		fontSize: 22,
		fontWeight: '700',
		marginTop: 6,
	},
	card: {
		marginHorizontal: 16,
		marginBottom: 16,
		padding: 18,
		borderRadius: 14,
	},
	statusText: {
		fontSize: 20,
		fontWeight: '700',
		textAlign: 'center',
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 12,
	},
	timelineRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
	},
	timelineText: {
		marginLeft: 10,
		textTransform: 'capitalize',
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	infoLabel: {
		fontSize: 14,
	},
	infoValue: {
		fontSize: 14,
		fontWeight: '500',
	},
});
