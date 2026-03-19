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
import { appointmentService, reminderService, notificationService, contentService } from '../../services/api';
import { Card, Badge, Button } from '../../components/UI';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { Bell, AlarmClock, Calendar, Clock, Video, Building2 } from 'lucide-react-native';

export default function PatientHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [notifications, setNotifications] = useState({ unread_count: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);

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

  const fetchContent = async () => {
    try {
      setContentLoading(true);
      const [adsRes, blogsRes] = await Promise.all([
        contentService.getCampaigns('home'),
        contentService.getBlogs(),
      ]);
      setAds(adsRes.data.ads || []);
      setBlogs((blogsRes.data.posts || []).slice(0, 5));
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchContent();
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
                source={require('../../../assets/icon.png')} 
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.greeting}>Good {getTimeGreeting()}</Text>
              <Text style={styles.userName}>{user?.full_name?.split(' ')[0]}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={24} color={COLORS.text} />
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
                <AlarmClock size={32} color={COLORS.surface} style={{ marginRight: SPACING.md }} />
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


        {/* Sponsored Ads */}
        {(ads.length > 0 || contentLoading) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Services</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md }}>
              {contentLoading
                ? [1, 2].map(i => <View key={i} style={[styles.adBanner, styles.adSkeleton]} />)
                : ads.map((ad) => (
                    <TouchableOpacity
                      key={ad.id}
                      activeOpacity={0.85}
                      onPress={() => contentService.trackAdClick(ad.id).catch(() => {})}
                    >
                      <View style={styles.adCard}>
                        <Image source={{ uri: ad.image_url }} style={styles.adBanner} />
                        <View style={styles.adBadge}>
                          <Text style={styles.adBadgeText}>Sponsored</Text>
                        </View>
                        <View style={styles.adTitleBar}>
                          <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
              }
            </ScrollView>
          </View>
        )}

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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} color={COLORS.textMuted} />
                        <Text style={styles.appointmentTime}>{apt.appointment_time}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {apt.consultation_type === 'telehealth' ? (
                          <Video size={12} color={COLORS.textMuted} />
                        ) : (
                          <Building2 size={12} color={COLORS.textMuted} />
                        )}
                        <Text style={styles.appointmentType}>
                          {apt.consultation_type === 'telehealth' ? 'Video' : 'In-person'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Calendar size={48} color={COLORS.primary + '80'} style={{ marginBottom: SPACING.sm }} />
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

        {/* Health Articles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Health Articles</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, paddingBottom: SPACING.md }}>
            {contentLoading
              ? [1, 2].map(i => <View key={i} style={[styles.blogCard, { backgroundColor: COLORS.surface }]} />)
              : blogs.length > 0
                ? blogs.map((post) => (
                    <Card elevated key={post.id || post.slug} style={styles.blogCard}>
                      <TouchableOpacity onPress={() => navigation.navigate && null}>
                        {post.cover_image
                          ? <Image source={{ uri: post.cover_image }} style={styles.blogImage} />
                          : <View style={[styles.blogImage, { backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center' }]}>
                              <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.primary + '60' }}>{post.title?.charAt(0)}</Text>
                            </View>
                        }
                        <View style={styles.blogContent}>
                          {post.category && <Text style={styles.blogCategory}>{post.category}</Text>}
                          <Text style={styles.blogTitle} numberOfLines={2}>{post.title}</Text>
                          <Text style={styles.blogReadMore}>Read Article ›</Text>
                        </View>
                      </TouchableOpacity>
                    </Card>
                  ))
                : (
                    <Card elevated style={[styles.blogCard, { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xl }]}>
                      <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>No articles yet</Text>
                    </Card>
                  )
            }
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
  adBanner: {
    width: 280,
    height: 140,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  adCard: {
    width: 280,
    height: 140,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  adSkeleton: {
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
  adBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adTitleBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  adTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  blogCard: {
    width: 240,
    padding: 0,
    overflow: 'hidden',
  },
  blogImage: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.surface,
  },
  blogContent: {
    padding: SPACING.md,
  },
  blogCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  blogTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  blogReadMore: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
  },
});
