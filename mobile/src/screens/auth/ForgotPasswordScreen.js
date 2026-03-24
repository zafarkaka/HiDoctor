import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '../../components/UI';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import auth from '@react-native-firebase/auth';
import { authService } from '../../services/api';

const COUNTRY_CODES = [
  { label: 'UAE (+971)', value: '+971', icon: '🇦🇪' },
  { label: 'India (+91)', value: '+91', icon: '🇮🇳' },
  { label: 'USA (+1)', value: '+1', icon: '🇺🇸' },
  { label: 'UK (+44)', value: '+44', icon: '🇬🇧' },
  { label: 'Pakistan (+92)', value: '+92', icon: '🇵🇰' },
];

export default function ForgotPasswordScreen({ navigation }) {
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [otpCode, setOtpCode] = useState('');

  const handleSendOTP = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    const fullPhoneNumber = `${countryCode}${cleanedPhone}`;

    setLoading(true);
    try {
      // First check if phone exists in our DB
      await authService.forgotPassword(fullPhoneNumber);
      
      console.log('--- OTP SEND START ---');
      const confirmation = await auth().signInWithPhoneNumber(fullPhoneNumber);
      setConfirmData(confirmation);
      Alert.alert('Success', 'OTP sent to your phone!');
    } catch (error) {
      console.error('--- OTP SEND ERROR ---', error);
      if (error.response?.data?.detail) {
          Alert.alert('Error', error.response.data.detail);
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Rate Limit Exceeded', 'Firebase has blocked requests. Try again later.');
      } else {
        Alert.alert('Verification Failed', `[${error.code || 'Network Error'}] ${error.message || 'Check your connection'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    Keyboard.dismiss();
    if (!otpCode || !newPassword || !confirmPassword) {
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

    if (!confirmData) {
      Alert.alert('Error', 'Session expired. Please request a new OTP.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await confirmData.confirm(otpCode);
      
      if (!userCredential?.user) {
        throw new Error('Verification succeeded but no user was returned.');
      }

      const firebaseToken = await userCredential.user.getIdToken();

      let cleanedPhone = phone.replace(/\D/g, '');
      if (cleanedPhone.startsWith('0')) {
        cleanedPhone = cleanedPhone.substring(1);
      }
      const fullPhoneNumber = `${countryCode}${cleanedPhone}`;

      await authService.resetPassword({
        phone: fullPhoneNumber,
        firebase_token: firebaseToken,
        new_password: newPassword,
      });

      Alert.alert('Success', 'Password reset successfully!');
      navigation.navigate('Login');
    } catch (error) {
      console.error('--- RESET ERROR ---', error);
      let errorMessage = 'Invalid OTP or network error';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'The OTP code is incorrect.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'The OTP code has expired.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Reset Failed', errorMessage);
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../assets/icon.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {!confirmData ? 'Enter your mobile number' : 'Verify OTP & set new password'}
            </Text>
          </View>

          {/* Form */}
          <Card elevated style={styles.formCard}>
            {!confirmData ? (
              <>
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
                  style={styles.actionButton}
                />
              </>
            ) : (
              // OTP Verification Step
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Enter 6-Digit OTP *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123456"
                    placeholderTextColor={COLORS.textMuted}
                    value={otpCode}
                    onChangeText={(text) => {
                      setOtpCode(text);
                      if (text.length === 6) {
                        Keyboard.dismiss();
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={COLORS.textMuted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm New Password *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter password"
                    placeholderTextColor={COLORS.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
                
                <Button
                  title="Verify & Reset Password"
                  onPress={handleVerifyAndReset}
                  loading={loading}
                  style={styles.actionButton}
                />
                
                <TouchableOpacity
                  style={{ marginTop: SPACING.md, alignItems: 'center' }}
                  onPress={() => setConfirmData(null)}
                >
                  <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
                    Resend OTP / Edit Phone Number
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginText}>
                Remember your password?{' '}
                <Text style={styles.loginTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Card>

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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: SPACING.lg,
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
    paddingVertical: 14,
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
  actionButton: {
    marginTop: SPACING.sm,
  },
  loginLink: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginTextBold: {
    color: COLORS.primary,
    fontWeight: '600',
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
