import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { doctorService } from '../../services/api';
import { Card, Badge, Button } from '../../components/UI';
import { COLORS, SPACING, RADIUS, SHADOWS, SPECIALTIES } from '../../utils/constants';

export default function DoctorDiscoveryScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchDoctors = async (isRefresh = false) => {
    try {
      const params = {
        page: isRefresh ? 1 : page,
        limit: 10,
      };
      if (searchQuery) params.search = searchQuery;
      if (selectedSpecialty) params.specialty = selectedSpecialty;

      const response = await doctorService.list(params);
      const newDoctors = response.data.doctors;

      if (isRefresh) {
        setDoctors(newDoctors);
        setPage(1);
      } else {
        setDoctors(prev => page === 1 ? newDoctors : [...prev, ...newDoctors]);
      }
      setHasMore(response.data.page < response.data.pages);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchDoctors(true);
  }, [searchQuery, selectedSpecialty]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDoctors(true);
    setRefreshing(false);
  }, [searchQuery, selectedSpecialty]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchDoctors();
    }
  };

  const renderDoctor = ({ item }) => (
    <Card
      elevated
      style={styles.doctorCard}
      onPress={() => navigation.navigate('DoctorProfile', { doctorId: item.user_id })}
    >
      <View style={styles.doctorContent}>
        <View style={styles.doctorImage}>
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.doctorAvatar} />
          ) : (
            <LinearGradient
              colors={[COLORS.primary + '30', COLORS.primary + '10']}
              style={styles.doctorAvatarPlaceholder}
            >
              <Text style={styles.doctorInitial}>{item.full_name?.charAt(0)}</Text>
            </LinearGradient>
          )}
          {item.is_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{item.title} {item.full_name}</Text>
          <Text style={styles.doctorSpecialty}>{item.specialties?.[0] || 'General Medicine'}</Text>
          
          <View style={styles.doctorMeta}>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.reviewCount}>({item.review_count || 0})</Text>
            </View>
            <Text style={styles.experience}>{item.years_experience || 0}+ yrs</Text>
          </View>

          <View style={styles.doctorTags}>
            {item.consultation_types?.includes('telehealth') && (
              <Badge text="📹 Video" variant="info" size="sm" />
            )}
            {item.consultation_types?.includes('in_person') && (
              <Badge text="🏥 In-person" variant="default" size="sm" />
            )}
          </View>
        </View>

        <View style={styles.doctorPrice}>
          <Text style={styles.priceLabel}>Fee</Text>
          <Text style={styles.priceValue}>${item.consultation_fee || 0}</Text>
        </View>
      </View>
    </Card>
  );

  const SpecialtyChip = ({ specialty, selected, onPress }) => (
    <TouchableOpacity
      style={[styles.specialtyChip, selected && styles.specialtyChipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.specialtyChipText, selected && styles.specialtyChipTextSelected]}>
        {specialty}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find a Doctor</Text>
        <Text style={styles.subtitle}>Browse our network of specialists</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors, specialties..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Specialties Filter */}
      <View style={styles.specialtiesContainer}>
        <FlatList
          horizontal
          data={['All', ...SPECIALTIES.slice(0, 8)]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtiesList}
          renderItem={({ item }) => (
            <SpecialtyChip
              specialty={item}
              selected={item === 'All' ? !selectedSpecialty : selectedSpecialty === item}
              onPress={() => setSelectedSpecialty(item === 'All' ? null : item)}
            />
          )}
        />
      </View>

      {/* Results */}
      <FlatList
        data={doctors}
        keyExtractor={(item) => item.user_id}
        renderItem={renderDoctor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator style={styles.loader} color={COLORS.primary} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No doctors found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
            </View>
          ) : null
        }
      />

      {loading && page === 1 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
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
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.sm,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  clearIcon: {
    fontSize: 16,
    color: COLORS.textMuted,
    padding: SPACING.xs,
  },
  specialtiesContainer: {
    marginBottom: SPACING.md,
  },
  specialtiesList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  specialtyChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  specialtyChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  specialtyChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  specialtyChipTextSelected: {
    color: COLORS.surface,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  doctorCard: {
    marginBottom: SPACING.md,
  },
  doctorContent: {
    flexDirection: 'row',
  },
  doctorImage: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  doctorAvatar: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
  },
  doctorAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  verifiedIcon: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    fontSize: 14,
    marginRight: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  experience: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  doctorTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  doctorPrice: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  loader: {
    paddingVertical: SPACING.lg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});
