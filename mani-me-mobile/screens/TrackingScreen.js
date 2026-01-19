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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/theme';
import { API_BASE_URL } from '../utils/config';

// Tracking steps configuration with icons and labels
const TRACKING_STEPS = [
	{ key: 'booked', label: 'Order Placed', icon: 'receipt-outline', description: 'Your order has been confirmed' },
	{ key: 'pending_pickup', label: 'Awaiting Pickup', icon: 'time-outline', description: 'Waiting for driver assignment' },
	{ key: 'driver_assigned', label: 'Driver Assigned', icon: 'person-outline', description: 'A driver has been assigned' },
	{ key: 'driver_en_route', label: 'Driver En Route', icon: 'car-outline', description: 'Driver is on the way to collect' },
	{ key: 'picked_up', label: 'Parcel Collected', icon: 'checkmark-circle-outline', description: 'Your parcel has been picked up' },
	{ key: 'at_uk_warehouse', label: 'At UK Warehouse', icon: 'business-outline', description: 'Arrived at UK processing centre' },
	{ key: 'processing', label: 'Processing', icon: 'cube-outline', description: 'Being sorted and packed' },
	{ key: 'departed_uk', label: 'Departed UK', icon: 'airplane-outline', description: 'Shipped from United Kingdom' },
	{ key: 'in_transit', label: 'In Transit', icon: 'boat-outline', description: 'On the way to Ghana' },
	{ key: 'arrived_ghana', label: 'Arrived in Ghana', icon: 'flag-outline', description: 'Arrived at Ghana warehouse' },
	{ key: 'customs', label: 'Customs', icon: 'shield-checkmark-outline', description: 'Undergoing customs clearance' },
	{ key: 'customs_cleared', label: 'Customs Cleared', icon: 'checkmark-done-outline', description: 'Cleared for delivery' },
	{ key: 'out_for_delivery', label: 'Out for Delivery', icon: 'bicycle-outline', description: 'On the way to recipient' },
	{ key: 'delivered', label: 'Delivered', icon: 'home-outline', description: 'Successfully delivered!' },
];

// Status color mapping
const getStatusColor = (status) => {
	const colors = {
		booked: '#3B82F6',
		pending_pickup: '#F59E0B',
		driver_assigned: '#8B5CF6',
		driver_en_route: '#8B5CF6',
		picked_up: '#10B981',
		at_uk_warehouse: '#06B6D4',
		processing: '#06B6D4',
		departed_uk: '#6366F1',
		in_transit: '#6366F1',
		arrived_ghana: '#10B981',
		customs: '#F59E0B',
		customs_cleared: '#10B981',
		out_for_delivery: '#EC4899',
		delivered: '#10B981',
		cancelled: '#EF4444',
		on_hold: '#F59E0B',
		returned: '#EF4444',
	};
	return colors[status] || '#6B7280';
};

