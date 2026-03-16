import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appointmentService } from '../../services/api';
import { Card, Badge, Button } from '../../components/UI';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';

export default function DoctorAppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentService.list();
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, []);

  const handleConfirm = async (appointmentId) => {
    try {
      await appointmentService.update(appointmentId, { status: 'confirmed' });
      Alert.alert('Success', 'Appointment confirmed');
      fetchAppointments();
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm appointment');
    }
  };

  const handleComplete = async (appointmentId) => {
    Alert.alert(
      'Complete Appointment',
      'Mark this appointment as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await appointmentService.update(appointmentId, { status: 'completed' });
              Alert.alert('Success', 'Appointment marked as completed');
              fetchAppointments();
            } catch (error) {
              Alert.alert('Error', 'Failed to complete appointment');
            }
          },
        },
      ]
    );
  };

  const filteredAppointments = appointments.filter(apt => {
    const aptDate = parseISO(apt.appointment_date);
    
    switch (activeTab) {
      case 'today':
        return isToday(aptDate) && ['pending', 'confirmed'].includes(apt.status);
      case 'upcoming':
        return !isPast(aptDate) && ['pending', 'confirmed'].includes(apt.status);
      case 'pending':
        return apt.status === 'pending';
      case 'completed':
        return apt.status === 'completed';
      default:
        return true;
    }
  });

  const getStatusConfig = (status) => {
    const configs = {
      pending: { variant: 'warning', icon: '⏳', label: 'Pending' },
      confirmed: { variant: 'success', icon: '✓', label: 'Confirmed' },
      completed: { variant: 'info', icon: '✓', label: 'Completed' },
      cancelled: { variant: 'error', icon: '✕', label: 'Cancelled' },
    };
    return configs[status] || { variant: 'default', icon: '?', label: status };
  };

  const renderAppointment = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);
    const aptDate = parseISO(item.appointment_date);
    const isAppointmentToday = isToday(aptDate);
    
    return (
      <Card
        elevated
        style={styles.appointmentCard}
        onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateInfo}>
            <View style={styles.dateBox}>
              <Text style={styles.dateMonth}>{format(aptDate, 'MMM')}</Text>
              <Text style={styles.dateDay}>{format(aptDate, 'd')}</Text>
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.dayText}>{format(aptDate, 'EEEE')}</Text>
              <Text style={styles.timeText}>🕐 {item.appointment_time}</Text>
            </View>
          </View>
          <Badge text={`${statusConfig.icon} ${statusConfig.label}`} variant={statusConfig.variant} />
        </View>

        <View style={styles.patientInfo}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientInitial}>
              {item.patient?.full_name?.charAt(0) || 'P'}
            </Text>
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{item.patient?.full_name || 'Patient'}</Text>
            <Text style={styles.consultationType}>
              {item.consultation_type === 'telehealth' ? '📹 Video Call' : '🏥 In-person'}
            </Text>
          </View>
          <Text style={styles.paymentAmount}>${item.payment_amount}</Text>
        </View>

        {item.reason && (
          <View style={styles.reasonSection}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText} numberOfLines={2}>{item.reason}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {item.status === 'pending' && (
            <Button
              title="✓ Confirm"
              size="sm"
              onPress={(e) => {
                e?.stopPropagation?.();
                handleConfirm(item.id);
              }}
              style={styles.confirmBtn}
            />
          )}

          {item.status === 'confirmed' && isAppointmentToday && item.consultation_type === 'telehealth' && (
            <Button
              title="📹 Start Call"
              size="sm"
              onPress={() => navigation.navigate('VideoCall', { appointmentId: item.id })}
              style={styles.callBtn}
            />
          )}

          {item.status === 'confirmed' && (
            <Button
              title="Complete"
              size="sm"
              variant="outline"
              onPress={(e) => {
                e?.stopPropagation?.();
                handleComplete(item.id);
              }}
              style={styles.completeBtn}
            />
          )}

          <Button
            title="💬 Chat"
            size="sm"
            variant="ghost"
            onPress={() => navigation.navigate('Chat', { appointmentId: item.id })}
          />
        </View>
      </Card>
    );
  };

  const Tab = ({ label, value, count }) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === value && styles.tabActive]}
      onPress={() => setActiveTab(value)}
    >
      <Text style={[styles.tabText, activeTab === value && styles.tabTextActive]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.tabBadge, activeTab === value && styles.tabBadgeActive]}>
          <Text style={[styles.tabBadgeText, activeTab === value && styles.tabBadgeTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Patients</Text>
        <Text style={styles.subtitle}>{appointments.length} total appointments</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Tab label="Today" value="today" />
        <Tab label="Upcoming" value="upcoming" />
        <Tab label="Pending" value="pending" count={pendingCount} />
        <Tab label="Completed" value="completed" />
      </View>

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointment}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'pending' 
                ? 'No pending appointments to review'
                : activeTab === 'today'
                ? 'No appointments scheduled for today'
                : 'No appointments in this category'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.surface,
  },
  tabBadge: {
    marginLeft: 6,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.surface,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.surface,
  },
  tabBadgeTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  appointmentCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  timeInfo: {},
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  patientInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  consultationType: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reasonSection: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 13,
    color: COLORS.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  confirmBtn: {
    flex: 1,
  },
  callBtn: {
    flex: 1,
    backgroundColor: COLORS.success,
  },
  completeBtn: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
