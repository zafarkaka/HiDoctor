import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService, reviewService } from '../../services/api';
import { Card, Badge, Button, Divider } from '../../components/UI';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ChevronLeft, Clock, Video, Building2 } from 'lucide-react-native';

export default function AppointmentDetailScreen({ route, navigation }) {
  const { appointmentId } = route.params;
  const { user, isPatient, isDoctor } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointment = async () => {
    try {
      const [appointmentRes] = await Promise.all([
        appointmentService.getById(appointmentId),
      ]);
      setAppointment(appointmentRes.data);

      // Check if patient can review
      if (isPatient && appointmentRes.data.status === 'completed') {
        try {
          const reviewRes = await reviewService.canReview(appointmentId);
          setCanReview(reviewRes.data.can_review);
        } catch {
          setCanReview(false);
        }
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      Alert.alert('Error', 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointment();
    setRefreshing(false);
  }, [appointmentId]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await appointmentService.cancel(appointmentId);
              Alert.alert('Success', 'Appointment cancelled');
              fetchAppointment();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel appointment');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await appointmentService.update(appointmentId, { status: 'confirmed' });
      Alert.alert('Success', 'Appointment confirmed');
      fetchAppointment();
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    Alert.alert(
      'Complete Appointment',
      'Mark this appointment as completed?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            setActionLoading(true);
            try {
              await appointmentService.update(appointmentId, { status: 'completed' });
              Alert.alert('Success', 'Appointment marked as completed');
              fetchAppointment();
            } catch (error) {
              Alert.alert('Error', 'Failed to complete appointment');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { variant: 'warning', color: COLORS.warning, label: 'Pending Confirmation' },
      confirmed: { variant: 'success', color: COLORS.success, label: 'Confirmed' },
      completed: { variant: 'info', color: COLORS.info, label: 'Completed' },
      cancelled: { variant: 'error', color: COLORS.error, label: 'Cancelled' },
      no_show: { variant: 'error', color: COLORS.error, label: 'No Show' },
    };
    return configs[status] || { variant: 'default', color: COLORS.textMuted, label: status };
  };

  if (loading || !appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(appointment.status);
  const appointmentDate = parseISO(appointment.appointment_date);
  const isAppointmentToday = isToday(appointmentDate);
  const isAppointmentPast = isPast(appointmentDate);
  const canJoinCall = appointment.consultation_type === 'telehealth' && 
    appointment.status === 'confirmed' && isAppointmentToday;

  const doctorOrPatient = isPatient ? appointment.doctor : appointment.patient;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={32} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Status Banner */}
        <LinearGradient
          colors={[statusConfig.color + '20', statusConfig.color + '10']}
          style={styles.statusBanner}
        >
          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </LinearGradient>

        {/* Main Info Card */}
        <Card elevated style={styles.mainCard}>
          {/* Date & Time */}
          <View style={styles.dateTimeSection}>
            <View style={styles.dateBox}>
              <Text style={styles.dateMonth}>{format(appointmentDate, 'MMM')}</Text>
              <Text style={styles.dateDay}>{format(appointmentDate, 'd')}</Text>
              <Text style={styles.dateYear}>{format(appointmentDate, 'yyyy')}</Text>
            </View>
            <View style={styles.dateInfo}>
              <Text style={styles.dateText}>{format(appointmentDate, 'EEEE')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 }}>
                <Clock size={14} color={COLORS.textMuted} />
                <Text style={styles.timeText}>{appointment.appointment_time}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {appointment.consultation_type === 'telehealth' ? (
                  <Video size={14} color={COLORS.textMuted} />
                ) : (
                  <Building2 size={14} color={COLORS.textMuted} />
                )}
                <Badge 
                  text={appointment.consultation_type === 'telehealth' ? 'Video Call' : 'In-person'} 
                  variant={appointment.consultation_type === 'telehealth' ? 'info' : 'default'} 
                />
              </View>
            </View>
          </View>

          <Divider />

          {/* Doctor/Patient Info */}
          <View style={styles.personSection}>
            <View style={styles.personAvatar}>
              <Text style={styles.personInitial}>
                {doctorOrPatient?.full_name?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personLabel}>{isPatient ? 'Doctor' : 'Patient'}</Text>
              <Text style={styles.personName}>
                {isPatient ? `Dr. ${doctorOrPatient?.full_name}` : doctorOrPatient?.full_name}
              </Text>
              {isPatient && appointment.doctor?.specialties?.[0] && (
                <Text style={styles.personDetail}>{appointment.doctor.specialties[0]}</Text>
              )}
            </View>
          </View>

          {/* Reason */}
          {appointment.reason && (
            <>
              <Divider />
              <View style={styles.reasonSection}>
                <Text style={styles.sectionLabel}>Reason for Visit</Text>
                <Text style={styles.reasonText}>{appointment.reason}</Text>
              </View>
            </>
          )}

          {/* Family Member */}
          {appointment.family_member && (
            <>
              <Divider />
              <View style={styles.familySection}>
                <Text style={styles.sectionLabel}>Patient</Text>
                <View style={styles.familyInfo}>
                  <Text style={styles.familyName}>{appointment.family_member.full_name}</Text>
                  <Badge text={appointment.family_member.relationship} variant="default" size="sm" />
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Payment Card */}
        <Card elevated style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Consultation Fee</Text>
            <Text style={styles.paymentAmount}>₹{appointment.payment_amount}</Text>
          </View>
          <View style={styles.paymentStatusRow}>
            <Text style={styles.paymentLabel}>Status</Text>
            <Badge 
              text={appointment.payment_status === 'paid' ? 'Paid' : 'Pending'} 
              variant={appointment.payment_status === 'paid' ? 'success' : 'warning'}
            />
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>


          {/* Chat Button */}
          {['pending', 'confirmed'].includes(appointment.status) && (
            <Button
              title="Chat"
              variant="outline"
              onPress={() => navigation.navigate('Chat', { appointmentId })}
              style={styles.actionButton}
            />
          )}

          {/* Doctor Actions */}
          {isDoctor && appointment.status === 'pending' && (
            <Button
              title="Confirm Appointment"
              onPress={handleConfirm}
              loading={actionLoading}
              style={styles.actionButton}
            />
          )}

          {isDoctor && appointment.status === 'confirmed' && !isAppointmentPast && (
            <Button
              title="Mark as Completed"
              variant="outline"
              onPress={handleComplete}
              loading={actionLoading}
              style={styles.actionButton}
            />
          )}

          {/* Patient Actions */}
          {isPatient && canReview && (
            <Button
              title="Leave a Review"
              onPress={() => navigation.navigate('Review', { 
                appointmentId, 
                doctorId: appointment.doctor_id 
              })}
              style={styles.actionButton}
            />
          )}

          {/* Cancel Button */}
          {['pending', 'confirmed'].includes(appointment.status) && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={actionLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notes */}
        {appointment.notes && (
          <Card style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  mainCard: {
    marginBottom: SPACING.md,
  },
  dateTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    width: 70,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dateYear: {
    fontSize: 11,
    color: COLORS.primary,
  },
  dateInfo: {
    flex: 1,
    gap: 4,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  personSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  personInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  personInfo: {
    flex: 1,
  },
  personLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  personDetail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  reasonSection: {
    marginTop: SPACING.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  familySection: {
    marginTop: SPACING.xs,
  },
  familyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  familyName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  paymentCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  paymentAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actions: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionButton: {
    width: '100%',
  },
  cancelButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
  notesCard: {
    backgroundColor: COLORS.primary + '08',
    borderColor: COLORS.primary + '20',
  },
  notesText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
