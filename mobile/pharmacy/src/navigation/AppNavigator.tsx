import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth';

import DashboardScreen from '../screens/DashboardScreen';
import OrdersScreen from '../screens/OrdersScreen';
import EarningsScreen from '../screens/EarningsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} options={{ title: 'Dashboard' }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OrdersMain" component={OrdersScreen} options={{ title: 'Orders' }} />
    </Stack.Navigator>
  );
}

function EarningsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="EarningsMain" component={EarningsScreen} options={{ title: 'Earnings' }} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: 'More' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { loadUser } = useAuthStore();

  useEffect(() => { loadUser(); }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#0D9488',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          tabBarStyle: { borderTopColor: '#F3F4F6', paddingTop: 4, height: 85, paddingBottom: 28 },
          tabBarIcon: ({ color }) => {
            const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
              Dashboard: 'grid-outline',
              Orders: 'bag-outline',
              Earnings: 'wallet-outline',
              More: 'ellipsis-horizontal-outline',
            };
            return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardStack} />
        <Tab.Screen name="Orders" component={OrdersStack} />
        <Tab.Screen name="Earnings" component={EarningsStack} />
        <Tab.Screen name="More" component={SettingsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
