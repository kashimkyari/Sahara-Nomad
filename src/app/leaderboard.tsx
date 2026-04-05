import { Stack, useRouter } from 'expo-router';
import {
  Award,
  ChevronLeft,
  MapPin,
  Star,
  TrendingUp,
  Trophy,
  Zap
} from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBrutalistRefresh } from '../components/ui/BrutalistRefreshControl';
import UserAvatar from '../components/ui/UserAvatar';
import API from '../constants/api';
import { DesignTokens as DT } from '../constants/design';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/use-theme';

interface LeaderboardRunner {
  id: string;
  name: string;
  avatar_url: string;
  rating: number;
  stats_trips: number;
  streak_count: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();
  const styles = getStyles(colors);

  const [loading, setLoading] = useState(true);
  const [runners, setRunners] = useState<LeaderboardRunner[]>([]);
  const [city, setCity] = useState(user?.city || 'Lagos');
  const visibleListRunners = runners.length >= 3 ? runners.slice(3) : runners;

  const fetchLeaderboard = async () => {
    if (!token) return;
    try {
      const res = await fetch(API.SEARCH.LEADERBOARD, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRunners(data.top_runners);
        setCity(data.city);
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const { refreshControl, refreshBanner, onScroll } = useBrutalistRefresh({
    onRefresh: fetchLeaderboard,
    refreshingLabel: 'UPDATING LEGENDS...',
    pullLabel: 'PULL FOR NEW RANKS',
  });

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const PodiumItem = ({ runner, rank }: { runner: LeaderboardRunner, rank: number }) => {
    const isFirst = rank === 1;
    const size = isFirst ? 110 : 90;
    const medalColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';
    
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.5, translateY: 50 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'spring', delay: rank * 100 }}
        style={[styles.podiumCard, isFirst && styles.podiumFirst]}
      >
        <UserAvatar 
          url={runner.avatar_url} 
          size={size} 
          borderWidth={3} 
          borderColor={colors.text} 
        />
        <View style={[styles.rankBadge, { backgroundColor: medalColor }]}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <Text style={styles.podiumName} numberOfLines={1}>{runner.name}</Text>
        <View style={styles.podiumStats}>
          <Star size={12} color={isFirst ? colors.surface : colors.accent} fill={isFirst ? colors.surface : colors.accent} />
          <Text style={[styles.podiumRating, isFirst && { color: colors.surface }]}>{runner.rating.toFixed(1)}</Text>
        </View>
        <Text style={[styles.podiumTrips, isFirst && { color: 'rgba(255,255,255,0.7)' }]}>{runner.stats_trips} trips</Text>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.headerIcon}>
          <Trophy size={22} color={colors.text} strokeWidth={2.5} />
        </View>
      </View>

      <View style={styles.contentArea}>
        {refreshBanner ? (
          <View style={styles.refreshBannerOffset}>
            {refreshBanner}
          </View>
        ) : null}
        <ScrollView 
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        refreshControl={refreshControl}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>RANKING RUNNERS...</Text>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroLabelWrap}>
                  <Text style={styles.heroLabel}>CITY CHAMPIONS</Text>
                  <View style={styles.cityBadge}>
                    <MapPin size={12} color={colors.text} />
                    <Text style={styles.cityText}>{city?.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.heroIconBox}>
                  <Award size={20} color={colors.text} strokeWidth={2.5} />
                </View>
              </View>
              <Text style={styles.heroTitle}>Top runners ranked by consistency, trips, and trust.</Text>
              <Text style={styles.heroSubtext}>Refresh to see who is dominating your zone right now.</Text>
            </View>

            {runners.length >= 3 && (
              <View style={styles.podiumSection}>
                <Text style={styles.sectionLabel}>PODIUM</Text>
                <View style={styles.podiumContainer}>
                <PodiumItem runner={runners[1]} rank={2} />
                <PodiumItem runner={runners[0]} rank={1} />
                <PodiumItem runner={runners[2]} rank={3} />
                </View>
              </View>
            )}

