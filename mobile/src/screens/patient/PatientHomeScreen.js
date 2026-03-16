import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService, reminderService, notificationService } from '../../services/api';
import { Card, Badge, Button } from '../../components/UI';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

export default function PatientHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [notifications, setNotifications] = useState({ unread_count: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [appointmentsRes, remindersRes, notificationsRes] = await Promise.all([
        appointmentService.list(),
        reminderService.getUpcoming(),
        notificationService.list(),
      ]);
      setAppointments(appointmentsRes.data.appointments);
      setReminders(remindersRes.data.reminders);
      setNotifications(notificationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const upcomingAppointments = appointments
    .filter(apt => ['pending', 'confirmed'].includes(apt.status))
    .slice(0, 3);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'success',
      completed: 'info',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const QuickAction = ({ icon, label, onPress, color }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.quickActionIcon}
      >
        <Text style={styles.quickActionEmoji}>{icon}</Text>
      </LinearGradient>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogoContainer}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.greeting}>Good {getTimeGreeting()} 👋</Text>
              <Text style={styles.userName}>{user?.full_name?.split(' ')[0]}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            {notifications.unread_count > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notifications.unread_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Reminders Banner */}
        {reminders.length > 0 && (
          <Card elevated style={styles.reminderCard}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.reminderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.reminderContent}>
                <Text style={styles.reminderIcon}>⏰</Text>
                <View style={styles.reminderTextContainer}>
                  <Text style={styles.reminderTitle}>Upcoming Appointment</Text>
                  <Text style={styles.reminderText}>
                    {reminders[0].message} with Dr. {reminders[0].appointment?.doctor?.full_name}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickAction
              icon="🔍"
              label="Find Doctor"
              color={COLORS.primary}
              onPress={() => navigation.navigate('Search')}
            />
            <QuickAction
              icon="📅"
              label="Appointments"
              color={COLORS.success}
              onPress={() => navigation.navigate('Appointments')}
            />
            <QuickAction
              icon="👨‍👩‍👧"
              label="Family"
              color={COLORS.info}
              onPress={() => navigation.navigate('Family')}
            />
            <QuickAction
              icon="⚙️"
              label="Settings"
              color={COLORS.secondary}
              onPress={() => navigation.navigate('Profile')}
            />
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {appointments.length > 3 && (
              <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((apt) => (
              <Card
                key={apt.id}
                elevated
                style={styles.appointmentCard}
                onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt.id })}
              >
                <View style={styles.appointmentContent}>
                  <View style={styles.appointmentDate}>
                    <Text style={styles.appointmentMonth}>
                      {format(parseISO(apt.appointment_date), 'MMM')}
                    </Text>
                    <Text style={styles.appointmentDay}>
                      {format(parseISO(apt.appointment_date), 'd')}
                    </Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.doctorName}>
                        Dr. {apt.doctor?.full_name || 'Doctor'}
                      </Text>
                      <Badge text={apt.status} variant={getStatusColor(apt.status)} />
                    </View>
                    <Text style={styles.appointmentSpecialty}>
                      {apt.doctor?.specialties?.[0] || 'General Medicine'}
                    </Text>
                    <View style={styles.appointmentMeta}>
                      <Text style={styles.appointmentTime}>
                        🕐 {apt.appointment_time}
                      </Text>
                      <Text style={styles.appointmentType}>
                        {apt.consultation_type === 'telehealth' ? '📹 Video' : '🏥 In-person'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No Upcoming Appointments</Text>
              <Text style={styles.emptyText}>Book your first appointment with a doctor</Text>
              <Button
                title="Find a Doctor"
                size="sm"
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Search')}
              />
            </Card>
          )}
        </View>

        {/* Health Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Tips</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Card elevated style={styles.tipCard}>
              <Text style={styles.tipIcon}>💧</Text>
              <Text style={styles.tipTitle}>Stay Hydrated</Text>
              <Text style={styles.tipText}>Drink 8 glasses of water daily</Text>
            </Card>
            <Card elevated style={styles.tipCard}>
              <Text style={styles.tipIcon}>🏃</Text>
              <Text style={styles.tipTitle}>Stay Active</Text>
              <Text style={styles.tipText}>30 mins exercise daily</Text>
            </Card>
            <Card elevated style={styles.tipCard}>
              <Text style={styles.tipIcon}>😴</Text>
              <Text style={styles.tipTitle}>Sleep Well</Text>
              <Text style={styles.tipText}>Get 7-8 hours of sleep</Text>
            </Card>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    ...SHADOWS.sm,
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  notificationBtn: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  reminderCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  reminderGradient: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderTitle: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  reminderText: {
    color: COLORS.surface + 'CC',
    fontSize: 14,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  appointmentCard: {
    marginBottom: SPACING.sm,
  },
  appointmentContent: {
    flexDirection: 'row',
  },
  appointmentDate: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  appointmentMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  appointmentDay: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  appointmentSpecialty: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  appointmentMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  appointmentTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  appointmentType: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  emptyButton: {
    minWidth: 140,
  },
  tipCard: {
    width: 140,
    marginRight: SPACING.sm,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  tipIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
