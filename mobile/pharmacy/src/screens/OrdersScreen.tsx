import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderApi } from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#F59E0B', AWAITING_IDV: '#F59E0B', AWAITING_REVIEW: '#F59E0B',
  APPROVED: '#3B82F6', DISPENSING: '#3B82F6', DISPATCHED: '#8B5CF6',
  OUT_FOR_DELIVERY: '#8B5CF6', DELIVERED: '#10B981',
  CANCELLED: '#EF4444', REFUNDED: '#EF4444', REJECTED: '#EF4444',
};

export default function OrdersScreen({ navigation }: { navigation: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => { loadOrders(); }, [filter]);

  async function loadOrders() {
    try {
      const params: any = {};
      if (filter) params.status = filter;
      const res = await orderApi.list(params);
      setOrders(res.data.data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  const FILTERS = ['', 'AWAITING_REVIEW', 'APPROVED', 'DISPATCHED', 'DELIVERED'];
  const FILTER_LABELS: Record<string, string> = { '': 'All', AWAITING_REVIEW: 'Review', APPROVED: 'Approved', DISPATCHED: 'Dispatched', DELIVERED: 'Delivered' };

  return (
    <View style={styles.container}>
      <ScrollableFilters filters={FILTERS} labels={FILTER_LABELS} active={filter} onSelect={setFilter} />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#0D9488" /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="bag-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetail', { id: item.id })}>
              <View style={styles.cardHeader}>
                <Text style={styles.ref}>{item.reference}</Text>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[item.status] || '#6B7280') + '20' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] || '#6B7280' }]}>
                    {item.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.product}>{item.productName}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.patient}>
                  {item.patient?.user?.firstName} {item.patient?.user?.lastName}
                </Text>
                <Text style={styles.amount}>£{item.totalAmount.toFixed(2)}</Text>
              </View>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('en-GB')}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function ScrollableFilters({ filters, labels, active, onSelect }: any) {
  return (
    <View style={styles.filterRow}>
      {filters.map((f: string) => (
        <TouchableOpacity
          key={f}
          onPress={() => onSelect(f)}
          style={[styles.filterBtn, active === f && styles.filterBtnActive]}
        >
          <Text style={[styles.filterText, active === f && styles.filterTextActive]}>
            {labels[f] || f}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 15, color: '#6B7280', marginTop: 12 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 6 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: '#F3F4F6' },
  filterBtnActive: { backgroundColor: '#0D9488' },
  filterText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 0 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  product: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  patient: { fontSize: 13, color: '#6B7280' },
  amount: { fontSize: 15, fontWeight: '700', color: '#111827' },
  date: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
});
