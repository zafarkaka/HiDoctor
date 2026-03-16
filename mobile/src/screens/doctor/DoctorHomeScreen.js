import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService, notificationService, doctorService } from '../../services/api';
import { Card, Badge, Button } from '../../components/UI';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

export default function DoctorHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState({ unread_count: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [appointmentsRes, notificationsRes, profileRes] = await Promise.all([
        appointmentService.list(),
        notificationService.list(),
        doctorService.getProfile().catch(() => ({ data: null })),
      ]);
      setAppointments(appointmentsRes.data.appointments || []);
      setNotifications(notificationsRes.data);
      setProfile(profileRes.data);
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

  // Filter appointments
  const todayAppointments = appointments.filter(apt => {
    const aptDate = parseISO(apt.appointment_date);
    return isToday(aptDate) && ['pending', 'confirmed'].includes(apt.status);
  });

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'success',
      completed: 'info',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const StatCard = ({ icon, value, label, color }) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.statIcon}
      >
        <Text style={styles.statEmoji}>{icon}</Text>
      </LinearGradient>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
                source={require('../../../assets/icon.png')} 
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.greeting}>Good {getTimeGreeting()} 👋</Text>
              <Text style={styles.userName}>Dr. {user?.full_name?.split(' ')[0]}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => {}}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            {notifications.unread_count > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notifications.unread_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Setup Alert */}
        {!profile?.is_verified && (
          <Card style={styles.alertCard}>
            <LinearGradient
              colors={[COLORS.warning + '20', COLORS.warning + '10']}
              style={styles.alertGradient}
            >
              <Text style={styles.alertIcon}>⚠️</Text>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Complete Your Profile</Text>
                <Text style={styles.alertText}>
                  Set up your profile to start receiving appointments
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.alertButton}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.alertButtonText}>Setup →</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Card>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard 
            icon="📅" 
            value={todayAppointments.length} 
            label="Today" 
            color={COLORS.primary} 
          />
          <StatCard 
            icon="⏳" 
            value={pendingAppointments.length} 
            label="Pending" 
            color={COLORS.warning} 
          />
          <StatCard 
            icon="✓" 
            value={confirmedAppointments.length} 
            label="Confirmed" 
            color={COLORS.success} 
          />
          <StatCard 
            icon="⭐" 
            value={profile?.rating?.toFixed(1) || '5.0'} 
            label="Rating" 
            color={COLORS.info} 
          />
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {todayAppointments.length > 0 ? (
            todayAppointments.map((apt) => (
              <Card
                key={apt.id}
                elevated
                style={styles.appointmentCard}
                onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt.id })}
              >
                <View style={styles.appointmentContent}>
                  <View style={styles.appointmentTime}>
                    <Text style={styles.timeText}>{apt.appointment_time}</Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.patientName}>{apt.patient?.full_name || 'Patient'}</Text>
                      <Badge text={apt.status} variant={getStatusColor(apt.status)} />
                    </View>
                    {apt.reason && (
                      <Text style={styles.appointmentReason} numberOfLines={1}>
                        {apt.reason}
                      </Text>
                    )}
                    <View style={styles.appointmentMeta}>
                      <Text style={styles.metaText}>
                        {apt.consultation_type === 'telehealth' ? '📹 Video' : '🏥 In-person'}
                      </Text>
                      <Text style={styles.metaText}>${apt.payment_amount}</Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                {apt.status === 'pending' && (
                  <View style={styles.appointmentActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        navigation.navigate('AppointmentDetail', { appointmentId: apt.id });
                      }}
                    >
                      <Text style={styles.actionButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {apt.status === 'confirmed' && apt.consultation_type === 'telehealth' && (
                  <TouchableOpacity 
                    style={styles.joinCallButton}
                    onPress={() => navigation.navigate('VideoCall', { appointmentId: apt.id })}
                  >
                    <Text style={styles.joinCallText}>📹 Start Video Call</Text>
                  </TouchableOpacity>
                )}
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No appointments today</Text>
              <Text style={styles.emptyText}>Your schedule is free for today</Text>
            </Card>
          )}
        </View>

        {/* Pending Requests */}
        {pendingAppointments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Requests</Text>
              <Badge text={`${pendingAppointments.length} new`} variant="warning" />
            </View>

            {pendingAppointments.slice(0, 3).map((apt) => (
              <Card
                key={apt.id}
                style={styles.pendingCard}
                onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt.id })}
              >
                <View style={styles.pendingContent}>
                  <View style={styles.pendingInfo}>
                    <Text style={styles.pendingName}>{apt.patient?.full_name || 'Patient'}</Text>
                    <Text style={styles.pendingDate}>
                      {format(parseISO(apt.appointment_date), 'MMM d')} at {apt.appointment_time}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.confirmButton}>
                    <Text style={styles.confirmButtonText}>Review</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('Schedule')}
            >
              <LinearGradient
                colors={[COLORS.primary + '20', COLORS.primary + '10']}
                style={styles.quickActionIcon}
              >
                <Text style={styles.quickActionEmoji}>⏰</Text>
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Set Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('Profile')}
            >
              <LinearGradient
                colors={[COLORS.info + '20', COLORS.info + '10']}
                style={styles.quickActionIcon}
              >
                <Text style={styles.quickActionEmoji}>👤</Text>
              </LinearGradient>
              <Text style={styles.quickActionLabel}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('Appointments')}
            >
              <LinearGradient
                colors={[COLORS.success + '20', COLORS.success + '10']}
                style={styles.quickActionIcon}
              >
                <Text style={styles.quickActionEmoji}>📋</Text>
              </LinearGradient>
              <Text style={styles.quickActionLabel}>All Patients</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  alertCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    borderColor: COLORS.warning + '40',
  },
  alertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  alertIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  alertText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  alertButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.md,
  },
  alertButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statEmoji: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
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
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  appointmentCard: {
    marginBottom: SPACING.sm,
  },
  appointmentContent: {
    flexDirection: 'row',
  },
  appointmentTime: {
    width: 60,
    alignItems: 'center',
    paddingRight: SPACING.md,
    borderRightWidth: 2,
    borderRightColor: COLORS.primary,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  appointmentInfo: {
    flex: 1,
    paddingLeft: SPACING.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  appointmentReason: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  appointmentMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  actionButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '15',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  joinCallButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.success + '15',
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  joinCallText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
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
  },
  pendingCard: {
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.warning + '08',
    borderColor: COLORS.warning + '30',
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  pendingDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  confirmButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.md,
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.surface,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
  },
  quickAction: {
    alignItems: 'center',
    width: '30%',
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
});
