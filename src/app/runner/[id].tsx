import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../constants/theme';

export default function RunnerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, typography, spacing, radius } = useTheme();

  const styles = getStyles(colors, typography, spacing, radius);

  // Mock data for the runner
  const runner = {
    name: "Chinedu O.",
    rating: "4.9",
    trips: "142",
    joined: "2022",
    image: `https://i.pravatar.cc/150?u=${id}`,
    rate: "₦2,500/hr",
    bio: "I've been sourcing items at Balogun and Yaba markets for 5+ years. Fast, reliable, and I know where to get the best prices.",
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Runner Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
        {/* Profile Block */}
        <View style={styles.profileBlock}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: runner.image }} style={styles.avatar} />
          </View>
          <Text style={styles.runnerName}>{runner.name}</Text>
          <View style={styles.badgeContainer}>
            <VerifiedBadge />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { marginRight: spacing.sm }]}>
              <Text style={styles.statValue}>{runner.trips}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </Card>
            <Card style={[styles.statCard, { marginHorizontal: spacing.sm }]}>
              <Text style={styles.statValue}>{runner.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </Card>
            <Card style={[styles.statCard, { marginLeft: spacing.sm }]}>
              <Text style={styles.statValue}>{runner.joined}</Text>
              <Text style={styles.statLabel}>Joined</Text>
            </Card>
          </View>
        </View>

        {/* Verification Banner */}
        <View style={styles.verificationBanner}>
          <Card variant="surface" style={styles.verificationCard}>
            <ShieldCheck size={20} color={colors.accent} />
            <Text style={styles.verificationText}>
               Government ID Verified (NIN)
            </Text>
          </Card>
        </View>

        {/* About */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            {runner.bio}
          </Text>
        </View>

        {/* Reviews Placeholder */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          <Card style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>Fola A.</Text>
              <Text style={styles.reviewTime}>2 days ago</Text>
            </View>
            <Text style={styles.reviewText}>
              "Amazing runner! Got everything I needed from Balogun market in record time."
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Sticky Hire Button */}
      <View style={styles.hireButtonContainer}>
         <Button title={`Hire ${runner.name.split(' ')[0]} - ${runner.rate}`} />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, typography: any, spacing: any, radius: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: typography.heading,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  flex1: {
    flex: 1,
  },
  profileBlock: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  runnerName: {
    fontFamily: typography.heading,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  badgeContainer: {
    marginTop: spacing.sm,
  },
  statsGrid: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    fontFamily: typography.heading,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.muted,
  },
  verificationBanner: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  verificationText: {
    fontFamily: typography.bodyMedium,
    color: colors.text,
    fontSize: 14,
    marginLeft: spacing.md,
  },
  aboutSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.heading,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  aboutText: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },
  reviewsSection: {
    paddingHorizontal: spacing.md,
    marginBottom: 128,
  },
  reviewCard: {
    marginBottom: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reviewerName: {
    fontFamily: typography.heading,
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  reviewTime: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
  },
  reviewText: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.text,
  },
  hireButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

