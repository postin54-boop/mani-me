import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, StatusBar, Animated, Dimensions, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../context/AuthContext";
import { useCashTracking } from "../context/CashTrackingContext";
import { API_BASE_URL, ENDPOINTS } from "../utils/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

const BRAND = {
	primary: "#0B1A33",
	secondary: "#83C5FA",
	background: "#F5F7FA",
	card: "#FFFFFF",
	text: "#0B1A33",
	success: "#10B981",
	warning: "#F59E0B",
};

// Quick actions by role
const quickActionsUK = [
	{ label: "View Pickups", icon: "list", screen: "UKPickups", color: "#0B1A33" },
	{ label: "Record Cash", icon: "cash-outline", screen: "RecordCashPickup", color: "#10B981" },
	{ label: "Scan Parcel", icon: "qr-code", screen: "ScanParcelScreen", color: "#6366F1" },
	{ label: "Print Labels", icon: "print-outline", screen: "PrintLabelsScreen", color: "#8B5CF6" },
];

const quickActionsGH = [
	{ label: "Deliveries", icon: "list", screen: "GhanaDeliveries", color: "#0B1A33" },
	{ label: "Scan Parcel", icon: "qr-code", screen: "ScanParcelScreen", color: "#6366F1" },
	{ label: "Proof", icon: "camera-outline", screen: "ScanParcelScreen", color: "#EC4899" },
	{ label: "Alerts", icon: "notifications-outline", screen: "NotificationsScreen", color: "#F59E0B" },
];

