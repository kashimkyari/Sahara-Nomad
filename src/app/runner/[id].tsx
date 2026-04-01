import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ChevronLeft, ShieldCheck, Star } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';

export default function RunnerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const runner = {
    name: 'Chinedu O.',
    rating: '4.9',
    trips: '142',
    joined: '2022',
    image: `https://i.pravatar.cc/150?u=${id}`,
    rate: '₦2,500/hr',
    bio: "I've been sourcing items at Balogun and Yaba markets for 5+ years. Fast, reliable, and I know where to get the best prices.",
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={DT.colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Runner Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
        {/* Hero profile block */}
        <View style={styles.profileBlock}>
          <View style={styles.avatarBox}>
            <Image source={{ uri: runner.image }} style={styles.avatar} />
          </View>
          <Text style={styles.runnerName}>{runner.name}</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={16} color={DT.colors.accent} fill={DT.colors.accent} />
            ))}
            <Text style={styles.ratingText}>{runner.rating}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          {[
            { value: runner.trips, label: 'Trips' },
            { value: runner.rating, label: 'Rating' },
            { value: runner.joined, label: 'Since' },
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
            <ShieldCheck size={20} color={DT.colors.secondary} strokeWidth={2.5} />
            <Text style={styles.verifiedText}>Government ID Verified (NIN)</Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{runner.bio}</Text>
        </View>

        {/* Reviews */}
        <View style={[styles.section, { marginBottom: 120 }]}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          <Card style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>Fola A.</Text>
              <Text style={styles.reviewTime}>2 days ago</Text>
            </View>
            <Text style={styles.reviewText}>
              "Amazing runner! Got everything from Balogun market in record time."
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Sticky Hire Button */}
      <View style={styles.footer}>
        <Button
          title={`Hire ${runner.name.split(' ')[0]} – ${runner.rate}`}
          onPress={() => router.push('/new-errand')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DT.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: DT.colors.text,
    backgroundColor: DT.colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: DT.colors.text,
  },
  flex1: { flex: 1 },
  profileBlock: {
    alignItems: 'center',
    paddingVertical: DT.spacing.xl,
    backgroundColor: DT.colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: DT.colors.text,
  },
  avatarBox: {
    width: 100,
    height: 100,
    borderWidth: 3,
    borderColor: DT.colors.text,
    overflow: 'hidden',
    marginBottom: DT.spacing.md,
    shadowColor: DT.colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  avatar: { width: '100%', height: '100%' },
  runnerName: {
    fontFamily: DT.typography.heading,
    fontSize: 24,
    color: DT.colors.text,
    marginBottom: DT.spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 15,
    color: DT.colors.text,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: DT.colors.text,
    backgroundColor: DT.colors.background,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: DT.spacing.md,
    borderRightWidth: 2,
    borderRightColor: DT.colors.text,
  },
  statValue: {
    fontFamily: DT.typography.heading,
    fontSize: 22,
    color: DT.colors.text,
  },
  statLabel: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: DT.colors.muted,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: DT.spacing.lg,
    marginTop: DT.spacing.lg,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DT.colors.surface,
    borderWidth: 2,
    borderColor: DT.colors.secondary,
    padding: DT.spacing.md,
    gap: DT.spacing.sm,
  },
  verifiedText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 14,
    color: DT.colors.text,
  },
  sectionTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: DT.colors.text,
    marginBottom: DT.spacing.md,
  },
  aboutText: {
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: DT.colors.text,
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
    color: DT.colors.text,
  },
  reviewTime: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: DT.colors.muted,
  },
  reviewText: {
    fontFamily: DT.typography.body,
    fontSize: 14,
    color: DT.colors.text,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DT.spacing.lg,
    borderTopWidth: 2,
    borderTopColor: DT.colors.text,
    backgroundColor: DT.colors.background,
  },
});
