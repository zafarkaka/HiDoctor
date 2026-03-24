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
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card } from '../../components/UI';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { User, Stethoscope, Camera } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import * as ImagePicker from 'expo-image-picker';

const COUNTRY_CODES = [
  { label: 'UAE (+971)', value: '+971', icon: '🇦🇪' },
  { label: 'India (+91)', value: '+91', icon: '🇮🇳' },
  { label: 'USA (+1)', value: '+1', icon: '🇺🇸' },
  { label: 'UK (+44)', value: '+44', icon: '🇬🇧' },
  { label: 'Pakistan (+92)', value: '+92', icon: '🇵🇰' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [role, setRole] = useState('patient');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  React.useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const handleSendOTP = async () => {
    if (!fullName || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (role === 'doctor' && !profilePicture) {
      Alert.alert('Error', 'Please upload a profile picture for your doctor profile.');
      return;
    }

    // Strict E.164 formatting: no leading zero, only digits
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    const fullPhoneNumber = `${countryCode}${cleanedPhone}`;

    setLoading(true);
    try {
      console.log('--- OTP SEND START ---');
      console.log('Phone:', fullPhoneNumber);
      const confirmation = await auth().signInWithPhoneNumber(fullPhoneNumber);
      console.log('Confirmation object received:', !!confirmation);
      setConfirmData(confirmation);
      setResendTimer(30);
      console.log('--- OTP SEND SUCCESS ---');
    } catch (error) {
      console.error('--- OTP SEND ERROR ---');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Full Error:', JSON.stringify(error, null, 2));
      
      if (error.code === 'auth/missing-client-identifier') {
        Alert.alert(
          'Verification Error', 
          'The app could not be verified. Possible reasons:\n1. Play Integrity API not enabled in Google Cloud.\n2. SHA-1/SHA-256 missing in Firebase.\n3. Package name mismatch.'
        );
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert(
          'Rate Limit Exceeded',
          'Firebase has blocked requests from this device. Wait 30-60 mins or use a different network/VPN.'
        );
      } else {
        Alert.alert('Verification Failed', `[${error.code}] ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegister = async () => {
    Keyboard.dismiss();
    if (!otpCode) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (!confirmData) {
      Alert.alert('Error', 'Session expired. Please request a new OTP.');
      setConfirmData(null);
      return;
    }

    setLoading(true);
    try {
      console.log('--- OTP VERIFY START ---');
      console.log('Code:', otpCode);
      
      if (!confirmData || typeof confirmData.confirm !== 'function') {
        throw new Error('Invalid verification session. Please restart registration.');
      }

      const userCredential = await confirmData.confirm(otpCode);
      console.log('Firebase verification success for UID:', userCredential?.user?.uid);
      
      if (!userCredential?.user) {
        throw new Error('Verification succeeded but no user was returned.');
      }

      const firebaseToken = await userCredential.user.getIdToken();
      console.log('Firebase ID Token secured (length):', firebaseToken?.length);

      let cleanedPhone = phone.replace(/\D/g, '');
      if (cleanedPhone.startsWith('0')) {
        cleanedPhone = cleanedPhone.substring(1);
      }
      const fullPhoneNumber = `${countryCode}${cleanedPhone}`;

      console.log('Sending data to backend:', {
        name: fullName,
        phone: fullPhoneNumber,
        role: role
      });

      const result = await register({
        username: fullPhoneNumber, // Backend requires a username
        full_name: fullName,
        phone: fullPhoneNumber,
        password,
        role,
        firebase_token: firebaseToken,
        profile_picture: profilePicture || null,
      });

      console.log('--- REGISTRATION SUCCESS ---');

    } catch (error) {
      console.error('--- REGISTRATION/VERIFY ERROR ---');
      console.error('Error:', error);
      
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

      Alert.alert('Registration Failed', errorMessage);
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join HiDoctor today</Text>
          </View>

          {/* Role Selection */}
          {!confirmData && (
            <Card elevated style={styles.roleCard}>
              <Text style={styles.sectionTitle}>I am a</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
                  onPress={() => setRole('patient')}
                >
                  <User size={32} color={role === 'patient' ? COLORS.primary : COLORS.textMuted} style={{ marginBottom: SPACING.sm }} />
                  <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>
                    Patient
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'doctor' && styles.roleButtonActive]}
                  onPress={() => setRole('doctor')}
                >
                  <Stethoscope size={32} color={role === 'doctor' ? COLORS.primary : COLORS.textMuted} style={{ marginBottom: SPACING.sm }} />
                  <Text style={[styles.roleText, role === 'doctor' && styles.roleTextActive]}>
                    Doctor
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Form */}
          <Card elevated style={styles.formCard}>
            {!confirmData ? (
              <>
                {role === 'doctor' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Profile Picture *</Text>
                    <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                      {profilePicture ? (
                        <Image source={{ uri: profilePicture }} style={styles.profileImagePreview} />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Camera size={20} color={COLORS.textMuted} style={{ marginRight: SPACING.sm }} />
                          <Text style={{ fontSize: 14, color: COLORS.textMuted }}>Tap to Upload Picture</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>

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

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={COLORS.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>

                <Button
                  title="Send OTP"
                  onPress={handleSendOTP}
                  loading={loading}
                  style={styles.registerButton}
                />
              </>
            ) : (
              // OTP Verification Step
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Enter OTP</Text>
                  <Text style={styles.otpSubtitle}>
                    Sent to {countryCode} {phone.replace(/^0+/, '')}
                  </Text>
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
                
                <Button
                  title="Verify & Register"
                  onPress={handleVerifyRegister}
                  loading={loading}
                  style={styles.registerButton}
                />
                
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md, gap: SPACING.lg }}>
                  <TouchableOpacity
                    onPress={handleSendOTP}
                    disabled={resendTimer > 0 || loading}
                  >
                    <Text style={{ color: resendTimer > 0 ? COLORS.textMuted : COLORS.primary, fontWeight: '600' }}>
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setConfirmData(null)}
                  >
                    <Text style={{ color: COLORS.textSecondary, fontWeight: '600' }}>
                      Edit Phone Number
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!confirmData && (
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginText}>
                  Already have an account?{' '}
                  <Text style={styles.loginTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            )}
          </Card>

          <Text style={styles.terms}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </Text>

          <View style={styles.creditContainer}>
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
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
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
  },
  roleCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  roleButton: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  roleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roleTextActive: {
    color: COLORS.primary,
  },
  formCard: {
    marginBottom: SPACING.md,
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
  imagePickerButton: {
    height: 120,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  imagePickerText: {
    color: COLORS.primary,
    fontWeight: '500',
    fontSize: 16,
  },
  profileImagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  otpSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
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
  registerButton: {
    marginTop: SPACING.sm,
  },
  loginLink: {
    marginTop: SPACING.lg,
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
  terms: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: SPACING.md,
  },
  creditContainer: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  creditText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
