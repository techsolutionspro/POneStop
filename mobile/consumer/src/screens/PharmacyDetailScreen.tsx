import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { marketplaceApi } from '../api/client';

const CATEGORY_LABELS: Record<string, string> = {
  BASIC_CONSULTATION: 'Consultations',
  OTC: 'Over the Counter',
  PHARMACY_MEDICINE: 'Pharmacy Medicines',
  POM_PGD: 'PGD Services',
  POM_PRESCRIBING: 'Prescriber Services',
};

interface Props { navigation: any; route: any; }

export default function PharmacyDetailScreen({ navigation, route }: Props) {
  const { slug } = route.params;
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceApi.pharmacy(slug)
      .then(res => setPharmacy(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0D9488" /></View>;
  }

  if (!pharmacy) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Pharmacy not found</Text>
      </View>
    );
  }

  const mainBranch = pharmacy.branches?.[0];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: pharmacy.primaryColor || '#0D9488' }]}>
          <Text style={styles.avatarText}>{pharmacy.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{pharmacy.name}</Text>
        {pharmacy.rating && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#FBBF24" />
            <Text style={styles.ratingText}>{pharmacy.rating} ({pharmacy.reviewCount} reviews)</Text>
          </View>
        )}
        {pharmacy.gphcNumber && (
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={14} color="#0D9488" />
            <Text style={styles.badgeText}>GPhC: {pharmacy.gphcNumber}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      {mainBranch && (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#6B7280" />
            <Text style={styles.infoText}>{mainBranch.address}, {mainBranch.city}, {mainBranch.postcode}</Text>
          </View>
          {mainBranch.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color="#6B7280" />
              <Text style={styles.infoText}>{mainBranch.phone}</Text>
            </View>
          )}
          {pharmacy.deliveryFee !== null && (
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={18} color="#6B7280" />
              <Text style={styles.infoText}>
                {pharmacy.deliveryFee === 0 ? 'Free delivery' : `£${pharmacy.deliveryFee} delivery`}
                {pharmacy.minOrderAmount ? ` · Min £${pharmacy.minOrderAmount}` : ''}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services ({pharmacy.services.length})</Text>
        {pharmacy.services.map((svc: any) => (
          <View key={svc.id} style={styles.serviceCard}>
            <View style={styles.serviceIcon}>
              <Ionicons name="medkit" size={22} color="#0D9488" />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{svc.name}</Text>
              <Text style={styles.serviceCategory}>{CATEGORY_LABELS[svc.category] || svc.category}</Text>
              {svc.description && <Text style={styles.serviceDesc} numberOfLines={2}>{svc.description}</Text>}
            </View>
            <View style={styles.servicePrice}>
              <Text style={styles.priceText}>£{svc.price.toFixed(2)}</Text>
              {svc.duration && <Text style={styles.durationText}>{svc.duration} min</Text>}
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#6B7280' },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 30, fontWeight: '700', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingText: { fontSize: 14, color: '#6B7280' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: '#F0FDFA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, color: '#0D9488', fontWeight: '500' },
  infoCard: { margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  infoText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12, marginTop: 8 },
  serviceCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  serviceIcon: { width: 44, height: 44, backgroundColor: '#F0FDFA', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  serviceInfo: { flex: 1, marginLeft: 12 },
  serviceName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  serviceCategory: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  serviceDesc: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
  servicePrice: { alignItems: 'flex-end', justifyContent: 'center' },
  priceText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  durationText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
});
