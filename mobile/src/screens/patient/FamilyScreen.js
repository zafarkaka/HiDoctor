import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { familyService } from '../../services/api';
import { Card, Badge, Button } from '../../components/UI';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';

export default function FamilyScreen({ navigation }) {
  const [members, setMembers] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    relationship: '',
    allergies: '',
    chronic_conditions: '',
  });

  const fetchMembers = async () => {
    try {
      const response = await familyService.list();
      setMembers(response.data.members);
      setMemberCount(response.data.count);
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  }, []);

  const handleAddMember = async () => {
    if (!formData.full_name || !formData.date_of_birth || !formData.gender || !formData.relationship) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        ...formData,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
        chronic_conditions: formData.chronic_conditions ? formData.chronic_conditions.split(',').map(s => s.trim()) : [],
      };

      await familyService.add(data);
      setModalVisible(false);
      setFormData({
        full_name: '',
        date_of_birth: '',
        gender: '',
        relationship: '',
        allergies: '',
        chronic_conditions: '',
      });
      fetchMembers();
      Alert.alert('Success', 'Family member added successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add family member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = (memberId, memberName) => {
    Alert.alert(
      'Remove Family Member',
      `Are you sure you want to remove ${memberName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await familyService.remove(memberId);
              fetchMembers();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove family member');
            }
          },
        },
      ]
    );
  };

  const SelectButton = ({ label, value, options, onChange }) => (
    <View style={styles.selectContainer}>
      <Text style={styles.inputLabel}>{label} *</Text>
      <View style={styles.selectOptions}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.selectOption, value === option.value && styles.selectOptionActive]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.selectOptionText, value === option.value && styles.selectOptionTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMember = ({ item }) => (
    <Card elevated style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberInitial}>{item.full_name?.charAt(0)}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.full_name}</Text>
          <Text style={styles.memberRelation}>{item.relationship}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteMember(item.id, item.full_name)}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.memberDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date of Birth</Text>
          <Text style={styles.detailValue}>{item.date_of_birth}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Gender</Text>
          <Text style={styles.detailValue}>{item.gender}</Text>
        </View>
      </View>

      {(item.allergies?.length > 0 || item.chronic_conditions?.length > 0) && (
        <View style={styles.memberTags}>
          {item.allergies?.map((allergy, i) => (
            <Badge key={`a-${i}`} text={allergy} variant="error" size="sm" />
          ))}
          {item.chronic_conditions?.map((condition, i) => (
            <Badge key={`c-${i}`} text={condition} variant="warning" size="sm" />
          ))}
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Family Members</Text>
          <Text style={styles.subtitle}>{memberCount} / 4 members added</Text>
        </View>
        {memberCount < 4 && (
          <Button
            title="+ Add"
            size="sm"
            onPress={() => setModalVisible(true)}
          />
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(memberCount / 4) * 100}%` }]} />
        </View>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👨‍👩‍👧</Text>
            <Text style={styles.emptyTitle}>No family members</Text>
            <Text style={styles.emptyText}>
              Add family members to book appointments on their behalf
            </Text>
            <Button
              title="Add Family Member"
              onPress={() => setModalVisible(true)}
              style={styles.emptyButton}
            />
          </View>
        }
      />

      {/* Add Member Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Family Member</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                placeholder="Enter full name"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth *</Text>
              <TextInput
                style={styles.input}
                value={formData.date_of_birth}
                onChangeText={(text) => setFormData({ ...formData, date_of_birth: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <SelectButton
              label="Gender"
              value={formData.gender}
              options={[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
              ]}
              onChange={(value) => setFormData({ ...formData, gender: value })}
            />

            <SelectButton
              label="Relationship"
              value={formData.relationship}
              options={[
                { label: 'Spouse', value: 'spouse' },
                { label: 'Child', value: 'child' },
                { label: 'Parent', value: 'parent' },
                { label: 'Sibling', value: 'sibling' },
              ]}
              onChange={(value) => setFormData({ ...formData, relationship: value })}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Allergies (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={formData.allergies}
                onChangeText={(text) => setFormData({ ...formData, allergies: text })}
                placeholder="e.g., Penicillin, Peanuts"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chronic Conditions (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={formData.chronic_conditions}
                onChangeText={(text) => setFormData({ ...formData, chronic_conditions: text })}
                placeholder="e.g., Diabetes, Asthma"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <Button
              title="Add Family Member"
              onPress={handleAddMember}
              loading={submitting}
              style={styles.submitButton}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  progressContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  memberCard: {
    marginBottom: SPACING.md,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  memberRelation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  deleteIcon: {
    fontSize: 18,
  },
  memberDetails: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  memberTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
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
    marginBottom: SPACING.md,
  },
  emptyButton: {
    minWidth: 180,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCancel: {
    fontSize: 16,
    color: COLORS.primary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectContainer: {
    marginBottom: SPACING.md,
  },
  selectOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  selectOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  selectOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  selectOptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  selectOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xxl,
  },
});