export default function HomeScreen({ navigation }) {
	const insets = useSafeAreaInsets();
	const { user, isUKDriver, isGhanaDriver } = useContext(AuthContext);
	const { totalCash, cashCount } = useCashTracking();
	
	const [driverStatus, setDriverStatus] = useState("AVAILABLE");
	const [activeJob, setActiveJob] = useState(null);
	const [assignedJobsCount, setAssignedJobsCount] = useState(0);
	const [latestUpdates, setLatestUpdates] = useState([]);
	const [refreshing, setRefreshing] = useState(false);

	// Animations
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(30)).current;

	// Determine driver type
	const isUK = isUKDriver();
	const quickActions = isUK ? quickActionsUK : quickActionsGH;
	const statusColor = driverStatus === "AVAILABLE" ? "#10B981" : "#F59E0B";
	const statusText = driverStatus === "AVAILABLE" ? "Available" : "On Job";
	const badgeText = isUK ? "🇬🇧 UK DRIVER" : "🇬🇭 GH DRIVER";

	useEffect(() => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: true,
			}),
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: 500,
				useNativeDriver: true,
			}),
		]).start();

		if (user) fetchDriverData();
	}, [user]);

	const fetchDriverData = useCallback(async () => {
		try {
			const token = await AsyncStorage.getItem('token');
			const driverId = user?._id || user?.id;
			
			if (!driverId) {
				console.log("No driver ID found");
				return;
			}

			// Determine driver type for API call
			const type = isUK ? 'pickup' : 'delivery';
			const url = `${API_BASE_URL}${ENDPOINTS.DRIVER_ASSIGNMENTS(driverId)}?type=${type}&limit=10`;
			
			console.log('Fetching driver jobs from:', url);
			
			const response = await fetch(url, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			const data = await response.json();
			console.log('Driver jobs response:', data);

			if (data.success && data.data?.shipments) {
				const shipments = data.data.shipments;
				setAssignedJobsCount(shipments.length);
				
				// Find active job (first non-delivered shipment)
				const pendingJob = shipments.find(s => 
					!['delivered', 'cancelled'].includes(s.status?.toLowerCase())
				);
				
				if (pendingJob) {
					setActiveJob({
						id: pendingJob._id || pendingJob.id,
						parcelId: pendingJob.tracking_number || pendingJob.parcel_id_short || 'N/A',
						address: isUK 
							? `${pendingJob.pickup_address || ''}, ${pendingJob.pickup_city || ''}`.trim()
							: `${pendingJob.delivery_address || ''}, ${pendingJob.delivery_city || ''}`.trim(),
						status: pendingJob.status,
						customerName: isUK ? pendingJob.sender_name : pendingJob.receiver_name,
						...pendingJob,
					});
					setDriverStatus("ON_JOB");
				} else {
					setActiveJob(null);
					setDriverStatus("AVAILABLE");
				}

				// Generate updates based on real data
				const updates = [];
				if (shipments.length > 0) {
					updates.push(isUK 
						? `🚗 ${shipments.length} pickup${shipments.length > 1 ? 's' : ''} assigned`
						: `📦 ${shipments.length} deliver${shipments.length > 1 ? 'ies' : 'y'} scheduled`
					);
				}
				setLatestUpdates(updates.length > 0 ? updates : ["No new updates"]);
			} else {
				setActiveJob(null);
				setAssignedJobsCount(0);
				setDriverStatus("AVAILABLE");
				setLatestUpdates(["No assignments yet"]);
			}
		} catch (error) {
			console.error('Error fetching driver data:', error);
			setLatestUpdates(["Failed to load updates"]);
		}
	}, [user, isUK]);

	const onRefresh = async () => {
		setRefreshing(true);
		await fetchDriverData();
		setRefreshing(false);
	};

	const handleActionPress = (action) => {
		if (navigation && action.screen) {
			navigation.navigate(action.screen);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: BRAND.background }]}>
			<StatusBar barStyle="light-content" backgroundColor={BRAND.primary} />
			
			{/* Modern Header */}
			<LinearGradient
				colors={[BRAND.primary, '#152847', '#1a3a5c']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={[styles.header, { paddingTop: insets.top + 16 }]}
			>
				<View style={styles.headerContent}>
					<View style={styles.avatarContainer}>
						<Image 
							source={{ uri: user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'Driver'}&background=83C5FA&color=0B1A33` }} 
							style={styles.avatar} 
						/>
						<View style={[styles.statusDot, { backgroundColor: statusColor }]} />
					</View>
					
					<View style={styles.headerText}>
						<Text style={styles.greeting}>Welcome back,</Text>
						<Text style={styles.name}>{user?.fullName || 'Driver'}</Text>
						<View style={styles.badgeRow}>
							<View style={styles.badge}>
								<Text style={styles.badgeText}>{badgeText}</Text>
							</View>
							<View style={[styles.statusPill, { backgroundColor: statusColor }]}>
								<View style={styles.statusDotSmall} />
								<Text style={styles.statusText}>{statusText}</Text>
							</View>
						</View>
					</View>
					
					<TouchableOpacity 
						style={styles.notificationBtn}
						onPress={() => navigation.navigate('NotificationsScreen')}
					>
						<Ionicons name="notifications-outline" size={24} color="#fff" />
						<View style={styles.notificationBadge}>
							<Text style={styles.notificationCount}>2</Text>
						</View>
					</TouchableOpacity>
				</View>
			</LinearGradient>
			
			{/* Scrollable Content */}
			<ScrollView 
				style={styles.scrollView}
				contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.secondary} />
				}
			>
				{/* Active Job Card */}
				<Animated.View style={[
					styles.activeJobCard,
					{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
				]}>
					{activeJob ? (
						<>
							<View style={styles.cardHeader}>
								<View style={styles.activeJobBadge}>
									<Ionicons name="flash" size={16} color="#fff" />
									<Text style={styles.activeJobBadgeText}>ACTIVE</Text>
								</View>
								{assignedJobsCount > 1 && (
									<TouchableOpacity 
										style={styles.viewAllBtn}
										onPress={() => navigation.navigate('AssignedJobs')}
									>
										<Text style={styles.viewAllText}>+{assignedJobsCount - 1} more</Text>
									</TouchableOpacity>
								)}
							</View>
							<Text style={styles.parcelId}>Parcel: {activeJob.parcelId}</Text>
							<Text style={styles.address}>{activeJob.address}</Text>
							{activeJob.customerName && (
								<Text style={styles.customerName}>Customer: {activeJob.customerName}</Text>
							)}
							<TouchableOpacity 
								style={styles.openJobBtn}
								onPress={() => navigation.navigate('JobDetails', { job: activeJob })}
							>
								<Text style={styles.openJobText}>Open Job</Text>
								<Ionicons name="arrow-forward" size={18} color="#0B1A33" />
							</TouchableOpacity>
						</>
					) : (
						<View style={styles.noJobContainer}>
							<View style={styles.noJobIcon}>
								<Ionicons name="clipboard-outline" size={40} color="#9CA3AF" />
							</View>
							<Text style={styles.noJobTitle}>No Active Jobs</Text>
							<Text style={styles.noJobSubtitle}>You don't have any assigned jobs yet. Pull down to refresh.</Text>
							<TouchableOpacity 
								style={styles.refreshBtn}
								onPress={onRefresh}
							>
								<Ionicons name="refresh" size={16} color="#0B1A33" />
								<Text style={styles.refreshBtnText}>Refresh</Text>
							</TouchableOpacity>
						</View>
					)}
				</Animated.View>
				
				{/* Cash Tracking (UK Only) */}
				{isUKDriver() && (
					<Animated.View style={[
						styles.cashCard,
						{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
					]}>
						<View style={styles.cashHeader}>
							<View style={styles.cashIconContainer}>
								<Ionicons name="wallet" size={24} color="#10B981" />
							</View>
							<View style={styles.cashInfo}>
								<Text style={styles.cashLabel}>Cash Collected Today</Text>
								<Text style={styles.cashAmount}>£{totalCash.toFixed(2)}</Text>
							</View>
						</View>
						<View style={styles.cashFooter}>
							<Text style={styles.cashCount}>{cashCount} {cashCount === 1 ? 'pickup' : 'pickups'}</Text>
							<TouchableOpacity 
								style={[styles.submitBtn, cashCount === 0 && styles.submitBtnDisabled]}
								onPress={() => navigation.navigate('CashReconciliation')}
								disabled={cashCount === 0}
							>
								<Text style={styles.submitBtnText}>Submit</Text>
								<Ionicons name="chevron-forward" size={16} color="#fff" />
							</TouchableOpacity>
						</View>
					</Animated.View>
				)}
				
				{/* Warehouse Return (UK Only) */}
				{isUKDriver() && (
					<TouchableOpacity 
						style={styles.warehouseCard}
						onPress={() => navigation.navigate('WarehouseReturn')}
						activeOpacity={0.85}
					>
						<View style={styles.warehouseLeft}>
							<View style={styles.warehouseIcon}>
								<Ionicons name="business" size={24} color="#F59E0B" />
							</View>
							<View>
								<Text style={styles.warehouseTitle}>End of Day</Text>
								<Text style={styles.warehouseSubtitle}>Return to Warehouse</Text>
							</View>
						</View>
						<Ionicons name="chevron-forward" size={24} color="#F59E0B" />
					</TouchableOpacity>
				)}
				
				{/* Quick Actions */}
				<Text style={styles.sectionTitle}>Quick Actions</Text>
				<View style={styles.quickActionsGrid}>
					{quickActions.map((item, index) => (
						<TouchableOpacity
							key={item.label}
							style={styles.actionCard}
							onPress={() => handleActionPress(item)}
							activeOpacity={0.85}
						>
							<View style={[styles.actionIcon, { backgroundColor: `${item.color}15` }]}>
								<Ionicons name={item.icon} size={24} color={item.color} />
							</View>
							<Text style={styles.actionLabel}>{item.label}</Text>
						</TouchableOpacity>
					))}
				</View>
				
				{/* Latest Updates */}
				<Text style={styles.sectionTitle}>Latest Updates</Text>
				<View style={styles.updatesCard}>
					{latestUpdates.length > 0 ? (
						latestUpdates.map((msg, idx) => (
							<View key={idx} style={[styles.updateItem, idx < latestUpdates.length - 1 && styles.updateItemBorder]}>
								<Text style={styles.updateText}>{msg}</Text>
							</View>
						))
					) : (
						<Text style={styles.noUpdates}>No updates yet</Text>
					)}
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingBottom: 24,
		paddingHorizontal: 20,
		borderBottomLeftRadius: 28,
		borderBottomRightRadius: 28,
	},
	headerContent: {
		flexDirection: "row",
		alignItems: "center",
	},
	avatarContainer: {
		position: 'relative',
	},
	avatar: {
		width: 56,
		height: 56,
		borderRadius: 28,
		borderWidth: 3,
		borderColor: "rgba(131, 197, 250, 0.5)",
	},
	statusDot: {
		position: 'absolute',
		bottom: 2,
		right: 2,
		width: 14,
		height: 14,
		borderRadius: 7,
		borderWidth: 2,
		borderColor: '#0B1A33',
	},
	headerText: {
		flex: 1,
		marginLeft: 16,
	},
	greeting: {
		color: 'rgba(255,255,255,0.7)',
		fontSize: 14,
		fontWeight: '500',
	},
	name: {
		color: '#FFFFFF',
		fontSize: 22,
		fontWeight: "700",
		marginTop: 2,
	},
	badgeRow: {
		flexDirection: "row",
		marginTop: 8,
		gap: 8,
	},
	badge: {
		backgroundColor: "rgba(131, 197, 250, 0.2)",
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	badgeText: {
		color: "#83C5FA",
		fontSize: 11,
		fontWeight: "700",
	},
	statusPill: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 5,
		gap: 5,
	},
	statusDotSmall: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: '#fff',
	},
	statusText: {
		color: "#fff",
		fontSize: 11,
		fontWeight: "700",
	},
	notificationBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(255,255,255,0.15)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	notificationBadge: {
		position: 'absolute',
		top: 8,
		right: 8,
		backgroundColor: '#EF4444',
		width: 16,
		height: 16,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
	notificationCount: {
		color: '#fff',
		fontSize: 10,
		fontWeight: '700',
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 20,
	},
	activeJobCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 20,
		marginBottom: 16,
		shadowColor: "#0B1A33",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 4,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	activeJobBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#10B981',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		gap: 6,
	},
	activeJobBadgeText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '700',
	},
	parcelId: {
		fontSize: 18,
		fontWeight: '700',
		color: '#0B1A33',
		marginBottom: 4,
	},
	address: {
		fontSize: 14,
		color: '#6B7280',
		marginBottom: 16,
	},
	openJobBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#83C5FA',
		paddingVertical: 14,
		borderRadius: 12,
		gap: 8,
	},
	openJobText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#0B1A33',
	},
	noJobContainer: {
		alignItems: 'center',
		paddingVertical: 16,
	},
	noJobIcon: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: 'rgba(16, 185, 129, 0.1)',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 12,
	},
	noJobTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#0B1A33',
		marginBottom: 4,
	},
	noJobSubtitle: {
		fontSize: 14,
		color: '#9CA3AF',
		textAlign: 'center',
	},
	refreshBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F3F4F6',
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 20,
		marginTop: 16,
		gap: 6,
	},
	refreshBtnText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#0B1A33',
	},
	viewAllBtn: {
		backgroundColor: 'rgba(255,255,255,0.2)',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
	},
	viewAllText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#fff',
	},
	customerName: {
		fontSize: 14,
		color: '#6B7280',
		marginTop: 4,
	},
	cashCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		padding: 20,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: 'rgba(16, 185, 129, 0.2)',
	},
	cashHeader: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	cashIconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: 'rgba(16, 185, 129, 0.1)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	cashInfo: {
		marginLeft: 16,
	},
	cashLabel: {
		fontSize: 14,
		color: '#6B7280',
		fontWeight: '500',
	},
	cashAmount: {
		fontSize: 28,
		fontWeight: '700',
		color: '#10B981',
	},
	cashFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: 'rgba(0,0,0,0.05)',
	},
	cashCount: {
		fontSize: 14,
		color: '#6B7280',
	},
	submitBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#10B981',
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 10,
		gap: 4,
	},
	submitBtnDisabled: {
		opacity: 0.5,
	},
	submitBtnText: {
		color: '#fff',
		fontWeight: '700',
		fontSize: 14,
	},
	warehouseCard: {
		backgroundColor: '#FEF3C7',
		borderRadius: 16,
		padding: 18,
		marginBottom: 24,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: 1,
		borderColor: '#F59E0B',
	},
	warehouseLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	warehouseIcon: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(245, 158, 11, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	warehouseTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#92400E',
	},
	warehouseSubtitle: {
		fontSize: 13,
		color: '#B45309',
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#0B1A33',
		marginBottom: 16,
	},
	quickActionsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
		marginBottom: 24,
	},
	actionCard: {
		width: (width - 52) / 2,
		backgroundColor: '#FFFFFF',
		padding: 18,
		borderRadius: 16,
		alignItems: 'center',
		shadowColor: '#0B1A33',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.04,
		shadowRadius: 8,
		elevation: 2,
	},
	actionIcon: {
		width: 52,
		height: 52,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 10,
	},
	actionLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: '#0B1A33',
	},
	updatesCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 1,
	},
	updateItem: {
		paddingVertical: 12,
	},
	updateItemBorder: {
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(0,0,0,0.05)',
	},
	updateText: {
		fontSize: 14,
		color: '#374151',
		lineHeight: 20,
	},
	noUpdates: {
		fontSize: 14,
		color: '#9CA3AF',
		fontStyle: 'italic',
		textAlign: 'center',
		paddingVertical: 16,
	},
});
