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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card } from '../../components/UI';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';

const COUNTRY_CODES = [
  { label: 'UAE (+971)', value: '+971', icon: '🇦🇪' },
  { label: 'India (+91)', value: '+91', icon: '🇮🇳' },
  { label: 'USA (+1)', value: '+1', icon: '🇺🇸' },
  { label: 'UK (+44)', value: '+44', icon: '🇬🇧' },
  { label: 'Pakistan (+92)', value: '+92', icon: '🇵🇰' },
];

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter your mobile number and password');
      return;
    }

    // Lenient phone formatting: remove leading zeros, keep only digits
    const cleanedPhone = phone.replace(/^0+/, '').replace(/\D/g, '');
    const fullPhoneNumber = `${countryCode}${cleanedPhone}`;

    setLoading(true);
    try {
      const user = await login(fullPhoneNumber, password);
      // Navigation handled by RootNavigator based on auth state
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Login Failed',
        error.response?.data?.detail || 'Invalid phone number or password'
      );
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Form */}
          <Card elevated style={styles.formCard}>
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
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <TouchableOpacity
              style={{ alignItems: 'center', marginTop: SPACING.md }}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </Card>



          {/* Developer Credit */}
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
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
  loginButton: {
    marginTop: SPACING.sm,
  },
  registerLink: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  registerTextBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  demoCard: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary + '30',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  demoButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
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
