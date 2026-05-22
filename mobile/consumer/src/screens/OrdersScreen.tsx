import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderApi } from '../api/client';

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#F59E0B', AWAITING_IDV: '#F59E0B', AWAITING_REVIEW: '#F59E0B',
  APPROVED: '#3B82F6', DISPENSING: '#3B82F6', DISPATCHED: '#8B5CF6',
  OUT_FOR_DELIVERY: '#8B5CF6', DELIVERED: '#10B981', CANCELLED: '#EF4444', REFUNDED: '#EF4444',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await orderApi.list();
      setOrders(res.data.data || []);
    } catch {}
    setLoading(false);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0D9488" /></View>;
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySubtitle}>Your orders will appear here</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.reference}>{item.reference}</Text>
            <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || '#6B7280') + '20' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || '#6B7280' }]}>
                {item.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
          <Text style={styles.productName}>{item.productName}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.amount}>£{item.totalAmount.toFixed(2)}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('en-GB')}</Text>
          </View>
          {item.shipment?.trackingNumber && (
            <View style={styles.tracking}>
              <Ionicons name="navigate-outline" size={14} color="#0D9488" />
              <Text style={styles.trackingText}>Tracking: {item.shipment.trackingNumber}</Text>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reference: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  productName: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  amount: { fontSize: 16, fontWeight: '700', color: '#111827' },
  date: { fontSize: 12, color: '#9CA3AF' },
  tracking: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  trackingText: { fontSize: 12, color: '#0D9488' },
});
