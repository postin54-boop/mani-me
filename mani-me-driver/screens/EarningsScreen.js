import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCashTracking } from '../context/CashTrackingContext';
import apiClient from '../utils/api';

export default function EarningsScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const { user, isUKDriver } = useAuth();
  const { cashPickups, totalCash } = useCashTracking();
  const insets = useSafeAreaInsets();
  const isUK = isUKDriver();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cashJobs, setCashJobs] = useState([]);
  const [totalFromBackend, setTotalFromBackend] = useState(0);

  const fetchCashJobs = useCallback(async () => {
    try {
      const driverId = user?._id || user?.id;
      if (!driverId) return;
      const type = isUK ? 'pickup' : 'delivery';
      const response = await apiClient.get(`/drivers/${driverId}/assignments`, {
        params: { type, limit: 50 },
      });
      const shipments = response.data?.data?.shipments || [];

      // Only cash-payment jobs that have been collected
      const cash = shipments.filter(s => {
        const pm = (s.payment_method || '').toLowerCase();
        const st = s.shipment_status || s.status || '';
        const isCollected = ['picked_up', 'parcel_collected', 'at_uk_warehouse', 'in_transit', 'delivered'].includes(st);
        return pm === 'cash' && isCollected;
      });

      const total = cash.reduce((sum, s) => sum + (parseFloat(s.total_cost) || 0), 0);
      setTotalFromBackend(total);
      setCashJobs(cash);
    } catch {
      // silently fail — local context cash still shown
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isUK]);

  useEffect(() => {
    fetchCashJobs();
  }, [fetchCashJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCashJobs();
  };

  const jobCount = cashJobs.length > 0 ? cashJobs.length : cashPickups.length;
  const displayTotal = totalFromBackend > 0 ? totalFromBackend : totalCash;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1A33" />

      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: '#0B1A33' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash Collected</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} />}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.secondary + '18', borderLeftColor: colors.secondary }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.secondary} style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Your salary is paid <Text style={{ fontWeight: '700' }}>weekly/monthly</Text> by admin. This screen shows cash collected from customers that must be handed in at the warehouse.
          </Text>
        </View>

        {/* Total Card */}
        <View style={styles.summaryContainer}>
          <View style={[styles.totalCard, { backgroundColor: '#0B1A33' }]}>
            <Text style={styles.totalLabel}>Total Cash to Hand Over</Text>
            <Text style={styles.totalAmount}>£{displayTotal.toFixed(2)}</Text>
            <Text style={styles.totalSub}>
              From {jobCount} cash job{jobCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Cash Jobs List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cash Collected Per Job</Text>

          {cashJobs.length === 0 && cashPickups.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="cash-outline" size={40} color={colors.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center' }}>
                No cash jobs collected yet.{'\n'}Jobs with cash payment will appear here.
              </Text>
            </View>
          ) : (
            <>
              {cashJobs.map((job) => (
                <View
                  key={job._id || job.id}
                  style={[styles.jobCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.jobIcon}>
                    <Ionicons name="cash" size={24} color="#10B981" />
                  </View>
                  <View style={styles.jobDetails}>
                    <Text style={[styles.jobId, { color: colors.text }]}>
                      {job.tracking_number || job.parcel_id_short || 'N/A'}
                    </Text>
                    <Text style={[styles.jobCustomer, { color: colors.textSecondary }]}>
                      {isUK ? (job.sender_name || 'Customer') : (job.receiver_name || 'Recipient')}
                    </Text>
                  </View>
                  <Text style={styles.jobAmount}>
                    £{(parseFloat(job.total_cost) || 0).toFixed(2)}
                  </Text>
                </View>
              ))}
              {cashJobs.length === 0 && cashPickups.map((pickup, i) => (
                <View
                  key={pickup.parcelId || i}
                  style={[styles.jobCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.jobIcon}>
                    <Ionicons name="cash" size={24} color="#10B981" />
                  </View>
                  <View style={styles.jobDetails}>
                    <Text style={[styles.jobId, { color: colors.text }]}>{pickup.parcelId || 'Job'}</Text>
                    <Text style={[styles.jobCustomer, { color: colors.textSecondary }]}>Cash collected</Text>
                  </View>
                  <Text style={styles.jobAmount}>
                    £{(parseFloat(pickup.amount) || 0).toFixed(2)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Contact Admin */}
        <View style={styles.section}>
          <View style={[styles.adminCard, { backgroundColor: colors.surface, borderLeftColor: colors.secondary }]}>
            <Text style={[styles.adminTitle, { color: colors.text }]}>Pay Queries?</Text>
            <Text style={[styles.adminSub, { color: colors.textSecondary }]}>
              For salary or payment questions, contact admin on WhatsApp.
            </Text>
            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={() => Linking.openURL('https://wa.me/447958086887')}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.whatsappBtnText}>Message Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { marginRight: 12 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  content: { flex: 1 },
  infoBanner: { flexDirection: 'row', margin: 20, marginBottom: 0, padding: 14, borderRadius: 12, borderLeftWidth: 3 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  summaryContainer: { padding: 20 },
  totalCard: { borderRadius: 20, padding: 24, alignItems: 'center' },
  totalLabel: { color: '#83C5FA', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  totalAmount: { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  totalSub: { color: '#83C5FA99', fontSize: 13, marginTop: 6 },
  section: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  emptyCard: { borderRadius: 16, padding: 32, alignItems: 'center' },
  jobCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  jobIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B98118' },
  jobDetails: { flex: 1, marginLeft: 12 },
  jobId: { fontSize: 15, fontWeight: '700' },
  jobCustomer: { fontSize: 13, marginTop: 2 },
  jobAmount: { fontSize: 17, fontWeight: '800', color: '#10B981' },
  adminCard: { borderRadius: 16, padding: 16, borderLeftWidth: 4 },
  adminTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  adminSub: { fontSize: 13, marginBottom: 12 },
  whatsappBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, backgroundColor: '#25D366' },
  whatsappBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
