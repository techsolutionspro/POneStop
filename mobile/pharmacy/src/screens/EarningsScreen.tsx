import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { earningsApi, payoutApi } from '../api/client';

export default function EarningsScreen() {
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, h] = await Promise.all([earningsApi.summary(), earningsApi.history()]);
      setSummary(s.data.data);
      setHistory(h.data.data || []);
    } catch {}
    setLoading(false);
  }

  const handleRequestPayout = () => {
    if (!summary || summary.availableBalance <= 0) {
      Alert.alert('No Balance', 'You have no available balance to withdraw.');
      return;
    }
    Alert.prompt(
      'Request Payout',
      `Enter amount (max £${summary.availableBalance.toFixed(2)})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async (amount) => {
            const num = parseFloat(amount || '0');
            if (num <= 0 || num > summary.availableBalance) {
              Alert.alert('Invalid', 'Enter a valid amount within your balance');
              return;
            }
            try {
              await payoutApi.request({ amount: num });
              Alert.alert('Success', 'Payout request submitted');
              loadData();
            } catch {
              Alert.alert('Error', 'Failed to request payout');
            }
          },
        },
      ],
      'plain-text',
      '',
      'decimal-pad'
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0D9488" /></View>;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Balance card */}
      {summary && (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>£{summary.availableBalance.toFixed(2)}</Text>
          <TouchableOpacity style={styles.payoutBtn} onPress={handleRequestPayout}>
            <Text style={styles.payoutBtnText}>Request Payout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats */}
      {summary && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Earnings</Text>
            <Text style={styles.statValue}>£{summary.totalEarnings.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Commission</Text>
            <Text style={styles.statValue}>£{summary.totalCommission.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Paid Out</Text>
            <Text style={styles.statValue}>£{summary.totalPayouts.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Transaction history */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          history.map((tx: any) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'ORDER' ? '#ECFDF5' : '#FEF2F2' }]}>
                <Ionicons
                  name={tx.type === 'ORDER' ? 'trending-up' : 'arrow-down'}
                  size={16}
                  color={tx.type === 'ORDER' ? '#10B981' : '#EF4444'}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString('en-GB')}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.amount >= 0 ? '#10B981' : '#EF4444' }]}>
                {tx.amount >= 0 ? '+' : ''}£{Math.abs(tx.amount).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  balanceCard: { margin: 16, backgroundColor: '#0D9488', borderRadius: 20, padding: 24, alignItems: 'center' },
  balanceLabel: { color: '#CCFBF1', fontSize: 14 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '700', marginTop: 4 },
  payoutBtn: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  payoutBtnText: { color: '#0D9488', fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginHorizontal: 4 },
  statLabel: { fontSize: 11, color: '#6B7280' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: '#F3F4F6' },
  txIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 10 },
  txDesc: { fontSize: 13, fontWeight: '500', color: '#111827' },
  txDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '600' },
});
