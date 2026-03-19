import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../utils/constants';
import { Home, Search, Calendar, Users, User } from 'lucide-react-native';

// Patient Screens
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import DoctorDiscoveryScreen from '../screens/patient/DoctorDiscoveryScreen';
import AppointmentsScreen from '../screens/patient/AppointmentsScreen';
import FamilyScreen from '../screens/patient/FamilyScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';

const Tab = createBottomTabNavigator();

// Tab Icon Component
const TabIcon = ({ focused, iconName, label }) => {
  const icons = {
    home: <Home size={20} color={focused ? COLORS.primary : COLORS.textMuted} strokeWidth={focused ? 2.5 : 2} />,
    search: <Search size={20} color={focused ? COLORS.primary : COLORS.textMuted} strokeWidth={focused ? 2.5 : 2} />,
    calendar: <Calendar size={20} color={focused ? COLORS.primary : COLORS.textMuted} strokeWidth={focused ? 2.5 : 2} />,
    family: <Users size={20} color={focused ? COLORS.primary : COLORS.textMuted} strokeWidth={focused ? 2.5 : 2} />,
    profile: <User size={20} color={focused ? COLORS.primary : COLORS.textMuted} strokeWidth={focused ? 2.5 : 2} />,
  };

  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
        {icons[iconName]}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
};

export default function PatientTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={PatientHomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="home" label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={DoctorDiscoveryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="search" label="Doctors" />
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="calendar" label="Bookings" />
          ),
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="family" label="Family" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="profile" label="Profile" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 80,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary + '15',
  },
  tabIcon: {
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