export default function TrackingScreen({ route, navigation }) {
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
			const response = await fetch(
				`${API_BASE_URL}/api/shipments/track/${tracking_number}`
			);
			const json = await response.json();
			if (json?.shipment) {
				setShipmentData(json.shipment);
			} else if (json?.error) {
				setError(json.error);
			} else {
				setError('Shipment not found');
			}
		} catch (err) {
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

	// Get current step index
	const getCurrentStepIndex = () => {
		if (!shipmentData?.status) return 0;
		const index = TRACKING_STEPS.findIndex(step => step.key === shipmentData.status);
		return index >= 0 ? index : 0;
	};

	// Format date
	const formatDate = (dateString) => {
		if (!dateString) return null;
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { 
			day: 'numeric', 
			month: 'short', 
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	// Get timestamp for a step
	const getStepTimestamp = (stepKey) => {
		if (!shipmentData) return null;
		const timestampKey = `${stepKey}_at`;
		return shipmentData[timestampKey] ? formatDate(shipmentData[timestampKey]) : null;
	};

	if (error) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
				<View style={[styles.center, { backgroundColor: colors.background }]}> 
					<Ionicons name="alert-circle-outline" size={64} color={colors.textLight} />
					<Text style={{ color: colors.text, marginTop: 16, fontSize: 16 }}>{error}</Text>
					<TouchableOpacity 
						onPress={() => navigation.goBack()}
						style={[styles.retryBtn, { backgroundColor: colors.primary }]}
					>
						<Text style={{ color: '#FFF', fontWeight: '600' }}>Go Back</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	if (!shipmentData) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
				<View style={[styles.center, { backgroundColor: colors.background }]}> 
					<Ionicons name="cube-outline" size={48} color={colors.primary} />
					<Text style={{ color: colors.text, marginTop: 16 }}>Loading tracking data...</Text>
					<Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>
						{tracking_number || 'N/A'}
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	const currentStepIndex = getCurrentStepIndex();
	const currentStatus = shipmentData.status || 'booked';
	const statusColor = getStatusColor(currentStatus);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }} edges={['top']}>
			<StatusBar barStyle="light-content" />
			
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity 
					style={styles.backBtn} 
					onPress={() => navigation.goBack()}
				>
					<Ionicons name="arrow-back" size={24} color="#FFF" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Track Parcel</Text>
				<TouchableOpacity onPress={onRefresh}>
					<Ionicons name="refresh" size={24} color="#FFF" />
				</TouchableOpacity>
			</View>

			<ScrollView
				style={{ flex: 1, backgroundColor: colors.background }}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
				}
				showsVerticalScrollIndicator={false}
			>
				{/* Tracking Number Card */}
				<View style={[styles.trackingCard, { backgroundColor: colors.surface }]}>
					<Text style={[styles.trackingLabel, { color: colors.textSecondary }]}>Tracking Number</Text>
					<Text style={[styles.trackingNumber, { color: colors.primary }]}>{tracking_number}</Text>
					
					{/* Current Status Badge */}
					<View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
						<View style={[styles.statusDot, { backgroundColor: statusColor }]} />
						<Text style={[styles.statusText, { color: statusColor }]}>
							{currentStatus.replace(/_/g, ' ').toUpperCase()}
						</Text>
					</View>
				</View>

				{/* Timeline */}
				<View style={[styles.timelineCard, { backgroundColor: colors.surface }]}>
					<Text style={[styles.sectionTitle, { color: colors.text }]}>Shipment Progress</Text>
					
					{TRACKING_STEPS.map((step, index) => {
						const isCompleted = index <= currentStepIndex;
						const isCurrent = index === currentStepIndex;
						const timestamp = getStepTimestamp(step.key);
						
						return (
							<View key={step.key} style={styles.timelineItem}>
								{/* Timeline Line */}
								{index < TRACKING_STEPS.length - 1 && (
									<View style={[
										styles.timelineLine,
										{ backgroundColor: isCompleted ? colors.primary : colors.border }
									]} />
								)}
								
								{/* Icon Circle */}
								<View style={[
									styles.iconCircle,
									{ 
										backgroundColor: isCompleted ? colors.primary : colors.background,
										borderColor: isCompleted ? colors.primary : colors.border,
									}
								]}>
									<Ionicons 
										name={isCompleted ? 'checkmark' : step.icon} 
										size={16} 
										color={isCompleted ? '#FFF' : colors.textLight} 
									/>
								</View>
								
								{/* Content */}
								<View style={styles.timelineContent}>
									<View style={styles.timelineHeader}>
										<Text style={[
											styles.stepLabel,
											{ 
												color: isCompleted ? colors.text : colors.textLight,
												fontWeight: isCurrent ? '700' : '500'
											}
										]}>
											{step.label}
										</Text>
										{isCurrent && (
											<View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
												<Text style={styles.currentText}>Current</Text>
											</View>
										)}
									</View>
									<Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
										{step.description}
									</Text>
									{timestamp && (
										<Text style={[styles.timestamp, { color: colors.textLight }]}>
											{timestamp}
										</Text>
									)}
								</View>
							</View>
						);
					})}
				</View>

				{/* Parcel Details */}
				<View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
					<Text style={[styles.sectionTitle, { color: colors.text }]}>Parcel Details</Text>
					
					<View style={styles.detailRow}>
						<View style={styles.detailItem}>
							<Ionicons name="person-outline" size={20} color={colors.primary} />
							<View style={styles.detailText}>
								<Text style={[styles.detailLabel, { color: colors.textSecondary }]}>From</Text>
								<Text style={[styles.detailValue, { color: colors.text }]}>{shipmentData.sender_name || '—'}</Text>
							</View>
						</View>
						<View style={styles.detailItem}>
							<Ionicons name="location-outline" size={20} color={colors.primary} />
							<View style={styles.detailText}>
								<Text style={[styles.detailLabel, { color: colors.textSecondary }]}>To</Text>
								<Text style={[styles.detailValue, { color: colors.text }]}>{shipmentData.receiver_name || '—'}</Text>
							</View>
						</View>
					</View>

					<View style={[styles.divider, { backgroundColor: colors.border }]} />

					<View style={styles.detailRow}>
						<View style={styles.detailItem}>
							<Ionicons name="scale-outline" size={20} color={colors.primary} />
							<View style={styles.detailText}>
								<Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Weight</Text>
								<Text style={[styles.detailValue, { color: colors.text }]}>{shipmentData.weight_kg || 0} kg</Text>
							</View>
						</View>
						<View style={styles.detailItem}>
							<Ionicons name="cash-outline" size={20} color={colors.primary} />
							<View style={styles.detailText}>
								<Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Cost</Text>
								<Text style={[styles.detailValue, { color: colors.text }]}>£{shipmentData.total_cost || 0}</Text>
							</View>
						</View>
					</View>

					{shipmentData.delivery_city && (
						<>
							<View style={[styles.divider, { backgroundColor: colors.border }]} />
							<View style={styles.addressRow}>
								<Ionicons name="navigate-outline" size={20} color={colors.primary} />
								<View style={{ flex: 1, marginLeft: 12 }}>
									<Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Destination</Text>
									<Text style={[styles.detailValue, { color: colors.text }]}>
										{[shipmentData.delivery_city, shipmentData.delivery_region].filter(Boolean).join(', ')}
									</Text>
								</View>
							</View>
						</>
					)}
				</View>

				{/* Need Help */}
				<TouchableOpacity 
					style={[styles.helpCard, { backgroundColor: colors.surface }]}
					onPress={() => navigation.navigate('HelpSupport')}
				>
					<Ionicons name="help-circle-outline" size={24} color={colors.primary} />
					<View style={{ flex: 1, marginLeft: 12 }}>
						<Text style={[styles.helpTitle, { color: colors.text }]}>Need Help?</Text>
						<Text style={[styles.helpText, { color: colors.textSecondary }]}>Contact our support team</Text>
					</View>
					<Ionicons name="chevron-forward" size={20} color={colors.textLight} />
				</TouchableOpacity>

				<View style={{ height: 32 }} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	retryBtn: {
		marginTop: 24,
		paddingHorizontal: 32,
		paddingVertical: 12,
		borderRadius: 8,
	},
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
		color: '#FFF',
	},
	trackingCard: {
		margin: 16,
		padding: 20,
		borderRadius: 16,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},
	trackingLabel: {
		fontSize: 12,
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	trackingNumber: {
		fontSize: 24,
		fontWeight: '700',
		marginTop: 4,
	},
	statusBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 16,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 8,
	},
	statusText: {
		fontSize: 12,
		fontWeight: '600',
		letterSpacing: 0.5,
	},
	timelineCard: {
		marginHorizontal: 16,
		marginBottom: 16,
		padding: 20,
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 20,
	},
	timelineItem: {
		flexDirection: 'row',
		marginBottom: 24,
		position: 'relative',
	},
	timelineLine: {
		position: 'absolute',
		left: 15,
		top: 32,
		bottom: -24,
		width: 2,
	},
	iconCircle: {
		width: 32,
		height: 32,
		borderRadius: 16,
		borderWidth: 2,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1,
	},
	timelineContent: {
		flex: 1,
		marginLeft: 16,
		paddingTop: 4,
	},
	timelineHeader: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	stepLabel: {
		fontSize: 15,
	},
	currentBadge: {
		marginLeft: 8,
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 10,
	},
	currentText: {
		color: '#FFF',
		fontSize: 10,
		fontWeight: '600',
	},
	stepDescription: {
		fontSize: 13,
		marginTop: 2,
	},
	timestamp: {
		fontSize: 11,
		marginTop: 4,
	},
	detailsCard: {
		marginHorizontal: 16,
		marginBottom: 16,
		padding: 20,
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},
	detailRow: {
		flexDirection: 'row',
	},
	detailItem: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	detailText: {
		marginLeft: 12,
	},
	detailLabel: {
		fontSize: 12,
	},
	detailValue: {
		fontSize: 14,
		fontWeight: '500',
		marginTop: 2,
	},
	divider: {
		height: 1,
		marginVertical: 16,
	},
	addressRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	helpCard: {
		marginHorizontal: 16,
		padding: 16,
		borderRadius: 16,
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},
	helpTitle: {
		fontSize: 15,
		fontWeight: '600',
	},
	helpText: {
		fontSize: 13,
		marginTop: 2,
	},
});
