import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Star, History, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useBrutalistRefresh } from '../../components/ui/BrutalistRefreshControl';
import { MotiView } from 'moti';

const markets = ['Mile 12', 'Balogun', 'Yaba', 'Ikeja', 'Oshodi', 'Tejuosho'];
const filters = ['Available Now', 'Under 2km', '5★ Rated', 'Vehicles'];
const recentSearches = ['Fresh Tomatoes', 'Macbook repair', 'Plumber in Yaba', 'Groceries'];

const mockRunners = [
  { id: '1', name: 'Chinedu O.', rating: 4.9, km: '0.8km', img: 'https://i.pravatar.cc/150?u=chinedu', active: true },
  { id: '2', name: 'Amina B.', rating: 4.8, km: '1.2km', img: 'https://i.pravatar.cc/150?u=amina', active: true },
  { id: '3', name: 'Tunde S.', rating: 5.0, km: '2.1km', img: 'https://i.pravatar.cc/150?u=tunde', active: false },
  { id: '4', name: 'Ngozi A.', rating: 4.7, km: '3.0km', img: 'https://i.pravatar.cc/150?u=ngozi', active: true },
];

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('Mile 12');
  const [activeFilter, setActiveFilter] = useState('Available Now');
  const styles = getStyles(colors);

  const { refreshControl, refreshBanner, onScroll, refreshing } = useBrutalistRefresh({
    onRefresh: async () => {
      // Mock refresh delay
      await new Promise(resolve => setTimeout(resolve, 1500));
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Runners</Text>
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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <View style={styles.searchIcon}>
              <Search size={22} color={colors.surface} strokeWidth={2.5} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search markets, vendors, items..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>

        {/* Filters (Scrollable) */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((f) => {
            const isActive = activeFilter === f;
            return (
              <TouchableOpacity 
                key={f} 
                style={[
                  styles.filterChip, 
                  isActive && { backgroundColor: colors.primary, borderColor: colors.text }
                ]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[
                  styles.filterChipText, 
                  isActive && { color: colors.surface }
                ]}>
                  {f}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Interactive Markets */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>POPULAR MARKETS</Text>
          <View style={styles.tagsWrap}>
            {markets.map((m) => {
              const isSelected = selectedMarket === m;
              return (
                <TouchableOpacity 
                  key={m} 
                  style={[
                    styles.marketTag,
                    isSelected && { backgroundColor: colors.accent }
                  ]}
                  onPress={() => setSelectedMarket(m)}
                >
                  <Text style={[
                    styles.marketTagText,
                  ]}>{m}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Active Runners Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>RUNNERS NEAR {selectedMarket.toUpperCase()}</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.runnerScroll}
          >
            {mockRunners.map(runner => (
              <TouchableOpacity 
                key={runner.id} 
                style={styles.runnerCard}
                onPress={() => router.push(`/runner/${runner.id}` as any)}
              >
                <View style={styles.runnerHeader}>
                  <View style={styles.runnerAvatarWrap}>
                    <Image source={{ uri: runner.img }} style={styles.runnerAvatar} />
                    {runner.active && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.runnerHeaderInfo}>
                    <Text style={styles.runnerName}>{runner.name}</Text>
                    <View style={styles.runnerMeta}>
                      <Star size={12} color={colors.accent} fill={colors.accent} />
                      <Text style={styles.runnerRating}>{runner.rating}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.runnerFooter}>
                  <View style={styles.distanceBadge}>
                    <MapPin size={12} color={colors.surface} />
                    <Text style={styles.distanceText}>{runner.km}</Text>
                  </View>
                  <TouchableOpacity style={styles.hireBtn} onPress={() => router.push('/new-errand')}>
                    <Text style={styles.hireBtnText}>HIRE</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Searches */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT SEARCHES</Text>
          <View style={styles.recentList}>
            {recentSearches.map(search => (
              <TouchableOpacity key={search} style={styles.recentRow}>
                <History size={16} color={colors.muted} />
                <Text style={styles.recentText}>{search}</Text>
                <ArrowRight size={16} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
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
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: DT.spacing.lg,
    paddingTop: DT.spacing.lg,
    paddingBottom: DT.spacing.md,
  },
  title: {
    fontFamily: DT.typography.heading,
    fontSize: 28,
    color: colors.text,
  },
  searchContainer: {
    paddingHorizontal: DT.spacing.lg,
    marginBottom: DT.spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  searchIcon: {
    width: 52,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: DT.spacing.md,
    fontFamily: DT.typography.body,
    fontSize: 16,
    color: colors.text,
  },
  filterScroll: {
    paddingHorizontal: DT.spacing.lg,
    paddingBottom: DT.spacing.lg,
    gap: DT.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.muted,
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  filterChipText: {
    fontFamily: DT.typography.heading,
    fontSize: 13,
    color: colors.text,
  },
  section: {
    paddingHorizontal: DT.spacing.lg,
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
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 1.5,
    marginBottom: DT.spacing.md,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DT.spacing.sm,
  },
  marketTag: {
    paddingHorizontal: DT.spacing.md,
    paddingVertical: DT.spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  marketTagText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.text,
  },
  runnerScroll: {
    gap: DT.spacing.md,
    paddingRight: DT.spacing.lg,
  },
  runnerCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  runnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DT.spacing.lg,
  },
  runnerAvatarWrap: {
    marginRight: DT.spacing.md,
  },
  runnerAvatar: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: colors.text,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 14,
    height: 14,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.text,
  },
  runnerHeaderInfo: {
    flex: 1,
  },
  runnerName: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  runnerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  runnerRating: {
    fontFamily: DT.typography.body,
    fontSize: 14,
    color: colors.text,
  },
  runnerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  distanceText: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.surface,
  },
  hireBtn: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  hireBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.surface,
  },
  recentList: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DT.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  recentText: {
    flex: 1,
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.text,
    marginLeft: DT.spacing.md,
  },
});
