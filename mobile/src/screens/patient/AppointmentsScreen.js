import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appointmentService } from '../../services/api';
import { Card, Badge } from '../../components/UI';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { format, parseISO } from 'date-fns';
import { Calendar, ClipboardList, Clock, Video, Building2 } from 'lucide-react-native';

export default function AppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentService.list();
      setAppointments(response.data.appointments);
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

  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === 'upcoming') {
      return ['pending', 'confirmed'].includes(apt.status);
    }
    return ['completed', 'cancelled', 'no_show'].includes(apt.status);
  });

  const getStatusConfig = (status) => {
    const configs = {
      pending: { variant: 'warning' },
      confirmed: { variant: 'success' },
      completed: { variant: 'info' },
      cancelled: { variant: 'error' },
      no_show: { variant: 'error' },
    };
    return configs[status] || { variant: 'default' };
  };

  const renderAppointment = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);
    
    return (
      <Card
        elevated
        style={styles.appointmentCard}
        onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateBox}>
            <Text style={styles.dateMonth}>{format(parseISO(item.appointment_date), 'MMM')}</Text>
            <Text style={styles.dateDay}>{format(parseISO(item.appointment_date), 'd')}</Text>
          </View>
          <Badge text={item.status} variant={statusConfig.variant} />
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.doctorName}>Dr. {item.doctor?.full_name || 'Doctor'}</Text>
          <Text style={styles.specialty}>{item.doctor?.specialties?.[0] || 'General Medicine'}</Text>
          
          <View style={styles.metaRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{item.appointment_time}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {item.consultation_type === 'telehealth' ? (
                <Video size={12} color={COLORS.textMuted} />
              ) : (
                <Building2 size={12} color={COLORS.textMuted} />
              )}
              <Text style={styles.metaText}>
                {item.consultation_type === 'telehealth' ? 'Video Call' : 'In-person'}
              </Text>
            </View>
          </View>


        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>₹{item.payment_amount}</Text>
          <Badge 
            text={item.payment_status === 'paid' ? 'Paid' : 'Pending'} 
            variant={item.payment_status === 'paid' ? 'success' : 'warning'}
            size="sm"
          />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
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
            {activeTab === 'upcoming' ? (
              <Calendar size={48} color={COLORS.primary + '80'} style={{ marginBottom: SPACING.md }} />
            ) : (
              <ClipboardList size={48} color={COLORS.primary + '80'} style={{ marginBottom: SPACING.md }} />
            )}
            <Text style={styles.emptyTitle}>
              No {activeTab === 'upcoming' ? 'upcoming' : 'past'} appointments
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming' 
                ? 'Book an appointment with a doctor to get started'
                : 'Your completed appointments will appear here'}
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.surface,
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
  dateBox: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cardBody: {
    marginBottom: SPACING.md,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  specialty: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  joinButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.success + '15',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
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
