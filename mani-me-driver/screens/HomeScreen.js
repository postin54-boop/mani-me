import React, { useContext, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, StatusBar } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../context/AuthContext";
import { useCashTracking } from "../context/CashTrackingContext";
import { useThemeColors } from "../constants/theme";

const BRAND = {
	primary: "#0B1A33",
	secondary: "#83C5FA",
	background: "#F9FAFB",
	card: "#FFFFFF",
	text: "#0B1A33",
	success: "#16A34A",
	warning: "#F59E0B",
};

// Quick actions by role
const quickActionsUK = [
	{ label: "View UK Pickups", icon: "list", screen: "UKPickups" },
	{ label: "Record Cash Pickup", icon: "add-circle", screen: "RecordCashPickup" },
	{ label: "Scan Parcel", icon: "qr-code", screen: "ScanParcelScreen" },
	{ label: "Print Labels", icon: "print", screen: "PrintLabelsScreen" },
	{ label: "Notifications", icon: "notifications", screen: "NotificationsScreen" },
];

const quickActionsGH = [
	{ label: "View Deliveries", icon: "list", screen: "GhanaDeliveries" },
	{ label: "Scan Parcel", icon: "qr-code", screen: "ScanParcelScreen" },
	{ label: "Proof of Delivery", icon: "camera", screen: "ScanParcelScreen" },
	{ label: "Notifications", icon: "notifications", screen: "NotificationsScreen" },
];

