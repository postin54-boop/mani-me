import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/theme';

export default function EarningsScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();

  const summary = {
    today: '₦24,500',
    week: '₦156,000',
    month: '₦624,000',
  };

  const transactions = [
    { id: 'DEL001', amount: '₦2,500', date: '2:45 PM', type: 'delivery' },
    { id: 'DEL002', amount: '₦3,000', date: '1:30 PM', type: 'delivery' },
    { id: 'DEL003', amount: '₦2,000', date: '11:15 AM', type: 'delivery' },
    { id: 'BONUS', amount: '₦5,000', date: '9:00 AM', type: 'bonus' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { backgroundColor: colors.surface }]}> 
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -1 }}>Earnings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}> 
        {/* Summary Cards */}
        <View style={styles.summaryContainer}> 
          <View style={[styles.summaryCard, { backgroundColor: colors.secondary, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 }]}> 
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>Today</Text>
            <Text style={{ color: colors.primary, fontSize: 36, fontWeight: '800' }}>{summary.today}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 }]}> 
            <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>This Week</Text>
            <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>{summary.week}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 }]}> 
            <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>This Month</Text>
            <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>{summary.month}</Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}> 
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 20, letterSpacing: -0.5 }}>Recent Transactions</Text>

          {transactions.map((transaction) => (
            <View
              key={transaction.id}
              style={[
                styles.transactionCard,
                { backgroundColor: colors.surface, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
              ]}
            >
              <View
                style={[
                  styles.transactionIcon,
                  {
                    backgroundColor:
                      transaction.type === 'bonus'
                        ? colors.warning + '20'
                        : colors.secondary + '20',
                    borderRadius: 12,
                  },
                ]}
              >
                <Ionicons
                  name={transaction.type === 'bonus' ? 'gift' : 'cube'}
                  size={28}
                  color={transaction.type === 'bonus' ? colors.warning : colors.secondary}
                />
              </View>

              <View style={styles.transactionDetails}> 
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 2 }}>{transaction.id}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '500' }}>{transaction.date}</Text>
              </View>

              <Text style={{ color: colors.success, fontSize: 20, fontWeight: '800' }}>+{transaction.amount}</Text>
            </View>
          ))}
        </View>

        {/* Withdraw Button */}
        <View style={styles.section}> 
          <TouchableOpacity
            style={[styles.withdrawButton, { backgroundColor: colors.primary, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 }]}
          >
            <Ionicons name="wallet-outline" size={24} color={colors.accent} style={{ marginRight: 10 }} />
            <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '700' }}>Withdraw Earnings</Text>
          </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    padding: 24,
    gap: 12,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  section: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
