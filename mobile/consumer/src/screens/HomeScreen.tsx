import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { marketplaceApi } from '../api/client';

const CATEGORIES = [
  { id: 'BASIC_CONSULTATION', name: 'Consultations', icon: 'medical' as const },
  { id: 'OTC', name: 'OTC', icon: 'medkit' as const },
  { id: 'PHARMACY_MEDICINE', name: 'Medicines', icon: 'fitness' as const },
  { id: 'POM_PGD', name: 'PGD', icon: 'flask' as const },
  { id: 'POM_PRESCRIBING', name: 'Prescriber', icon: 'shield-checkmark' as const },
];

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [postcode, setPostcode] = useState('');
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    marketplaceApi.featured().then(res => setFeatured(res.data.data || [])).catch(() => {});
  }, []);

  const handleSearch = () => {
    if (!postcode.trim()) return;
    navigation.navigate('Search', { postcode: postcode.trim() });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Pharmacy services,{'\n'}delivered to you</Text>
        <Text style={styles.heroSubtitle}>Find trusted pharmacies near you</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="location-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter your postcode"
            value={postcode}
            onChangeText={setPostcode}
            onSubmitEditing={handleSearch}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => navigation.navigate('Search', { category: cat.id })}
            >
              <Ionicons name={cat.icon} size={28} color="#0D9488" />
              <Text style={styles.categoryLabel}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured */}
      {featured.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured pharmacies</Text>
          {featured.slice(0, 5).map((item: any) => (
            <TouchableOpacity
              key={item.adId}
              style={styles.pharmacyCard}
              onPress={() => navigation.navigate('PharmacyDetail', { slug: item.pharmacy.slug })}
            >
              <View style={[styles.pharmacyAvatar, { backgroundColor: item.pharmacy.primaryColor || '#0D9488' }]}>
                <Text style={styles.pharmacyAvatarText}>{item.pharmacy.name.charAt(0)}</Text>
              </View>
              <View style={styles.pharmacyInfo}>
                <View style={styles.pharmacyNameRow}>
                  <Text style={styles.pharmacyName}>{item.pharmacy.name}</Text>
                  <View style={styles.sponsoredBadge}>
                    <Text style={styles.sponsoredText}>Sponsored</Text>
                  </View>
                </View>
                {item.pharmacy.rating && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <Text style={styles.ratingText}>{item.pharmacy.rating} ({item.pharmacy.reviewCount})</Text>
                  </View>
                )}
                {item.title && <Text style={styles.pharmacyDesc} numberOfLines={1}>{item.title}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  hero: { backgroundColor: '#F0FDFA', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 32 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#111827', lineHeight: 36 },
  heroSubtitle: { fontSize: 16, color: '#6B7280', marginTop: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, marginTop: 20, borderWidth: 1, borderColor: '#E5E7EB', paddingLeft: 12 },
  searchIcon: { marginRight: 4 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#111827' },
  searchButton: { backgroundColor: '#0D9488', padding: 12, borderRadius: 12, margin: 4 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  categoryRow: { paddingRight: 20 },
  categoryCard: { alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 12, width: 90 },
  categoryLabel: { fontSize: 11, color: '#374151', marginTop: 8, textAlign: 'center' },
  pharmacyCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  pharmacyAvatar: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  pharmacyAvatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  pharmacyInfo: { flex: 1, marginLeft: 12 },
  pharmacyNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pharmacyName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  sponsoredBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sponsoredText: { fontSize: 9, fontWeight: '600', color: '#92400E' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, color: '#6B7280' },
  pharmacyDesc: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});
