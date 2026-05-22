import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import PharmacyDetailScreen from '../screens/PharmacyDetailScreen';
import OrdersScreen from '../screens/OrdersScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="PharmacyDetail" component={PharmacyDetailScreen} options={{ headerShown: true, title: '' }} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SearchMain" component={SearchScreen} options={{ title: 'Search Pharmacies' }} />
      <Stack.Screen name="PharmacyDetail" component={PharmacyDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OrdersMain" component={OrdersScreen} options={{ title: 'My Orders' }} />
    </Stack.Navigator>
  );
}

function AccountStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AccountMain" component={AccountScreen} options={{ title: 'Account' }} />
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
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
              Home: 'home-outline',
              Search: 'search-outline',
              Orders: 'receipt-outline',
              Account: 'person-outline',
            };
            return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Search" component={SearchStack} />
        <Tab.Screen name="Orders" component={OrdersStack} />
        <Tab.Screen name="Account" component={AccountStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
