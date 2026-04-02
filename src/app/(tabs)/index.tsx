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
  View
} from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

const runners = [
  { id: '1', name: 'Chinedu O.', rating: 4.9, km: '0.8km', img: 'https://i.pravatar.cc/150?u=chinedu', online: true, jobs: 142 },
  { id: '2', name: 'Amina B.', rating: 4.8, km: '1.2km', img: 'https://i.pravatar.cc/150?u=amina', online: true, jobs: 89 },
  { id: '3', name: 'Tunde S.', rating: 5.0, km: '2.1km', img: 'https://i.pravatar.cc/150?u=tunde', online: false, jobs: 310 },
  { id: '4', name: 'Ngozi A.', rating: 4.7, km: '3.0km', img: 'https://i.pravatar.cc/150?u=ngozi', online: true, jobs: 45 },
];

const activeWakas = [
  { id: 'w1', title: 'Sourcing Tomatoes at Mile 12', status: 'Runner en-route' },
  { id: 'w2', title: 'Groceries from Shoprite Lekki', status: 'Waiting for runner' },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const styles = getStyles(colors);

  const [greeting, setGreeting] = useState('');

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Dynamic Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, {user?.full_name?.split(' ')[0] || 'Nomad'}</Text>
            <View style={styles.marketStatusRow}>
              <View style={styles.marketDot} />
              <Text style={styles.marketStats}>124 Runners Active</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellWrapper} onPress={() => router.push('/notifications' as any)}>
              <Bell size={22} color={colors.text} strokeWidth={2.5} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBox} onPress={() => router.push('/profile' as any)}>
              <Image
                source={user?.avatar_url 
                  ? { 
                      uri: `${API.API_URL}${user.avatar_url}`,
                      headers: { Authorization: `Bearer ${token}` }
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

        {/* ── Active Wakas ── */}
        {activeWakas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACTIVE WAKA</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {activeWakas.map((waka) => (
                <TouchableOpacity
                  key={waka.id}
                  style={styles.wakaCardWrapper}
                  onPress={() => router.push(`/waka/${waka.id}` as any)}
                >
                  <View style={styles.wakaCard}>
                    <View style={styles.wakaLive}>
                      <Text style={styles.wakaLiveText}>LIVE</Text>
                    </View>
                    <Text style={styles.wakaTitle} numberOfLines={2}>{waka.title}</Text>
                    <View style={styles.wakaFooter}>
                      <Text style={styles.wakaStatus}>{waka.status}</Text>
                      <ArrowRight size={16} color={colors.surface} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
            <Text style={styles.sectionLabel}>RUNNERS NEARBY</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {runners.map((runner) => (
              <TouchableOpacity
                key={runner.id}
                style={styles.runnerCard}
                onPress={() => router.push(`/runner/${runner.id}` as any)}
              >
                <View style={styles.runnerCardHeader}>
                  <View style={styles.runnerImageWrap}>
                    <Image source={{ uri: runner.img }} style={styles.runnerImageFull} />
                    {runner.online && <View style={styles.onlineDot} />}
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
                      <Text style={styles.runnerStatText}>{runner.km}</Text>
                    </View>
                  </View>

                  <Text style={styles.jobsCompletedText}>{runner.jobs} trips completed</Text>
                </View>

                <View style={styles.runnerCardFooter}>
                  <Text style={styles.hireBtnTextSmall}>HIRE RUNNER</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: DT.spacing.lg,
    paddingBottom: 140, // pad for docked action
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    backgroundColor: colors.primary,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.text,
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