            <View style={styles.listContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>RISING LEGENDS</Text>
                <View style={styles.listPill}>
                  <TrendingUp size={12} color={colors.text} />
                  <Text style={styles.listPillText}>
                    {visibleListRunners.length} {visibleListRunners.length === 1 ? 'RUNNER' : 'RUNNERS'}
                  </Text>
                </View>
              </View>

              {visibleListRunners.map((runner, index) => (
                <MotiView
                  key={runner.id}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: index * 50 }}
                >
                  <TouchableOpacity 
                    style={styles.runnerRow}
                    onPress={() => router.push(`/runner/${runner.id}`)}
                  >
                    <View style={styles.rowRank}>
                      <Text style={styles.rowRankText}>{runner.rank}</Text>
                    </View>
                    <UserAvatar url={runner.avatar_url} size={50} borderWidth={2} />
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName}>{runner.name}</Text>
                      <View style={styles.rowStats}>
                        <Star size={12} color={colors.accent} fill={colors.accent} />
                        <Text style={styles.rowRating}>{runner.rating.toFixed(1)}</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.rowTrips}>{runner.stats_trips} trips</Text>
                      </View>
                    </View>
                    {runner.streak_count > 5 && (
                      <View style={styles.streakBadge}>
                        <Zap size={12} color={colors.surface} fill={colors.surface} />
                        <Text style={styles.streakText}>{runner.streak_count}</Text>
                      </View>
                    )}
                    <ChevronLeft size={20} color={colors.muted} style={{ transform: [{ rotate: '180deg' }] }} />
                  </TouchableOpacity>
                </MotiView>
              ))}

              {visibleListRunners.length === 0 && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No additional runners to show yet.</Text>
                </View>
              )}
            </View>
          </>
        )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Award size={16} color={colors.muted} />
        <Text style={styles.footerText}>Ranked by rating & trip density</Text>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentArea: {
    flex: 1,
    position: 'relative',
  },
  refreshBannerOffset: {
    position: 'relative',
    paddingBottom: 38,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
    color: colors.text,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.lg,
    marginBottom: DT.spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DT.spacing.md,
  },
  heroLabelWrap: {
    flex: 1,
    gap: 8,
  },
  heroLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 28,
    lineHeight: 31,
    color: colors.surface,
    maxWidth: '92%',
  },
  heroSubtext: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 8,
  },
  heroIconBox: {
    width: 42,
    height: 42,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: colors.text,
  },
  cityText: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.text,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: DT.spacing.lg,
    paddingTop: DT.spacing.lg,
    paddingBottom: 120,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.text,
    marginTop: 16,
  },
  podiumSection: {
    marginBottom: DT.spacing.lg,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: DT.spacing.lg,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    gap: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  podiumCard: {
    alignItems: 'center',
    width: 105,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  podiumFirst: {
    width: 130,
    transform: [{ translateY: -25 }],
    backgroundColor: colors.primary,
    borderColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
  },
  rankBadge: {
    width: 32,
    height: 32,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    marginTop: -20,
    zIndex: 10,
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  rankText: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.surface,
  },
  podiumName: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.text,
    marginTop: 10,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  podiumStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  podiumRating: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.text,
  },
  podiumTrips: {
    fontFamily: DT.typography.body,
    fontSize: 10,
    color: colors.muted,
  },
  listContainer: {
    marginBottom: DT.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DT.spacing.md,
  },
  sectionLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.5,
  },
  listPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  listPillText: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.text,
    letterSpacing: 1,
  },
  runnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    padding: 12,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  emptyBox: {
    padding: DT.spacing.xl,
    borderWidth: 2,
    borderColor: colors.text,
    borderStyle: 'dashed',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emptyText: {
    fontFamily: DT.typography.body,
    color: colors.muted,
  },
  rowRank: {
    width: 35,
    alignItems: 'center',
  },
  rowRankText: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
    color: colors.text,
  },
  rowInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rowName: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.text,
  },
  rowStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  rowRating: {
    fontFamily: DT.typography.heading,
    fontSize: 13,
    color: colors.text,
  },
  dot: {
    color: colors.muted,
  },
  rowTrips: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.muted,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  streakText: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.surface,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: DT.spacing.lg,
    right: DT.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
    paddingVertical: 8,
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  footerText: {
    fontFamily: DT.typography.heading,
    fontSize: 11,
    color: colors.text,
    letterSpacing: 1,
  },
});
