import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth';

export default function AccountScreen({ navigation }: { navigation: any }) {
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.title}>Welcome to Pharmacy One Stop</Text>
          <Text style={styles.subtitle}>Log in to manage your orders and profile</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Don&apos;t have an account? Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.menuSection}>
        {[
          { icon: 'person-outline' as const, label: 'Edit Profile', screen: 'EditProfile' },
          { icon: 'receipt-outline' as const, label: 'My Orders', screen: 'Orders' },
          { icon: 'notifications-outline' as const, label: 'Notifications', screen: 'Notifications' },
          { icon: 'help-circle-outline' as const, label: 'Help & Support', screen: 'Help' },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem}>
            <Ionicons name={item.icon} size={22} color="#6B7280" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  title: { fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  loginButton: { backgroundColor: '#0D9488', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 24 },
  loginButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  registerLink: { color: '#0D9488', fontSize: 14, marginTop: 16 },
  profile: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0D9488', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '600', color: '#111827', marginTop: 12 },
  email: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  menuSection: { marginTop: 16, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', gap: 12 },
  menuLabel: { flex: 1, fontSize: 15, color: '#374151' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, marginTop: 24 },
  logoutText: { fontSize: 15, color: '#EF4444', fontWeight: '500' },
});
