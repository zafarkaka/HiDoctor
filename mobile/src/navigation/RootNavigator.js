import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Patient Navigator
import PatientTabNavigator from './PatientTabNavigator';

// Doctor Navigator
import DoctorTabNavigator from './DoctorTabNavigator';

// Shared Screens
import DoctorProfileScreen from '../screens/shared/DoctorProfileScreen';
import BookingScreen from '../screens/patient/BookingScreen';
import AppointmentDetailScreen from '../screens/shared/AppointmentDetailScreen';
import ChatScreen from '../screens/shared/ChatScreen';

import ReviewScreen from '../screens/patient/ReviewScreen';

import NotificationsScreen from '../screens/shared/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { loading, isAuthenticated, isPatient, isDoctor } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : isPatient ? (
        // Patient Stack
        <>
          <Stack.Screen name="PatientTabs" component={PatientTabNavigator} />
          <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />

          <Stack.Screen name="Review" component={ReviewScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      ) : isDoctor ? (
        // Doctor Stack
        <>
          <Stack.Screen name="DoctorTabs" component={DoctorTabNavigator} />
          <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />

          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      ) : null}
    </Stack.Navigator>
  );
}
