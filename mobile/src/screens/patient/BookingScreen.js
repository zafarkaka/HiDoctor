import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { doctorService, familyService, appointmentService, paymentService } from '../../services/api';
import { Card, Button, Badge } from '../../components/UI';
import { COLORS, SPACING, RADIUS, TIME_SLOTS } from '../../utils/constants';
import { format, addDays, parseISO } from 'date-fns';

const STEPS = ['Type', 'Date', 'Patient', 'Details', 'Confirm'];

export default function BookingScreen({ route, navigation }) {
  const { doctorId } = route.params;
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [doctor, setDoctor] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [booking, setBooking] = useState({
    consultation_type: 'in_person',
    appointment_date: null,
    appointment_time: '',
    patient_type: 'myself',
    family_member_id: null,
    reason: '',
  });

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (booking.appointment_date) {
      fetchAvailableSlots();
    }
  }, [booking.appointment_date]);

  const fetchData = async () => {
    try {
      const [doctorRes, familyRes] = await Promise.all([
        doctorService.getById(doctorId),
        familyService.list(),
      ]);
      setDoctor(doctorRes.data);
      setFamilyMembers(familyRes.data.members);
    } catch (error) {
      Alert.alert('Error', 'Failed to load booking data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const dateStr = format(booking.appointment_date, 'yyyy-MM-dd');
      const response = await doctorService.getAvailableSlots(doctorId, dateStr);
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots(TIME_SLOTS.map(time => ({ time, is_available: true })));
    }
  };

  const handleNext = () => {
    if (step === 1 && (!booking.appointment_date || !booking.appointment_time)) {
      Alert.alert('Error', 'Please select a date and time');
      return;
    }
    if (step === 2 && booking.patient_type !== 'myself' && !booking.family_member_id) {
      Alert.alert('Error', 'Please select a family member');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 0) {
      navigation.goBack();
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (payNow = true) => {
    setSubmitting(true);
    try {
      const appointmentData = {
        doctor_id: doctorId,
        consultation_type: booking.consultation_type,
        appointment_date: format(booking.appointment_date, 'yyyy-MM-dd'),
        appointment_time: booking.appointment_time,
        reason: booking.reason,
        family_member_id: booking.patient_type !== 'myself' ? booking.family_member_id : null,
      };

      const response = await appointmentService.create(appointmentData);
      const appointmentId = response.data.appointment.id;

      if (payNow) {
        // Create Razorpay order
        try {
          const orderResponse = await paymentService.createRazorpayOrder(appointmentId);
          const orderData = orderResponse.data;
          
          if (orderData.is_mock) {
            // MOCK MODE: Auto-complete payment for testing
            Alert.alert(
              'Mock Payment',
              `Payment of $${doctor?.consultation_fee} will be simulated.\n\nNote: Replace RAZORPAY keys in .env for real payments.`,
              [
                {
                  text: 'Simulate Payment',
                  onPress: async () => {
                    try {
                      await paymentService.verifyRazorpayPayment({
                        razorpay_order_id: orderData.order_id,
                        razorpay_payment_id: `pay_mock_${Date.now()}`,
                        razorpay_signature: 'mock_signature'
                      });
                      Alert.alert('Success', 'Payment completed! (MOCK)', [
                        { text: 'OK', onPress: () => navigation.replace('AppointmentDetail', { appointmentId }) }
                      ]);
                    } catch (err) {
                      Alert.alert('Error', 'Mock payment failed');
                    }
                  }
                },
                {
                  text: 'Pay Later',
                  style: 'cancel',
                  onPress: () => navigation.replace('AppointmentDetail', { appointmentId })
                }
              ]
            );
          } else {
            // REAL MODE: Open Razorpay checkout
            // Note: In a real app, you would use the react-native-razorpay SDK
            Alert.alert(
              'Payment',
              `Razorpay checkout ready.\nOrder ID: ${orderData.order_id}\nAmount: INR ${orderData.amount / 100}`,
              [{ text: 'OK', onPress: () => navigation.replace('AppointmentDetail', { appointmentId }) }]
            );
          }
        } catch (paymentError) {
          console.error('Payment error:', paymentError);
          Alert.alert(
            'Payment Error',
            'Could not initiate payment. Your appointment is created but pending payment.',
            [{ text: 'OK', onPress: () => navigation.replace('AppointmentDetail', { appointmentId }) }]
          );
        }
      } else {
        Alert.alert('Success', 'Appointment booked! Pay at clinic.', [
          { text: 'OK', onPress: () => navigation.replace('AppointmentDetail', { appointmentId }) },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.progressStep}>
            <View style={[styles.progressDot, i <= step && styles.progressDotActive]}>
              {i < step ? <Text style={styles.progressCheck}>✓</Text> : <Text style={styles.progressNumber}>{i + 1}</Text>}
            </View>
            <Text style={[styles.progressLabel, i <= step && styles.progressLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Doctor Info */}
        <Card style={styles.doctorCard}>
          <View style={styles.doctorRow}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.doctorInitial}>{doctor?.full_name?.charAt(0)}</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor?.title} {doctor?.full_name}</Text>
              <Text style={styles.doctorSpecialty}>{doctor?.specialties?.[0]}</Text>
            </View>
            <Text style={styles.doctorFee}>${doctor?.consultation_fee}</Text>
          </View>
        </Card>

        {/* Step 0: Visit Type */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Visit Type</Text>
            <View style={styles.optionsGrid}>
              {doctor?.consultation_types?.includes('in_person') && (
                <TouchableOpacity
                  style={[styles.optionCard, booking.consultation_type === 'in_person' && styles.optionCardActive]}
                  onPress={() => setBooking({ ...booking, consultation_type: 'in_person' })}
                >
                  <Text style={styles.optionIcon}>🏥</Text>
                  <Text style={styles.optionTitle}>In-Person</Text>
                  <Text style={styles.optionDesc}>Visit the clinic</Text>
                </TouchableOpacity>
              )}
              {doctor?.consultation_types?.includes('telehealth') && (
                <TouchableOpacity
                  style={[styles.optionCard, booking.consultation_type === 'telehealth' && styles.optionCardActive]}
                  onPress={() => setBooking({ ...booking, consultation_type: 'telehealth' })}
                >
                  <Text style={styles.optionIcon}>📹</Text>
                  <Text style={styles.optionTitle}>Video Call</Text>
                  <Text style={styles.optionDesc}>Consult from home</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {dates.map((date) => {
                const isSelected = booking.appointment_date?.toDateString() === date.toDateString();
                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    style={[styles.dateCard, isSelected && styles.dateCardActive]}
                    onPress={() => setBooking({ ...booking, appointment_date: date, appointment_time: '' })}
                  >
                    <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>
                      {format(date, 'EEE')}
                    </Text>
                    <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>
                      {format(date, 'd')}
                    </Text>
                    <Text style={[styles.dateMonth, isSelected && styles.dateMonthActive]}>
                      {format(date, 'MMM')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {booking.appointment_date && (
              <>
                <Text style={[styles.stepTitle, { marginTop: SPACING.lg }]}>Select Time</Text>
                <View style={styles.timeGrid}>
                  {availableSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.time}
                      style={[
                        styles.timeSlot,
                        booking.appointment_time === slot.time && styles.timeSlotActive,
                        !slot.is_available && styles.timeSlotDisabled,
                      ]}
                      onPress={() => slot.is_available && setBooking({ ...booking, appointment_time: slot.time })}
                      disabled={!slot.is_available}
                    >
                      <Text style={[
                        styles.timeText,
                        booking.appointment_time === slot.time && styles.timeTextActive,
                        !slot.is_available && styles.timeTextDisabled,
                      ]}>
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Step 2: Patient Selection */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Who is this appointment for?</Text>
            
            <TouchableOpacity
              style={[styles.patientOption, booking.patient_type === 'myself' && styles.patientOptionActive]}
              onPress={() => setBooking({ ...booking, patient_type: 'myself', family_member_id: null })}
            >
              <Text style={styles.patientIcon}>👤</Text>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>Myself</Text>
                <Text style={styles.patientDesc}>{user?.full_name}</Text>
              </View>
            </TouchableOpacity>

            {familyMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[styles.patientOption, booking.family_member_id === member.id && styles.patientOptionActive]}
                onPress={() => setBooking({ ...booking, patient_type: 'family', family_member_id: member.id })}
              >
                <Text style={styles.patientIcon}>👨‍👩‍👧</Text>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{member.full_name}</Text>
                  <Text style={styles.patientDesc}>{member.relationship}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Reason for Visit</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Describe your symptoms or reason for consultation..."
              placeholderTextColor={COLORS.textMuted}
              value={booking.reason}
              onChangeText={(text) => setBooking({ ...booking, reason: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Booking Summary</Text>
            
            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Doctor</Text>
                <Text style={styles.summaryValue}>{doctor?.title} {doctor?.full_name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Specialty</Text>
                <Text style={styles.summaryValue}>{doctor?.specialties?.[0]}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Type</Text>
                <Badge text={booking.consultation_type === 'telehealth' ? '📹 Video' : '🏥 In-person'} variant="primary" />
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>
                  {booking.appointment_date ? format(booking.appointment_date, 'EEEE, MMMM d, yyyy') : '-'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time</Text>
                <Text style={styles.summaryValue}>{booking.appointment_time}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Patient</Text>
                <Text style={styles.summaryValue}>
                  {booking.patient_type === 'myself'
                    ? user?.full_name
                    : familyMembers.find(m => m.id === booking.family_member_id)?.full_name}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${doctor?.consultation_fee}</Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {step < 4 ? (
          <Button title="Continue" onPress={handleNext} style={styles.nextButton} />
        ) : (
          <View style={styles.paymentButtons}>
            <Button
              title={`Pay Now - $${doctor?.consultation_fee}`}
              onPress={() => handleSubmit(true)}
              loading={submitting}
              style={styles.payButton}
            />
            <Button
              title="Pay Later at Clinic"
              variant="outline"
              onPress={() => handleSubmit(false)}
              disabled={submitting}
              style={styles.payLaterButton}
            />
          </View>
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
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
  progress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressCheck: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  progressNumber: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  progressLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  progressLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  doctorCard: {
    marginBottom: SPACING.md,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  doctorInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  doctorFee: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stepContent: {
    paddingBottom: SPACING.lg,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  optionCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  optionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dateScroll: {
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  dateCard: {
    width: 60,
    paddingVertical: SPACING.md,
    marginRight: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dateCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateDay: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  dateDayActive: {
    color: COLORS.surface + 'CC',
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateNumActive: {
    color: COLORS.surface,
  },
  dateMonth: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dateMonthActive: {
    color: COLORS.surface + 'CC',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  timeSlot: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeSlotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeSlotDisabled: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  timeTextActive: {
    color: COLORS.surface,
  },
  timeTextDisabled: {
    color: COLORS.textMuted,
  },
  patientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  patientOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  patientIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  patientDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  reasonInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 120,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.md,
  },
  summaryTotal: {
    borderBottomWidth: 0,
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footer: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextButton: {
    width: '100%',
  },
  paymentButtons: {
    gap: SPACING.sm,
  },
  payButton: {
    width: '100%',
  },
  payLaterButton: {
    width: '100%',
  },
});
