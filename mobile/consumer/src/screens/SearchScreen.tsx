import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { marketplaceApi } from '../api/client';

interface SearchScreenProps {
  navigation: any;
  route: any;
}

export default function SearchScreen({ navigation, route }: SearchScreenProps) {
  const initialPostcode = route.params?.postcode || '';
  const initialCategory = route.params?.category || '';

  const [postcode, setPostcode] = useState(initialPostcode);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialPostcode) doSearch(initialPostcode, initialCategory);
  }, []);

  const doSearch = async (pc: string, category?: string) => {
    if (!pc) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await marketplaceApi.search({ postcode: pc, radius: 10, category: category || undefined });
      setResults(res.data.data || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const renderPharmacy = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PharmacyDetail', { slug: item.slug })}
    >
      <View style={[styles.avatar, { backgroundColor: item.primaryColor || '#0D9488' }]}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <View style={styles.cardMeta}>
          {item.rating && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.metaText}>{item.rating}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.distance} mi</Text>
          </View>
          {item.deliveryFee !== null && (
            <View style={styles.metaItem}>
              <Ionicons name="car-outline" size={12} color="#9CA3AF" />
              <Text style={styles.metaText}>{item.deliveryFee === 0 ? 'Free' : `£${item.deliveryFee}`}</Text>
            </View>
          )}
        </View>
        <Text style={styles.serviceCount}>{item.serviceCount} services</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="location-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Postcode"
          value={postcode}
          onChangeText={setPostcode}
          onSubmitEditing={() => doSearch(postcode)}
          autoCapitalize="characters"
        />
        <TouchableOpacity onPress={() => doSearch(postcode)} style={styles.searchBtn}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.loadingText}>Searching nearby...</Text>
        </View>
      )}

      {!loading && searched && results.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No pharmacies found nearby</Text>
          <Text style={styles.emptySubtext}>Try a different postcode or increase radius</Text>
        </View>
      )}

      {!loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderPharmacy}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>{results.length} pharmacies found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827', marginLeft: 8 },
  searchBtn: { backgroundColor: '#0D9488', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { color: '#6B7280', marginTop: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptySubtext: { color: '#9CA3AF', marginTop: 4 },
  list: { padding: 16, paddingTop: 0 },
  resultCount: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  avatar: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: '#6B7280' },
  serviceCount: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
});
