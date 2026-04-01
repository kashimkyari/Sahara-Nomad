import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { Search, Package, ShoppingBag, Utensils, Plus, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius } = useTheme();

  const styles = getStyles(colors, typography, spacing, radius);

  const quickActions = [
    { id: 'source', label: 'Source Item', icon: ShoppingBag, color: colors.primary },
    { id: 'deliver', label: 'Deliver Package', icon: Package, color: colors.primary },
    { id: 'food', label: 'Food Run', icon: Utensils, color: colors.primary },
    { id: 'custom', label: 'Custom Errand', icon: Plus, color: colors.primary },
  ];

  const recentRunners = [
    { id: '1', name: 'Chinedu O.', rating: '4.9', image: 'https://i.pravatar.cc/150?u=chinedu' },
    { id: '2', name: 'Amina B.', rating: '4.8', image: 'https://i.pravatar.cc/150?u=amina' },
    { id: '3', name: 'Tunde S.', rating: '5.0', image: 'https://i.pravatar.cc/150?u=tunde' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Morning,</Text>
            <Text style={styles.nameText}>Tobi</Text>
          </View>
          <TouchableOpacity style={styles.avatarContainer}>
             <Image source={{ uri: 'https://i.pravatar.cc/150?u=tobi' }} style={styles.avatar} />
          </TouchableOpacity>
        </View>

        {/* Active Errand Card */}
        <TouchableOpacity onPress={() => {}} style={styles.sectionMargin}>
          <Card variant="primary" style={styles.activeErrandCard}>
            <View style={styles.activeErrandHeader}>
              <View>
                <Text style={styles.activeErrandLabel}>
                  Active Errand
                </Text>
                <Text style={styles.activeErrandTitle}>
                  Sourcing at Yaba Market
                </Text>
              </View>
              <ArrowRight size={24} color="white" />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <View style={styles.sectionMargin}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.gridContainer}>
            {quickActions.map((action) => (
              <TouchableOpacity 
                key={action.id}
                onPress={() => router.push('/new-errand')}
                style={styles.gridItemContainer}
              >
                <Card variant="surface" style={styles.gridItemCard}>
                  <action.icon size={28} color={action.color} strokeWidth={1.5} />
                  <Text style={styles.gridItemLabel}>
                    {action.label}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Runners */}
        <View style={styles.sectionMargin}>
          <Text style={styles.sectionTitle}>Recent Runners</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalScrollContent}>
            {recentRunners.map((runner) => (
              <TouchableOpacity 
                key={runner.id}
                onPress={() => router.push(`/runner/${runner.id}`)}
                style={styles.runnerCardWrapper}
              >
                <Card style={styles.runnerCard}>
                  <View style={styles.runnerAvatarContainer}>
                    <Image source={{ uri: runner.image }} style={styles.avatar} />
                  </View>
                  <Text style={styles.runnerName}>{runner.name}</Text>
                  <View style={styles.runnerBadge}>
                    <VerifiedBadge showLabel={false} />
                  </View>
                  <Text style={styles.runnerRating}>★ {runner.rating}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, typography: any, spacing: any, radius: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  greetingText: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.muted,
  },
  nameText: {
    fontFamily: typography.heading,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  sectionMargin: {
    marginBottom: spacing.lg,
  },
  activeErrandCard: {
    padding: spacing.lg,
  },
  activeErrandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeErrandLabel: {
    fontFamily: typography.bodyMedium,
    color: 'white', // Primary card background is dark, so text should be white
    fontSize: 13,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeErrandTitle: {
    fontFamily: typography.heading,
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: typography.heading,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemContainer: {
    width: '48%',
    marginBottom: spacing.md,
  },
  gridItemCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  gridItemLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 13,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  horizontalScroll: {
    marginHorizontal: -spacing.md,
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.md,
  },
  runnerCardWrapper: {
    marginRight: spacing.md,
    marginBottom: spacing.md,
  },
  runnerCard: {
    width: 160,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  runnerAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  runnerName: {
    fontFamily: typography.heading,
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  runnerBadge: {
    marginTop: 4,
  },
  runnerRating: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
});


