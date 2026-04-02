import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  Plus,
  MapPin,
  Star,
  ArrowRight,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/use-theme';
import { DesignTokens as DT } from '../../constants/design';

const runners = [
  { id: '1', name: 'Chinedu O.', rating: 4.9, km: '0.8km', img: 'https://i.pravatar.cc/150?u=chinedu', online: true },
  { id: '2', name: 'Amina B.', rating: 4.8, km: '1.2km', img: 'https://i.pravatar.cc/150?u=amina', online: true },
  { id: '3', name: 'Tunde S.', rating: 5.0, km: '2.1km', img: 'https://i.pravatar.cc/150?u=tunde', online: false },
  { id: '4', name: 'Ngozi A.', rating: 4.7, km: '3.0km', img: 'https://i.pravatar.cc/150?u=ngozi', online: true },
  { id: '5', name: 'Emeka C.', rating: 4.9, km: '1.5km', img: 'https://i.pravatar.cc/150?u=emeka', online: true },
];

const activeWakas = [
  { id: 'w1', title: 'Sourcing Tomatoes at Mile 12', status: 'Runner en-route' },
  { id: 'w2', title: 'Groceries from Shoprite Lekki', status: 'Waiting for runner' },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const fabScale = useRef(new Animated.Value(1)).current;

  const onFABPressIn = () =>
    Animated.spring(fabScale, { toValue: 0.9, useNativeDriver: true }).start();
  const onFABPressOut = () =>
    Animated.spring(fabScale, { toValue: 1, useNativeDriver: true }).start();

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome,</Text>
            <Text style={styles.username}>Chidi 👋</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellWrapper} onPress={() => router.push('/notifications' as any)}>
              <Bell size={22} color={colors.text} strokeWidth={2.5} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBox} onPress={() => router.push('/profile')}>
              <Image
                source={{ uri: 'https://i.pravatar.cc/150?u=chidi' }}
                style={styles.avatar}
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
                  onPress={() => router.push(`/waka/${waka.id}`)}
                >
                  <View style={styles.wakaCard}>
                    <View style={styles.wakaLive}>
                      <Text style={styles.wakaLiveText}>LIVE</Text>
                    </View>
                    <Text style={styles.wakaTitle}>{waka.title}</Text>
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

        {/* ── Quick Post ── */}
        <TouchableOpacity
          style={styles.postBanner}
          onPress={() => router.push('/new-errand')}
        >
          <View style={styles.postBannerLeft}>
            <Zap size={20} color={colors.text} fill={colors.accent} />
            <Text style={styles.postBannerText}>What do you need today?</Text>
          </View>
          <View style={styles.postBannerArrow}>
            <ArrowRight size={18} color={colors.surface} />
          </View>
        </TouchableOpacity>

        {/* ── Nearby Runners ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>RUNNERS NEARBY</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {runners.map((runner) => (
            <TouchableOpacity
              key={runner.id}
              style={styles.runnerRow}
              onPress={() => router.push(`/runner/${runner.id}`)}
            >
              <View style={styles.runnerAvatarWrap}>
                <Image source={{ uri: runner.img }} style={styles.runnerAvatar} />
                {runner.online && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.runnerInfo}>
                <Text style={styles.runnerName}>{runner.name}</Text>
                <View style={styles.runnerMeta}>
                  <Star size={12} color={colors.accent} fill={colors.accent} />
                  <Text style={styles.runnerRating}>{runner.rating}</Text>
                  <View style={styles.dot} />
                  <MapPin size={12} color={colors.muted} />
                  <Text style={styles.runnerKm}>{runner.km} away</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.hireBtn}
                onPress={() => router.push('/new-errand')}
              >
                <Text style={styles.hireBtnText}>Hire</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── FAB ── */}
      <Animated.View
        style={[
          styles.fabShadow,
          { transform: [{ scale: fabScale }] },
        ]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/new-errand')}
          onPressIn={onFABPressIn}
          onPressOut={onFABPressOut}
          activeOpacity={1}
        >
          <Plus size={30} color={colors.surface} strokeWidth={3} />
        </TouchableOpacity>
      </Animated.View>
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
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: DT.spacing.md,
    paddingBottom: DT.spacing.lg,
  },
  greeting: {
    fontFamily: DT.typography.body,
    fontSize: 14,
    color: colors.muted,
  },
  username: {
    fontFamily: DT.typography.heading,
    fontSize: 26,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellWrapper: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.text,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: colors.text,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  section: {
    marginBottom: DT.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DT.spacing.md,
  },
  sectionLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 1.5,
    marginBottom: DT.spacing.md,
  },
  seeAll: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  horizontalList: {
    gap: DT.spacing.md,
  },
  wakaCardWrapper: {},
  wakaCard: {
    width: 260,
    backgroundColor: colors.secondary,
    borderWidth: 2,
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
    borderWidth: 1.5,
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
  },
  wakaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wakaStatus: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.surface,
    opacity: 0.85,
  },
  postBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.md,
    marginBottom: DT.spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  postBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postBannerText: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.text,
  },
  postBannerArrow: {
    width: 32,
    height: 32,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
    backgroundColor: colors.background,
  },
  runnerAvatarWrap: {
    position: 'relative',
    marginRight: DT.spacing.md,
  },
  runnerAvatar: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: colors.text,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.surface,
    borderRadius: 0,
  },
  runnerInfo: {
    flex: 1,
  },
  runnerName: {
    fontFamily: DT.typography.heading,
    fontSize: 15,
    color: colors.text,
    marginBottom: 2,
  },
  runnerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  runnerRating: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: colors.text,
  },
  dot: {
    width: 3,
    height: 3,
    backgroundColor: colors.muted,
    borderRadius: 0,
  },
  runnerKm: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: colors.muted,
  },
  hireBtn: {
    height: 32,
    paddingHorizontal: DT.spacing.md,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  hireBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 13,
    color: colors.surface,
  },
  fabShadow: {
    position: 'absolute',
    bottom: 96,
    right: DT.spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  fab: {
    width: 64,
    height: 64,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
