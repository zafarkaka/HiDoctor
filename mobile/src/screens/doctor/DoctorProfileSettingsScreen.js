import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { doctorService, configService } from '../../services/api';
import { doctorService, configService } from '../../services/api';
import { Card, Button, Badge, Divider } from '../../components/UI';
import { COLORS, SPACING, RADIUS, SPECIALTIES } from '../../utils/constants';
import { Check, Building2, Video, LogOut } from 'lucide-react-native';

export default function DoctorProfileSettingsScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [insurances, setInsurances] = useState([]);

  const [formData, setFormData] = useState({
    title: 'Dr.',
    license_number: '',
    specialties: [],
    years_experience: '',
    qualifications: '',
    languages: ['English'],
    clinic_name: '',
    clinic_address: '',
    consultation_types: ['in_person'],
    consultation_fee: '',
    accepted_insurances: [],
    bio: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, languagesRes, insurancesRes] = await Promise.all([
        doctorService.getProfile().catch(() => ({ data: null })),
        configService.getLanguages(),
        configService.getInsurances(),
      ]);

      setLanguages(languagesRes.data.languages || []);
      setInsurances(insurancesRes.data.insurances || []);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setFormData({
          title: profileRes.data.title || 'Dr.',
          license_number: profileRes.data.license_number || '',
          specialties: profileRes.data.specialties || [],
          years_experience: profileRes.data.years_experience?.toString() || '',
          qualifications: profileRes.data.qualifications?.join(', ') || '',
          languages: profileRes.data.languages || ['English'],
          clinic_name: profileRes.data.clinic_name || '',
          clinic_address: profileRes.data.clinic_address || '',
          consultation_types: profileRes.data.consultation_types || ['in_person'],
          consultation_fee: profileRes.data.consultation_fee?.toString() || '',
          accepted_insurances: profileRes.data.accepted_insurances || [],
          bio: profileRes.data.bio || '',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.license_number || formData.specialties.length === 0 || !formData.consultation_fee) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...formData,
        years_experience: parseInt(formData.years_experience) || 0,
        consultation_fee: parseFloat(formData.consultation_fee) || 0,
        qualifications: formData.qualifications ? formData.qualifications.split(',').map(s => s.trim()) : [],
      };

      await doctorService.updateProfile(data);
      Alert.alert('Success', 'Profile saved successfully');
      refreshUser();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const toggleSpecialty = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const toggleLanguage = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const toggleConsultationType = (type) => {
    setFormData(prev => ({
      ...prev,
      consultation_types: prev.consultation_types.includes(type)
        ? prev.consultation_types.filter(t => t !== type)
        : [...prev.consultation_types, type],
    }));
  };

  const toggleInsurance = (ins) => {
    setFormData(prev => ({
      ...prev,
      accepted_insurances: prev.accepted_insurances.includes(ins)
        ? prev.accepted_insurances.filter(i => i !== ins)
        : [...prev.accepted_insurances, ins],
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{user?.full_name?.charAt(0)}</Text>
          </LinearGradient>
          <Text style={styles.userName}>Dr. {user?.full_name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {profile?.is_verified ? (
            <Badge text="Verified" variant="success" />
          ) : (
            <Badge text="Pending Verification" variant="warning" />
          )}
        </View>

        {/* Basic Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>License Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.license_number}
              onChangeText={(text) => setFormData({ ...formData, license_number: text })}
              placeholder="Enter your medical license number"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Years of Experience *</Text>
            <TextInput
              style={styles.input}
              value={formData.years_experience}
              onChangeText={(text) => setFormData({ ...formData, years_experience: text })}
              placeholder="e.g., 10"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Qualifications</Text>
            <TextInput
              style={styles.input}
              value={formData.qualifications}
              onChangeText={(text) => setFormData({ ...formData, qualifications: text })}
              placeholder="e.g., MBBS, MD, Fellowship"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.inputHint}>Separate multiple qualifications with commas</Text>
          </View>
        </Card>

        {/* Specialties */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties *</Text>
          <Text style={styles.sectionSubtitle}>Select your areas of expertise</Text>
          <View style={styles.chipContainer}>
            {SPECIALTIES.map((specialty) => (
              <TouchableOpacity
                key={specialty}
                style={[
                  styles.chip,
                  formData.specialties.includes(specialty) && styles.chipActive
                ]}
                onPress={() => toggleSpecialty(specialty)}
              >
                <Text style={[
                  styles.chipText,
                  formData.specialties.includes(specialty) && styles.chipTextActive
                ]}>
                  {specialty}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Languages */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.chipContainer}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.chip,
                  formData.languages.includes(lang) && styles.chipActive
                ]}
                onPress={() => toggleLanguage(lang)}
              >
                <Text style={[
                  styles.chipText,
                  formData.languages.includes(lang) && styles.chipTextActive
                ]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Consultation */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Consultation Settings</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Consultation Types</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  formData.consultation_types.includes('in_person') && styles.toggleOptionActive
                ]}
                onPress={() => toggleConsultationType('in_person')}
              >
                <Building2 size={18} color={formData.consultation_types.includes('in_person') ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[
                  styles.toggleText,
                  formData.consultation_types.includes('in_person') && styles.toggleTextActive
                ]}>
                  In-Person
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  formData.consultation_types.includes('telehealth') && styles.toggleOptionActive
                ]}
                onPress={() => toggleConsultationType('telehealth')}
              >
                <Video size={18} color={formData.consultation_types.includes('telehealth') ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[
                  styles.toggleText,
                  formData.consultation_types.includes('telehealth') && styles.toggleTextActive
                ]}>
                  Video Call
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Consultation Fee (USD) *</Text>
            <TextInput
              style={styles.input}
              value={formData.consultation_fee}
              onChangeText={(text) => setFormData({ ...formData, consultation_fee: text })}
              placeholder="e.g., 100"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
          </View>
        </Card>

        {/* Clinic Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Clinic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Clinic Name</Text>
            <TextInput
              style={styles.input}
              value={formData.clinic_name}
              onChangeText={(text) => setFormData({ ...formData, clinic_name: text })}
              placeholder="Enter clinic name"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Clinic Address</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={formData.clinic_address}
              onChangeText={(text) => setFormData({ ...formData, clinic_address: text })}
              placeholder="Enter full address"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={2}
            />
          </View>
        </Card>

        {/* Bio */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>About You</Text>
          <TextInput
            style={[styles.input, styles.inputBio]}
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            placeholder="Write a brief introduction about yourself..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{formData.bio.length}/500</Text>
        </Card>

        {/* Accepted Insurances */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Accepted Insurances</Text>
          <View style={styles.chipContainer}>
            {insurances.map((ins) => (
              <TouchableOpacity
                key={ins}
                style={[
                  styles.chip,
                  formData.accepted_insurances.includes(ins) && styles.chipActive
                ]}
                onPress={() => toggleInsurance(ins)}
              >
                <Text style={[
                  styles.chipText,
                  formData.accepted_insurances.includes(ins) && styles.chipTextActive
                ]}>
                  {ins}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Save Button */}
        <View style={styles.buttonSection}>
          <Button
            title="Save Profile"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </View>

        {/* Logout */}
        <Card style={styles.section}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md }} onPress={handleLogout}>
            <LogOut size={20} color={COLORS.error} style={{ marginRight: SPACING.sm }} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.version}>Version 1.0.0</Text>
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
  headerSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.surface,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputBio: {
    minHeight: 100,
  },
  inputHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.surface,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  toggleOptionActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  toggleIcon: {
    fontSize: 18,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.primary,
  },
  buttonSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  saveButton: {
    width: '100%',
  },
  logoutButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    paddingVertical: SPACING.lg,
  },
});
