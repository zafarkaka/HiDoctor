import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { doctorService } from '../../services/api';
import { Card, Badge, Button, Divider } from '../../components/UI';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { ChevronLeft, Check, UsersRound, Building2, GraduationCap, MapPin, Star } from 'lucide-react-native';

export default function DoctorProfileScreen({ route, navigation }) {
  const { doctorId } = route.params;
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const scrollY = new Animated.Value(0);

  const fetchData = async () => {
    try {
      const [doctorRes, reviewsRes] = await Promise.all([
        doctorService.getById(doctorId),
        doctorService.getReviews(doctorId, { limit: 5 }),
      ]);
      setDoctor(doctorRes.data);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [doctorId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [doctorId]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= rating ? '★' : '☆'}
        </Text>
      );
    }
    return stars;
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

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Doctor not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={32} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Profile Card */}
        <Card elevated style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {doctor.profile_image ? (
              <Image source={{ uri: doctor.profile_image }} style={styles.profileImage} />
            ) : (
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.profileImagePlaceholder}
              >
                <Text style={styles.profileInitial}>{doctor.full_name?.charAt(0)}</Text>
              </LinearGradient>
            )}
            {doctor.is_verified && (
              <View style={styles.verifiedBadge}>
                <Check size={14} color={COLORS.surface} strokeWidth={3} />
              </View>
            )}
          </View>

          <Text style={styles.doctorName}>{doctor.title} {doctor.full_name}</Text>
          <Text style={styles.doctorSpecialty}>
            {doctor.specialties?.join(', ') || 'General Medicine'}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{doctor.years_experience || 0}+</Text>
              <Text style={styles.statLabel}>Years Exp.</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                ★ {doctor.rating?.toFixed(1) || '5.0'}
              </Text>
              <Text style={styles.statLabel}>{doctor.review_count || 0} Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>₹{doctor.consultation_fee}</Text>
              <Text style={styles.statLabel}>Fee</Text>
            </View>
          </View>

          <View style={styles.tagsRow}>
            {doctor.consultation_types?.includes('home_visit') && (
              <Badge text={<><UsersRound size={10} color={COLORS.primary} style={{ marginRight: 4 }} /> Home Visit</>} variant="info" />
            )}
            {doctor.consultation_types?.includes('in_person') && (
              <Badge text={<><Building2 size={10} color={COLORS.textSecondary} style={{ marginRight: 4 }} /> In-person</>} variant="default" />
            )}
          </View>

          <Button
            title="Book Appointment"
            onPress={() => navigation.navigate('Booking', { doctorId })}
            style={styles.bookButton}
          />
        </Card>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews ({doctor.review_count || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'about' ? (
            <>
              {/* Bio */}
              {doctor.bio && (
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.bioText}>{doctor.bio}</Text>
                </Card>
              )}

              {doctor.qualifications?.length > 0 && (
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Qualifications</Text>
                  {doctor.qualifications.map((qual, index) => (
                    <View key={index} style={styles.qualItem}>
                      <GraduationCap size={16} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
                      <Text style={styles.qualText}>{qual}</Text>
                    </View>
                  ))}
                </Card>
              )}

              {/* Languages */}
              <Card style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Languages</Text>
                <View style={styles.languageRow}>
                  {doctor.languages?.map((lang, index) => (
                    <Badge key={index} text={lang} variant="default" />
                  ))}
                </View>
              </Card>

              {/* Clinic Info */}
              {doctor.clinic_name && (
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Clinic</Text>
                  <Text style={styles.clinicName}>{doctor.clinic_name}</Text>
                  {doctor.clinic_address && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <MapPin size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={styles.clinicAddress}>{doctor.clinic_address}</Text>
                    </View>
                  )}
                </Card>
              )}

              {/* Accepted Insurances */}
              {doctor.accepted_insurances?.length > 0 && (
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Accepted Insurances</Text>
                  <View style={styles.insuranceRow}>
                    {doctor.accepted_insurances.map((ins, index) => (
                      <Badge key={index} text={ins} variant="primary" size="sm" />
                    ))}
                  </View>
                </Card>
              )}
            </>
          ) : (
            <>
              {/* Reviews */}
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerInitial}>
                          {review.patient_name?.charAt(0) || 'P'}
                        </Text>
                      </View>
                      <View style={styles.reviewerInfo}>
                        <Text style={styles.reviewerName}>{review.patient_name || 'Patient'}</Text>
                        <View style={styles.ratingRow}>
                          {renderStars(review.rating)}
                        </View>
                      </View>
                      <Text style={styles.reviewDate}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {review.comment && (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    )}
                  </Card>
                ))
              ) : (
                <View style={styles.emptyReviews}>
                  <Star size={48} color={COLORS.warning} fill={COLORS.warning} style={{ marginBottom: SPACING.md }} opacity={0.5} />
                  <Text style={styles.emptyText}>No reviews yet</Text>
                </View>
              )}
            </>
          )}
        </View>
      </Animated.ScrollView>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
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
  profileCard: {
    margin: SPACING.md,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  profileHeader: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.surface,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  verifiedIcon: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  doctorName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    width: '100%',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  bookButton: {
    width: '100%',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 4,
    ...SHADOWS.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.surface,
  },
  tabContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  sectionCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  qualItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  qualIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  qualText: {
    fontSize: 14,
    color: COLORS.text,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  clinicName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  clinicAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  insuranceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  reviewCard: {
    marginBottom: SPACING.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  star: {
    fontSize: 14,
    color: COLORS.warning,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
});
