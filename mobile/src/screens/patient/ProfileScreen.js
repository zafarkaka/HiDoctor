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
import { useAuth } from '../../contexts/AuthContext';
import { patientService } from '../../services/api';
import { patientService } from '../../services/api';
import { Card, Button, Divider } from '../../components/UI';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { ChevronRight, Bell, Shield, Download, Trash2, LogOut } from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    date_of_birth: '',
    allergies: '',
    chronic_conditions: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await patientService.getProfile();
      setProfile(response.data);
      setFormData({
        phone: response.data.phone || user?.phone || '',
        address: response.data.address || '',
        date_of_birth: response.data.date_of_birth || '',
        allergies: response.data.allergies?.join(', ') || '',
        chronic_conditions: response.data.chronic_conditions?.join(', ') || '',
        emergency_contact_name: response.data.emergency_contact_name || '',
        emergency_contact_phone: response.data.emergency_contact_phone || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = {
        ...formData,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
        chronic_conditions: formData.chronic_conditions ? formData.chronic_conditions.split(',').map(s => s.trim()) : [],
      };
      await patientService.updateProfile(data);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
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

  const MenuItem = ({ icon, label, onPress, danger = false }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={{ width: 24, alignItems: 'center', marginRight: SPACING.sm }}>
        {icon}
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <ChevronRight size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.full_name?.charAt(0)}</Text>
          </View>
          <Text style={styles.userName}>{user?.full_name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Profile Form */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter phone number"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Enter your address"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              value={formData.date_of_birth}
              onChangeText={(text) => setFormData({ ...formData, date_of_birth: text })}
              placeholder="DD-MM-YYYY"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <Divider />

          <Text style={styles.sectionTitle}>Medical Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Allergies</Text>
            <TextInput
              style={styles.input}
              value={formData.allergies}
              onChangeText={(text) => setFormData({ ...formData, allergies: text })}
              placeholder="e.g., Penicillin, Peanuts"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Chronic Conditions</Text>
            <TextInput
              style={styles.input}
              value={formData.chronic_conditions}
              onChangeText={(text) => setFormData({ ...formData, chronic_conditions: text })}
              placeholder="e.g., Diabetes, Hypertension"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <Divider />

          <Text style={styles.sectionTitle}>Emergency Contact</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Name</Text>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_name}
              onChangeText={(text) => setFormData({ ...formData, emergency_contact_name: text })}
              placeholder="Enter contact name"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.emergency_contact_phone}
              onChangeText={(text) => setFormData({ ...formData, emergency_contact_phone: text })}
              placeholder="Enter contact phone"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
        </Card>

        {/* Settings Menu */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <MenuItem icon={<Bell size={20} color={COLORS.text} />} label="Notifications" onPress={() => {}} />
          <MenuItem icon={<Shield size={20} color={COLORS.text} />} label="Privacy" onPress={() => {}} />
          <MenuItem icon={<Download size={20} color={COLORS.text} />} label="Download My Data" onPress={() => Alert.alert('Export Data', 'Your data export has been requested.')} />
          <MenuItem icon={<Trash2 size={20} color={COLORS.error} />} label="Delete Account" onPress={() => Alert.alert('Delete Account', 'Contact support to delete your account.')} danger />
        </Card>

        {/* Logout */}
        <Card style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
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
  },
  section: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
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
  saveButton: {
    marginTop: SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  menuLabelDanger: {
    color: COLORS.error,
  },
  menuArrow: {
    fontSize: 20,
    color: COLORS.textMuted,
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
