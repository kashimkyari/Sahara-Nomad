import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { DesignTokens as theme } from '../../constants/design';

export default function RunnerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

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
          <ChevronLeft size={24} color={theme.colors.primary} />
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
            <Card style={[styles.statCard, { marginRight: theme.spacing.sm }]}>
              <Text style={styles.statValue}>{runner.trips}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </Card>
            <Card style={[styles.statCard, { marginHorizontal: theme.spacing.sm }]}>
              <Text style={styles.statValue}>{runner.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </Card>
            <Card style={[styles.statCard, { marginLeft: theme.spacing.sm }]}>
              <Text style={styles.statValue}>{runner.joined}</Text>
              <Text style={styles.statLabel}>Joined</Text>
            </Card>
          </View>
        </View>

        {/* Verification Banner */}
        <View style={styles.verificationBanner}>
          <Card variant="surface" style={styles.verificationCard}>
            <ShieldCheck size={20} color={theme.colors.accent} />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontFamily: theme.typography.heading,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  flex1: {
    flex: 1,
  },
  profileBlock: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  runnerName: {
    fontFamily: theme.typography.heading,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  badgeContainer: {
    marginTop: theme.spacing.sm,
  },
  statsGrid: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  statValue: {
    fontFamily: theme.typography.heading,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontFamily: theme.typography.body,
    fontSize: 12,
    color: theme.colors.muted,
  },
  verificationBanner: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: theme.colors.accent,
    backgroundColor: '#F0FFF4',
  },
  verificationText: {
    fontFamily: theme.typography.bodyMedium,
    color: theme.colors.text,
    fontSize: 14,
    marginLeft: theme.spacing.md,
  },
  aboutSection: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.typography.heading,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  aboutText: {
    fontFamily: theme.typography.body,
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 24,
  },
  reviewsSection: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: 128,
  },
  reviewCard: {
    marginBottom: theme.spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  reviewerName: {
    fontFamily: theme.typography.heading,
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  reviewTime: {
    fontFamily: theme.typography.body,
    fontSize: 13,
    color: theme.colors.muted,
  },
  reviewText: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.text,
  },
  hireButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
