import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ChevronLeft, ShieldCheck, Star, Award, Heart } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';

export default function RunnerProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const styles = getStyles(colors);

  const [runner, setRunner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const fetchRunner = async () => {
      try {
        const response = await fetch(API.RUNNER.GET(id as string), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setRunner(data);
        setIsBookmarked(data.is_bookmarked || false);
      } catch (error) {
        console.error('Failed to fetch runner:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRunner();
  }, [id]);

  const toggleBookmark = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      const response = await fetch(`${API.API_URL}/runners/${id}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (error) {
      console.error("Toggle Bookmark Error:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return colors.muted;
    }
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!runner) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Runner not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{runner.is_runner ? 'Runner Profile' : 'Nomad Profile'}</Text>
        <TouchableOpacity 
          style={[styles.backBtn, isBookmarked && { backgroundColor: '#FF6B6B' }]} 
          onPress={toggleBookmark}
          disabled={isToggling}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Heart size={20} color={isBookmarked ? 'white' : colors.text} fill={isBookmarked ? 'white' : 'transparent'} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
        {/* Hero profile block */}
        <View style={styles.profileBlock}>
          <View style={styles.avatarBox}>
            <Image 
              source={runner.avatar_url 
                ? { uri: `${API.API_URL}${runner.avatar_url}`, headers: { Authorization: `Bearer ${token}` } }
                : { uri: `https://i.pravatar.cc/150?u=${id}` }
              } 
              style={styles.avatar} 
            />
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.runnerName}>{runner.full_name}</Text>
            {runner.runner_profile?.runner_tier && (
              <View style={[styles.tierBadge, { backgroundColor: getTierColor(runner.runner_profile.runner_tier) }]}>
                <Award size={12} color="black" />
                <Text style={styles.tierText}>{runner.runner_profile.runner_tier.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star 
                key={i} 
                size={16} 
                color={i <= Math.round(runner.runner_profile?.stats_rating || 5) ? colors.accent : colors.muted} 
                fill={i <= Math.round(runner.runner_profile?.stats_rating || 5) ? colors.accent : 'transparent'} 
              />
            ))}
            <Text style={styles.ratingText}>{runner.runner_profile?.stats_rating || '5.0'}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          {[
            { value: (runner.runner_profile?.stats_trips || 0).toString(), label: 'Trips' },
            { value: (runner.runner_profile?.stats_rating || 5.0).toString(), label: 'Rating' },
            { value: (runner.runner_profile?.active_wakas || 0).toString(), label: 'Active' },
            { value: new Date(runner.created_at).getFullYear().toString(), label: 'Since' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Verified badge */}
        <View style={styles.section}>
          <View style={styles.verifiedBadge}>
            <ShieldCheck size={20} color={colors.secondary} strokeWidth={2.5} />
            <Text style={styles.verifiedText}>Government ID Verified (NIN)</Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{runner.runner_profile?.bio || 'No bio provided.'}</Text>
        </View>

        {/* Reviews */}
        <View style={[styles.section, { marginBottom: 120 }]}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          {runner.runner_profile?.reviews && runner.runner_profile.reviews.length > 0 ? (
            runner.runner_profile.reviews.map((review: any) => (
              <Card key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.reviewer_name || 'Verified User'}</Text>
                  <Text style={styles.reviewTime}>{new Date(review.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.reviewText}>
                  "{review.comment}"
                </Text>
                <Text style={styles.reviewRating}>{review.rating}★</Text>
              </Card>
            ))
          ) : (
            <Text style={styles.aboutText}>No reviews yet.</Text>
          )}
        </View>
      </ScrollView>

      {/* Sticky Hire Button - Only for Runners */}
      {runner.is_runner && (
        <View style={styles.footer}>
          <Button
            title={`Hire ${runner.full_name?.split(' ')[0] || 'Runner'} – ₦${(runner.runner_profile?.hourly_rate || 0).toLocaleString()}/hr`}
            onPress={() => router.push('/new-errand')}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
  },
  flex1: { flex: 1 },
  profileBlock: {
    alignItems: 'center',
    paddingVertical: DT.spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  avatarBox: {
    width: 100,
    height: 100,
    borderWidth: 3,
    borderColor: colors.text,
    overflow: 'hidden',
    marginBottom: DT.spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  avatar: { width: '100%', height: '100%' },
  runnerName: {
    fontFamily: DT.typography.heading,
    fontSize: 24,
    color: colors.text,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: DT.spacing.sm,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: 'black',
  },
  tierText: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 10,
    color: 'black',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 15,
    color: colors.text,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
    backgroundColor: colors.background,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: DT.spacing.md,
    borderRightWidth: 2,
    borderRightColor: colors.text,
  },
  statValue: {
    fontFamily: DT.typography.heading,
    fontSize: 22,
    color: colors.text,
  },
  statLabel: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: DT.spacing.lg,
    marginTop: DT.spacing.lg,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.secondary,
    padding: DT.spacing.md,
    gap: DT.spacing.sm,
  },
  verifiedText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 14,
    color: colors.text,
  },
  sectionTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
    marginBottom: DT.spacing.md,
  },
  aboutText: {
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },
  reviewCard: {
    marginBottom: DT.spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DT.spacing.sm,
  },
  reviewerName: {
    fontFamily: DT.typography.heading,
    fontSize: 15,
    color: colors.text,
  },
  reviewTime: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: colors.muted,
  },
  reviewText: {
    fontFamily: DT.typography.body,
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 4,
  },
  reviewRating: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.secondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DT.spacing.lg,
    borderTopWidth: 2,
    borderTopColor: colors.text,
    backgroundColor: colors.background,
  },
});
