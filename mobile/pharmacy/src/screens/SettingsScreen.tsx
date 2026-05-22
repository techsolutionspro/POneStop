import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role?.replace(/_/g, ' ')}</Text>
      </View>

      <View style={styles.menuSection}>
        {[
          { icon: 'storefront-outline' as const, label: 'Pharmacy Settings' },
          { icon: 'people-outline' as const, label: 'Team Members' },
          { icon: 'notifications-outline' as const, label: 'Notifications' },
          { icon: 'card-outline' as const, label: 'Billing & Plan' },
          { icon: 'help-circle-outline' as const, label: 'Help & Support' },
        ].map(item => (
          <TouchableOpacity key={item.label} style={styles.menuItem}>
            <Ionicons name={item.icon} size={22} color="#6B7280" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  profile: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0D9488', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  name: { fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 10 },
  email: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  role: { fontSize: 11, color: '#0D9488', marginTop: 4, textTransform: 'capitalize' },
  menuSection: { marginTop: 16, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', gap: 12 },
  menuLabel: { flex: 1, fontSize: 15, color: '#374151' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  logoutText: { fontSize: 15, color: '#EF4444', fontWeight: '500' },
});