export default function HomeScreen({ navigation }) {
	const insets = useSafeAreaInsets();
	const { colors } = useThemeColors();
	const { user, role, isUKDriver, isGhanaDriver } = useContext(AuthContext);
	const { totalCash, cashCount } = useCashTracking();
	
	const [driverStatus, setDriverStatus] = useState("AVAILABLE"); // "AVAILABLE" | "ON_JOB"
	const [activeJob, setActiveJob] = useState(null);
	const [latestUpdates, setLatestUpdates] = useState([]);

	// Determine driver type
	const isUK = isUKDriver();
	const isGhana = isGhanaDriver();

	// Role-aware quick actions
	const quickActions = isUK ? quickActionsUK : quickActionsGH;

	// Status pill color
	const statusColor = driverStatus === "AVAILABLE" ? "#16A34A" : "#F59E0B";
	const statusText = driverStatus === "AVAILABLE" ? "Available" : "On Job";

	// Badge text
	const badgeText = isUK ? "🇬🇧 UK DRIVER" : "🇬🇭 GH DRIVER";
	const jobTypeText = isUK ? "Active Pickup" : "Active Delivery";

	// Fetch driver assignments on mount
	useEffect(() => {
		if (user) {
			fetchDriverData();
		}
	}, [user]);

	const fetchDriverData = async () => {
		// TODO: Implement API call to fetch:
		// - Active jobs
		// - Driver status
		// - Latest updates/notifications
		console.log("Fetching driver data for:", user?.fullName);
		
		// Mock data for now
		setLatestUpdates([
			isUK ? "Pickup assigned: MM-839201" : "Delivery scheduled: GH-839201",
			"Message from Admin: Check your schedule",
		]);
	};

	const handleOpenJob = () => {
		if (navigation && activeJob) {
			navigation.navigate("JobDetails", { job: activeJob });
		}
	};

	const handleActionPress = (action) => {
		if (!navigation || !action.screen) return;
		navigation.navigate(action.screen);
	};

	return (
		<View style={{ flex: 1, backgroundColor: BRAND.background }}>
			<StatusBar barStyle="light-content" backgroundColor={BRAND.primary} />
			
			{/* HEADER with Gradient */}
			<LinearGradient
				colors={[BRAND.primary, '#1a3a5c']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
			>
				<View style={styles.headerContent}>
					<Image 
						source={{ uri: user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'Driver'}` }} 
						style={styles.avatar} 
					/>
					<View style={{ flex: 1, marginLeft: 12 }}>
						<Text style={styles.name}>{user?.fullName || 'Driver'}</Text>
						<View style={styles.badgeRow}>
							<View style={styles.badge}><Text style={styles.badgeText}>{badgeText}</Text></View>
							<View style={[styles.statusPill, { backgroundColor: statusColor }]}>
								<Text style={styles.statusText}>{statusText}</Text>
							</View>
						</View>
					</View>
				</View>
			</LinearGradient>
			
			{/* SCROLLABLE CONTENT */}
			<ScrollView 
				style={{ flex: 1 }}
				contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 80 }]} 
				showsVerticalScrollIndicator={false}
			>
				{/* ACTIVE JOB CARD */}
				<View style={[styles.cardSticky, { borderRadius: 16, shadowColor: BRAND.primary, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 }]}> 
					{activeJob ? (
						<>
							<Text style={[styles.cardTitle, { fontSize: 18 }]}>{jobTypeText}</Text>
							<Text style={{ fontWeight: '600', color: BRAND.text }}>Parcel ID: <Text style={{ color: BRAND.secondary }}>{activeJob.parcelId}</Text></Text>
							<Text style={{ fontWeight: '600', color: BRAND.text }}>Address: <Text style={{ color: BRAND.secondary }}>{activeJob.address}</Text></Text>
							<Text style={{ fontWeight: '600', color: BRAND.text }}>Status: <Text style={{ color: BRAND.secondary }}>{activeJob.status}</Text></Text>
							<TouchableOpacity style={styles.primaryBtn} onPress={handleOpenJob}>
								<Text style={styles.primaryText}>Open Job</Text>
							</TouchableOpacity>
						</>
					) : (
						<>
							<Text style={[styles.cardTitle, { fontSize: 18 }]}>You have no active assignments</Text>
							<Text style={{ color: BRAND.success, fontWeight: "700", marginTop: 8 }}>🟢 Available</Text>
						</>
					)}
				</View>
				
				{/* CASH TRACKING (UK DRIVERS ONLY) */}
				{isUKDriver() && (
					<View style={[styles.cardSticky, { borderRadius: 16, backgroundColor: '#10B98110', borderWidth: 1, borderColor: '#10B98140', marginTop: 16 }]}>
						<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
							<Ionicons name="cash-outline" size={24} color="#10B981" />
							<Text style={[styles.cardTitle, { fontSize: 18, marginLeft: 8, marginBottom: 0, color: '#10B981' }]}>Cash Collected Today</Text>
						</View>
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
							<View>
								<Text style={{ fontSize: 32, fontWeight: '700', color: '#10B981' }}>£{totalCash.toFixed(2)}</Text>
								<Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{cashCount} cash {cashCount === 1 ? 'pickup' : 'pickups'}</Text>
							</View>
							<TouchableOpacity 
								style={{ backgroundColor: '#10B981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, opacity: cashCount === 0 ? 0.5 : 1 }}
								onPress={() => navigation.navigate('CashReconciliation')}
								disabled={cashCount === 0}
							>
								<Text style={{ color: '#fff', fontWeight: '700' }}>Submit</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}
				
				{/* END DAY - RETURN TO WAREHOUSE (UK DRIVERS ONLY) */}
				{isUKDriver() && (
					<TouchableOpacity 
						style={styles.warehouseButton}
						onPress={() => navigation.navigate('WarehouseReturn')}
						activeOpacity={0.85}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<Ionicons name="business" size={24} color="#F59E0B" />
							<Text style={{ fontSize: 18, fontWeight: '700', color: '#F59E0B', marginLeft: 12 }}>Return to Warehouse</Text>
						</View>
						<Ionicons name="chevron-forward" size={24} color="#F59E0B" />
					</TouchableOpacity>
				)}
				
				{/* QUICK ACTIONS */}
				<Text style={[styles.sectionTitle, { fontSize: 17, marginTop: 8 }]}>Quick Actions</Text>
				<View style={[styles.grid, { gap: 12 }]}> 
					{quickActions.map((item) => (
						<TouchableOpacity
							key={item.label}
							style={[styles.actionCard, { borderRadius: 14, backgroundColor: '#fff', shadowColor: BRAND.primary, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 }]}
							onPress={() => handleActionPress(item)}
							activeOpacity={0.85}
						>
							<Ionicons name={item.icon} size={28} color={BRAND.primary} style={{ marginBottom: 6 }} />
							<Text style={[styles.actionText, { fontSize: 15, fontWeight: '600', color: BRAND.text }]}>{item.label}</Text>
						</TouchableOpacity>
					))}
				</View>
				
				{/* LATEST UPDATES */}
				<View style={[styles.updatesCard, { borderRadius: 14, backgroundColor: '#fff', shadowColor: BRAND.primary, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }]}> 
					<Text style={[styles.updatesTitle, { fontSize: 16 }]}>Latest Updates</Text>
					{latestUpdates.length > 0 ? (
						latestUpdates.map((msg, idx) => (
							<Text key={idx} style={[styles.updateMsg, { fontSize: 14 }]}>{msg}</Text>
						))
					) : (
						<Text style={{ fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' }}>No updates yet</Text>
					)}
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	headerGradient: {
		paddingBottom: 20,
		paddingHorizontal: 16,
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 8,
	},
	headerContent: {
		flexDirection: "row",
		alignItems: "center",
	},
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 2,
		borderColor: "#83C5FA",
	},
	name: {
		color: '#FFFFFF',
		fontSize: 20,
		fontWeight: "700",
	},
	badgeRow: { flexDirection: "row", marginTop: 6 },
	badge: {
		backgroundColor: "#83C5FA",
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 4,
		marginRight: 6,
	},
	badgeText: { color: "#0B1A33", fontSize: 12, fontWeight: "700" },
	statusPill: {
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 4,
		alignItems: "center",
		justifyContent: "center",
	},
	statusText: { color: "#fff", fontSize: 12, fontWeight: "700" },
	body: { 
		padding: 16,
		paddingTop: 16,
	},
	cardSticky: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 18,
		marginBottom: 20,
		shadowColor: "#0B1A33",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 6,
		elevation: 3,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "700",
		marginBottom: 8,
		color: "#0B1A33",
	},
	primaryBtn: {
		backgroundColor: "#83C5FA",
		padding: 14,
		borderRadius: 10,
		marginTop: 12,
		alignItems: "center",
	},
	primaryText: {
		color: "#0B1A33",
		fontWeight: "700",
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "700",
		marginBottom: 10,
		color: "#0B1A33",
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
	},
	actionCard: {
		width: "48%",
		backgroundColor: "#FFFFFF",
		padding: 18,
		borderRadius: 14,
		alignItems: "center",
		marginBottom: 12,
		shadowColor: "#0B1A33",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 4,
		elevation: 2,
	},
	actionText: { marginTop: 8, fontWeight: "600" },
	updatesCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 14,
		marginTop: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04,
		shadowRadius: 2,
		elevation: 1,
	},
	updatesTitle: {
		fontSize: 15,
		fontWeight: "700",
		marginBottom: 6,
		color: "#0B1A33",
	},
	updateMsg: {
		fontSize: 13,
		color: "#0B1A33",
		marginBottom: 2,
	},
	warehouseButton: {
		backgroundColor: '#FEF3C7',
		borderRadius: 16,
		padding: 18,
		marginBottom: 20,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: 2,
		borderColor: '#F59E0B',
		shadowColor: '#F59E0B',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
});
