import { useNavigation, useRouter } from 'expo-router';
import {
  ArrowRight,
  Bell,
  MapPin,
  Package,
  ShoppingCart,
  Star,
  Utensils,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import * as ExpoLocation from 'expo-location';
import { Image } from 'expo-image';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useBrutalistRefresh } from '../../components/ui/BrutalistRefreshControl';
import { MotiView } from 'moti';

const RUNNERS_LIMIT = 5;

// Moved static data to state inside HomeScreen

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, token, refreshUser, isAdmin } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const styles = getStyles(colors);

  const [greeting, setGreeting] = useState('');
  const [activeWakas, setActiveWakas] = useState<any[]>([]);
  const [isLoadingWakas, setIsLoadingWakas] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeRunnersCount, setActiveRunnersCount] = useState<number | null>(null);
  const [nearbyRunners, setNearbyRunners] = useState<any[]>([]);
  const [availableWakas, setAvailableWakas] = useState<any[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);

  const getStatusText = (step: number, status: string) => {
    if (status === 'finding_runner') return 'Finding Runner...';
    switch (step) {
      case 1: return 'Finding Runner';
      case 2: return 'Runner en-route';
      case 3: return 'Sourcing Items';
      case 4: return 'Delivering';
      default: return status;
    }
  };

  const fetchActiveWakas = async () => {
    if (!token) return;
    try {
      setIsLoadingWakas(true);
      const url = user?.is_runner ? API.WAKA.RUNNER_ACTIVE : API.WAKA.ACTIVE;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveWakas(data);
      }
    } catch (e) {
      console.error('Fetch active wakas failed:', e);
    } finally {
      setIsLoadingWakas(false);
    }
  };

  const fetchAvailableWakas = async () => {
    if (!token || !user?.is_runner) return;
    try {
      setIsLoadingAvailable(true);
      const res = await fetch(API.WAKA.AVAILABLE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableWakas(data.slice(0, 5));
      }
    } catch (e) {
      console.error('Fetch available wakas failed:', e);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await fetch(API.NOTIFICATIONS.UNREAD_COUNT, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count);
      }
    } catch (e) {
      console.error('Fetch unread count failed:', e);
    }
  };

  const fetchNearbyRunners = async () => {
    if (!token) return;
    try {
      setIsNearbyLoading(true);
      const res = await fetch(API.SEARCH.RUNNERS(undefined, 'nearby'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNearbyRunners(data.runners.slice(0, RUNNERS_LIMIT));
        setActiveRunnersCount(data.runners.filter((r: any) => r.is_online).length);
      }
    } catch (e) {
      console.error('Fetch nearby runners failed:', e);
    } finally {
      setIsNearbyLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveWakas();
    fetchUnreadCount();
    fetchNearbyRunners();
    if (user?.is_runner || isAdmin) fetchAvailableWakas();
  }, [token, user?.is_runner, isAdmin]);

  const { refreshControl, refreshBanner, onScroll, refreshing } = useBrutalistRefresh({
    onRefresh: async () => { 
      await Promise.all([
        refreshUser(), 
        fetchActiveWakas(), 
        fetchUnreadCount(),
        fetchNearbyRunners(),
        (user?.is_runner || isAdmin) ? fetchAvailableWakas() : Promise.resolve()
      ]);
    },
  });

  // 1. Gesture/Back Handler Prevention
  useEffect(() => {
    // Android Hardware Back Block
    const onBackPress = () => true; // Returns true to stop propagation
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    // React Navigation Stack/Swipe Block
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Prevent going back
      e.preventDefault();
    });

    return () => {
      backSubscription.remove();
      unsubscribe();
    };
  }, [navigation]);

  // 2. Dynamic Greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning ☀️');
    else if (hour < 18) setGreeting('Good Afternoon 🌤️');
    else setGreeting('Good Evening 🌙');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Dynamic Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {greeting}, {user?.full_name?.split(' ')[0] || 'Nomad'}
          </Text>
          <View style={styles.marketStatusRow}>
            <View style={styles.marketDot} />
            <Text style={styles.marketStats}>
              {activeRunnersCount === null ? '--' : (activeRunnersCount === 0 ? 'No' : activeRunnersCount)} Runners Active
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.bellWrapper}
            onPress={() => router.push('/notifications' as any)}
          >
            <Bell size={22} color={colors.text} strokeWidth={2.5} />
            {unreadCount > 0 && (
              <View style={styles.bellDot}>
                <Text style={styles.unreadText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarBox}
            onPress={() => router.push('/profile' as any)}
          >
            <Image
              source={
                user?.avatar_url
                  ? {
                      uri: `${API.API_URL}${user.avatar_url}`,
                      headers: { Authorization: `Bearer ${token}` },
                    }
                  : { uri: 'https://i.pravatar.cc/150?u=chidi' }
              }
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.flex1}>
        {refreshBanner}
        <MotiView
          animate={{ translateY: refreshing ? 75 : 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          style={styles.flex1}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={refreshControl}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >

        {/* ── Active Wakas ── */}
        {(activeWakas.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{user?.is_runner ? 'YOUR ACTIVE ERRANDS' : 'ACTIVE WAKA'}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {activeWakas.map((waka) => (
                <TouchableOpacity
                  key={waka.id}
                  style={styles.wakaCardWrapper}
                  onPress={() => router.push({
                    pathname: `/waka/${waka.id}`,
                    params: { initialStatus: getStatusText(waka.step, waka.status) }
                  } as any)}
                >
                  <View style={[styles.wakaCard, user?.is_runner && { backgroundColor: colors.primary }]}>
                    <View style={[styles.wakaLive, user?.is_runner && { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.wakaLiveText, user?.is_runner && { color: colors.surface }]}>LIVE</Text>
                    </View>
                    <Text style={styles.wakaTitle} numberOfLines={2}>{waka.item_description}</Text>
                    <View style={styles.wakaFooter}>
                      <Text style={styles.wakaStatus}>{getStatusText(waka.step, waka.status)}</Text>
                      <ArrowRight size={16} color={colors.surface} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Available Errands (Runner & Admin) ── */}
        {(user?.is_runner || isAdmin) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: colors.accent, borderLeftWidth: 4, borderLeftColor: colors.accent, paddingLeft: 8 }]}>
                AVAILABLE ERRANDS
              </Text>
              {availableWakas.length > 0 && (
                <TouchableOpacity onPress={() => router.push('/runners/all')}>
                  <Text style={styles.seeAll}>View all</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {isLoadingAvailable ? (
              <View style={[styles.wakaCard, { width: '100%', alignItems: 'center', borderColor: colors.text + '30' }]}>
                <ActivityIndicator color={colors.accent} size="small" />
              </View>
            ) : availableWakas.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {availableWakas.map((waka) => (
                  <TouchableOpacity
                    key={waka.id}
                    style={styles.wakaCardWrapper}
                    onPress={() => router.push(`/waka/${waka.id}` as any)}
                  >
                    <View style={[styles.wakaCard, { backgroundColor: colors.accent }]}>
                      <View style={styles.wakaLive}>
                        <Text style={styles.wakaLiveText}>NEW</Text>
                      </View>
                      <Text style={[styles.wakaTitle, { color: colors.text }]} numberOfLines={2}>{waka.item_description}</Text>
                      <View style={[styles.wakaFooter, { borderTopColor: colors.text + '20' }]}>
                        <Text style={[styles.wakaStatus, { color: colors.text }]}>₦{(waka.total_price || 0).toLocaleString()}</Text>
                        <ArrowRight size={16} color={colors.text} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.wakaCard, { backgroundColor: colors.surface, width: '100%', padding: 35, alignItems: 'center', borderStyle: 'dashed' }]}>
                <Package size={34} color={colors.muted} style={{ marginBottom: 12, opacity: 0.6 }} />
                <Text style={{ fontFamily: DT.typography.heading, fontSize: 17, color: colors.text }}>No Open Errands</Text>
                <Text style={{ fontFamily: DT.typography.body, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                  Errands posted by nomads in your area will appear here immediately.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── 2x2 Quick Grid ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT DO YOU NEED?</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <TouchableOpacity style={[styles.gridBox, { backgroundColor: colors.accent }]} onPress={() => router.push('/new-errand')}>
                <Package size={28} color={colors.text} strokeWidth={2.5} />
                <Text style={styles.gridBoxText}>Package</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridBox, { backgroundColor: colors.primary }]} onPress={() => router.push('/new-errand')}>
                <ShoppingCart size={28} color={colors.surface} strokeWidth={2.5} />
                <Text style={[styles.gridBoxText, { color: colors.surface }]}>Market</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gridRow}>
              <TouchableOpacity style={[styles.gridBox, { backgroundColor: colors.secondary }]} onPress={() => router.push('/new-errand')}>
                <Utensils size={28} color={colors.text} strokeWidth={2.5} />
                <Text style={styles.gridBoxText}>Food</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridBox, { backgroundColor: colors.surface }]} onPress={() => router.push('/new-errand')}>
                <Zap size={28} color={colors.text} strokeWidth={2.5} />
                <Text style={styles.gridBoxText}>Custom</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Runners Carousel ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>RUNNERS IN {user?.city?.toUpperCase() || 'YOUR AREA'}</Text>
            <TouchableOpacity onPress={() => router.push('/runners/all')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {isNearbyLoading ? (
              [1, 2, 3].map((i) => (
                <View key={i} style={[styles.runnerCard, { opacity: 0.5, justifyContent: 'center', alignItems: 'center' }]}>
                   <ActivityIndicator color={colors.primary} />
                </View>
              ))
            ) : nearbyRunners.length > 0 ? (
              nearbyRunners.map((runner) => (
                <TouchableOpacity
                  key={runner.id}
                  style={styles.runnerCard}
                  onPress={() => router.push(`/runner/${runner.id}` as any)}
                >
                  <View style={styles.runnerCardHeader}>
                    <View style={styles.runnerImageWrap}>
                      <Image 
                        source={runner.image.startsWith('http') 
                          ? { uri: runner.image } 
                          : { uri: `${API.API_URL}${runner.image}`, headers: { Authorization: `Bearer ${token}` } }
                        } 
                        style={styles.runnerImageFull} 
                      />
                      {runner.is_online && <View style={styles.onlineDot} />}
                    </View>
                  </View>

                  <View style={styles.runnerCardBody}>
                    <Text style={styles.runnerNameFull}>{runner.name}</Text>

                    <View style={styles.runnerStatsRow}>
                      <View style={styles.runnerStatItem}>
                        <Star size={14} color={colors.accent} fill={colors.accent} />
                        <Text style={styles.runnerStatText}>{runner.rating}</Text>
                      </View>
                      <View style={styles.dot} />
                      <View style={styles.runnerStatItem}>
                        <MapPin size={14} color={colors.text} />
                        <Text style={styles.runnerStatText}>{runner.distance_km}km</Text>
                      </View>
                    </View>

                    <Text style={styles.jobsCompletedText}>{runner.active_waka_count} active trips</Text>
                  </View>

                  <View style={styles.runnerCardFooter}>
                    <Text style={styles.hireBtnTextSmall}>HIRE — ₦{runner.hourly_rate?.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.runnerCard, { width: 300, padding: 20, justifyContent: 'center' }]}>
                <Text style={{ fontFamily: DT.typography.body, color: colors.muted, textAlign: 'center' }}>
                  No runners available in your area yet.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

      </ScrollView>
    </MotiView>
    </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
    paddingTop: 10,
  },
  scrollContent: {
    paddingHorizontal: DT.spacing.lg,
    paddingBottom: 140, // pad for docked action
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg,
    paddingTop: DT.spacing.md,
    paddingBottom: DT.spacing.lg,
  },
  greeting: {
    fontFamily: DT.typography.heading,
    fontSize: 22,
    color: colors.text,
    marginBottom: 4,
  },
  marketStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  marketDot: {
    width: 10,
    height: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
  },
  marketStats: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.muted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellWrapper: {
    width: 44,
    height: 44,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  bellDot: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  unreadText: {
    fontFamily: DT.typography.heading,
    fontSize: 9,
    color: colors.text,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderWidth: 3,
    borderColor: colors.text,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  section: {
    marginBottom: DT.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DT.spacing.md,
  },
  sectionLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 13,
    color: colors.muted,
    letterSpacing: 1.5,
    marginBottom: DT.spacing.md,
  },
  seeAll: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 13,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  horizontalList: {
    gap: DT.spacing.md,
  },
  wakaCardWrapper: {},
  wakaCard: {
    width: 250,
    backgroundColor: colors.secondary,
    borderWidth: 3,
    borderColor: colors.text,
    padding: DT.spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  wakaLive: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.text,
    marginBottom: 8,
  },
  wakaLiveText: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.text,
    letterSpacing: 1,
  },
  wakaTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.surface,
    marginBottom: 8,
    minHeight: 40,
  },
  wakaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
    marginTop: 8,
  },
  wakaStatus: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.surface,
    opacity: 0.9,
  },
  gridContainer: {
    gap: DT.spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: DT.spacing.sm,
  },
  gridBox: {
    flex: 1,
    height: 100,
    borderWidth: 3,
    borderColor: colors.text,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: DT.spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  gridBoxText: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.text,
  },
  runnerCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  runnerCardHeader: {
    height: 110,
    borderBottomWidth: 3,
    borderBottomColor: colors.text,
    backgroundColor: colors.background,
  },
  runnerImageWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  runnerImageFull: {
    width: '100%',
    height: '100%',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 14,
    height: 14,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.text,
  },
  runnerCardBody: {
    padding: DT.spacing.sm,
  },
  runnerNameFull: {
    fontFamily: DT.typography.heading,
    fontSize: 15,
    color: colors.text,
    marginBottom: 6,
  },
  runnerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  runnerStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  runnerStatText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 11,
    color: colors.text,
  },
  dot: {
    width: 3,
    height: 3,
    backgroundColor: colors.muted,
  },
  jobsCompletedText: {
    fontFamily: DT.typography.body,
    fontSize: 10,
    color: colors.muted,
  },
  runnerCardFooter: {
    borderTopWidth: 2,
    borderTopColor: colors.text,
    backgroundColor: colors.accent,
    paddingVertical: 8,
    alignItems: 'center',
  },
  hireBtnTextSmall: {
    fontFamily: DT.typography.heading,
    fontSize: 11,
    color: colors.text,
  },
});
