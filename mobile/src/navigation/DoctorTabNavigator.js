import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../utils/constants';
import { Home, Calendar, Clock, User } from 'lucide-react-native';

// Doctor Screens
import DoctorHomeScreen from '../screens/doctor/DoctorHomeScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import ScheduleScreen from '../screens/doctor/ScheduleScreen';
import DoctorProfileSettingsScreen from '../screens/doctor/DoctorProfileSettingsScreen';

const Tab = createBottomTabNavigator();

// Tab Icon Component
const TabIcon = ({ focused, iconName, label }) => {
  const icons = {
    home: <Home size={20} color={focused ? COLORS.primary : COLORS.textMuted} strokeWidth={focused ? 2.5 : 2} />,
    calendar: <Calendar size={20} color={focused ? COLORS.primary : COLORS.textMuted} strokeWidth={focused ? 2.5 : 2} />,
    schedule: <Clock size={20} color={focused ? COLORS.primary : COLORS.textMuted} strokeWidth={focused ? 2.5 : 2} />,
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

export default function DoctorTabNavigator() {
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
        component={DoctorHomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="home" label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={DoctorAppointmentsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="calendar" label="Patients" />
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="schedule" label="Schedule" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DoctorProfileSettingsScreen}
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
