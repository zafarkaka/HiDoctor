import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { API_URL, COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { Button, Card } from '../../components/UI';

const COUNTRY_CODES = [
  { label: 'UAE (+971)', value: '+971', icon: '🇦🇪' },
  { label: 'India (+91)', value: '+91', icon: '🇮🇳' },
  { label: 'USA (+1)', value: '+1', icon: '🇺🇸' },
  { label: 'UK (+44)', value: '+44', icon: '🇬🇧' },
  { label: 'Pakistan (+92)', value: '+92', icon: '🇵🇰' },
];

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: phone, 2: otp + new password, 3: success
  const [countryCode, setCountryCode] = useState('+971');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const handleSendOTP = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    const cleanedPhone = phone.replace(/^0+/, '').replace(/\D/g, '');
    const fullPhoneNumber = `${countryCode}${cleanedPhone}`;
    
    setLoading(true);
    try {
      // 1. Check if user exists on backend
      await axios.post(`${API_URL}/api/auth/forgot-password`, { phone: fullPhoneNumber });

      // 2. Send Firebase OTP
      const confirmResult = await auth().signInWithPhoneNumber(fullPhoneNumber);
      setConfirmation(confirmResult);
      setStep(2);
      Alert.alert('Success', 'Verification code sent to your phone');
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to initiate password reset. Ensure the phone number is correct and registered.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP with Firebase
      const userCredential = await confirmation.confirm(otp);
      const firebaseToken = await userCredential.user.getIdToken();

      const cleanedPhone = phone.replace(/^0+/, '').replace(/\D/g, '');
      const fullPhoneNumber = `${countryCode}${cleanedPhone}`;

      // 2. Reset password on backend
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        phone: fullPhoneNumber,
        firebase_token: firebaseToken,
        new_password: newPassword,
      });

      setStep(3);
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Error', 'Invalid verification code or session expired');
    } finally {
      setLoading(false);
    }
  };

  const renderCountryPicker = () => (
    <Modal
      visible={showCountryPicker}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCountryPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Country Code</Text>
          <FlatList
            data={COUNTRY_CODES}
            keyExtractor={item => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryOption}
                onPress={() => {
                  setCountryCode(item.value);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.countryOptionIcon}>{item.icon}</Text>
                <Text style={styles.countryOptionLabel}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCountryPicker(false)}>
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 1 ? 'Forgot Password' : step === 2 ? 'Reset Password' : 'Success!'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? 'Enter your registered mobile number to receive a verification code.' 
                : step === 2 
                ? 'Enter the 6-digit code sent to your phone and choose a new password.'
                : 'Your password has been reset successfully.'}
            </Text>
          </View>

          {step === 1 && (
            <Card elevated style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number *</Text>
                <View style={styles.phoneInputContainer}>
                  <TouchableOpacity 
                    style={styles.countryCodeSelector} 
                    onPress={() => setShowCountryPicker(true)}
                  >
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                    <Text style={styles.countryCodeArrow}>▼</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="e.g. 501234567"
                    placeholderTextColor={COLORS.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <Button
                title="Send Verification Code"
                onPress={handleSendOTP}
                loading={loading}
              />
            </Card>
          )}

          {step === 2 && (
            <Card elevated style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="123456"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
              />
              
              <TouchableOpacity 
                style={styles.resendButton}
                onPress={() => setStep(1)}
              >
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </Card>
          )}

          {step === 3 && (
            <Card elevated style={styles.card}>
              <View style={styles.successIcon}>
                <Text style={styles.successEmoji}>✅</Text>
              </View>
              <Text style={styles.successTitle}>Password Reset Complete</Text>
              <Text style={styles.successDesc}>You can now login with your new password.</Text>
              <Button
                title="Back to Login"
                onPress={() => navigation.navigate('Login')}
                style={styles.successButton}
              />
            </Card>
          )}

          <View style={styles.footer}>
            <Text style={styles.creditText}>Made By Mohammed Izyaan - LimraTech</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {renderCountryPicker()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  backButton: {
    marginBottom: SPACING.xl,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginRight: SPACING.sm,
  },
  countryCodeText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  countryCodeArrow: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  resendButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  resendText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  successButton: {
    marginTop: SPACING.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: SPACING.xl,
  },
  creditText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  countryOptionIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  countryOptionLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  modalCloseButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: RADIUS.md,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
});
