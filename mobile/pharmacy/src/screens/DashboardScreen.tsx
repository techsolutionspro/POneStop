import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dashboardApi } from '../api/client';
import { useAuthStore } from '../store/auth';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await dashboardApi.tenant();
      setData(res.data.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0D9488" /></View>;
  }

  const stats = [
    { label: "Today's Bookings", value: data?.todayBookings || 0, icon: 'calendar-outline' as const, color: '#0D9488' },
    { label: 'Online Orders', value: data?.pendingOrders || 0, icon: 'bag-outline' as const, color: '#6366F1' },
    { label: 'Revenue (Week)', value: `£${(data?.weekRevenue || 0).toFixed(0)}`, icon: 'trending-up-outline' as const, color: '#10B981' },
    { label: 'Awaiting Review', value: data?.awaitingReview || 0, icon: 'time-outline' as const, color: '#F59E0B' },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#0D9488" />}
    >
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'},{' '}
          {user?.firstName}
        </Text>
        <Text style={styles.pharmacyName}>{user?.tenant?.name || 'Your Pharmacy'}</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
              <Ionicons name={stat.icon} size={20} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent orders */}
      {data?.recentOrders && data.recentOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {data.recentOrders.slice(0, 5).map((order: any) => (
            <View key={order.id} style={styles.orderRow}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderRef}>{order.reference}</Text>
                <Text style={styles.orderProduct}>{order.productName}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>£{order.totalAmount?.toFixed(2)}</Text>
                <Text style={[styles.orderStatus, { color: order.status === 'DELIVERED' ? '#10B981' : '#F59E0B' }]}>
                  {order.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greeting: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  greetingText: { fontSize: 22, fontWeight: '700', color: '#111827' },
  pharmacyName: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  statCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginHorizontal: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#111827', marginTop: 10 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: '#F3F4F6' },
  orderInfo: { flex: 1 },
  orderRef: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  orderProduct: { fontSize: 14, fontWeight: '500', color: '#111827', marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  orderAmount: { fontSize: 14, fontWeight: '600', color: '#111827' },
  orderStatus: { fontSize: 10, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },
});
