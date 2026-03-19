import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Share2, Calendar, User, Tag } from 'lucide-react-native';
import { contentService } from '../../services/api';
import { COLORS, SPACING, RADIUS } from '../../utils/constants';
import { format, parseISO } from 'date-fns';

export default function BlogDetailScreen({ route, navigation }) {
  const { slug } = route.params;
  const { width } = useWindowDimensions();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await contentService.getBlogPost(slug);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching blog post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Article not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Article</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Share2 size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        {post.cover_image ? (
          <Image source={{ uri: post.cover_image }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, { backgroundColor: COLORS.primary + '10' }]} />
        )}

        <View style={styles.content}>
          <View style={styles.metaRow}>
            {post.category && (
              <View style={styles.categoryBadge}>
                <Tag size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.categoryText}>{post.category}</Text>
              </View>
            )}
            <View style={styles.dateRow}>
              <Calendar size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.dateText}>
                {post.created_at ? format(parseISO(post.created_at), 'MMM d, yyyy') : 'Recently'}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{post.title}</Text>

          {post.author && (
            <View style={styles.authorRow}>
              <View style={styles.authorAvatar}>
                <User size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.authorName}>By {post.author.full_name || 'Medical Team'}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Body Content */}
          <View style={styles.body}>
            <Text style={styles.bodyText}>
              {post.content ? post.content.replace(/<[^>]*>?/gm, '') : ''}
            </Text>
          </View>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  backButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  backButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 32,
    marginBottom: SPACING.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  body: {
    paddingBottom: SPACING.xxl,
  },
  bodyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
});
