import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Star, History, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useBrutalistRefresh } from '../../components/ui/BrutalistRefreshControl';
import { MotiView } from 'moti';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';

const filters = ['Available Now', 'Under 2km', '5★ Rated', 'Vehicles'];
const recentSearches = ['Fresh Tomatoes', 'Macbook repair', 'Plumber in Yaba', 'Groceries'];

export default function SearchScreen() {
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [markets, setMarkets] = useState<string[]>([]);
  const [runners, setRunners] = useState<any[]>([]);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [activeFilter, setActiveFilter] = useState('Available Now');
  const [loading, setLoading] = useState(false);
  const styles = getStyles(colors);

  const fetchSearchData = async (mkt?: string, flt?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const selectedMkt = mkt !== undefined ? mkt : selectedMarket;
      const activeFlt = flt !== undefined ? flt : activeFilter;
      
      // Map display filters to backend filter strings
      const filterMap: any = {
        'Available Now': 'available_now',
        '5★ Rated': '5_star',
        'Under 2km': 'nearby',
        'Vehicles': 'vehicles'
      };

      const res = await fetch(API.SEARCH.RUNNERS(query, filterMap[activeFlt] || 'available_now', selectedMkt), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRunners(data.runners || []);
      
      if (data.markets && data.markets.length > 0) {
        setMarkets(data.markets);
        if (!selectedMkt || !data.markets.includes(selectedMkt)) {
          setSelectedMarket(data.markets[0]);
        }
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchData();
  }, [user?.city]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (query.length > 2) fetchSearchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const { refreshControl, refreshBanner, onScroll, refreshing } = useBrutalistRefresh({
    onRefresh: async () => {
      await fetchSearchData();
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
                onPress={() => {
                  setActiveFilter(f);
                  fetchSearchData(selectedMarket, f);
                }}
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
                  onPress={() => {
                    setSelectedMarket(m);
                    fetchSearchData(m, activeFilter);
                  }}
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
            <Text style={styles.sectionLabel}>RUNNERS IN {user?.city?.toUpperCase() || 'YOUR AREA'} · NEAR {selectedMarket.toUpperCase()}</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.runnerScroll}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Fetching nearby runners...</Text>
              </View>
            ) : runners.length > 0 ? (
              runners.map(runner => (
                <TouchableOpacity 
                  key={runner.id} 
                  style={styles.runnerCard}
                  onPress={() => router.push(`/runner/${runner.id}` as any)}
                >
                  <View style={styles.runnerHeader}>
                    <View style={styles.runnerAvatarWrap}>
                      <Image 
                        source={runner.image.startsWith('http') 
                          ? { uri: runner.image } 
                          : { uri: `${API.API_URL}${runner.image}`, headers: { Authorization: `Bearer ${token}` } }
                        } 
                        style={styles.runnerAvatar} 
                      />
                      {runner.is_online && <View style={styles.onlineDot} />}
                    </View>
                    <View style={styles.runnerHeaderInfo}>
                      <Text style={styles.runnerName}>{runner.name}</Text>
                      <View style={styles.runnerMeta}>
                        <Star size={12} color={colors.accent} fill={colors.accent} />
                        <Text style={styles.runnerRating}>{runner.rating}</Text>
                        {runner.active_waka_count > 0 && (
                          <>
                            <Text style={styles.metaDot}>•</Text>
                            <Text style={styles.wakaCountText}>{runner.active_waka_count} Active</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.runnerFooter}>
                    <View style={styles.distanceBadge}>
                      <MapPin size={12} color={colors.surface} />
                      <Text style={styles.distanceText}>{runner.distance_km}km</Text>
                    </View>
                    <TouchableOpacity style={styles.hireBtn} onPress={() => router.push('/new-errand')}>
                      <Text style={styles.hireBtnText}>HIRE</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No runners found near {selectedMarket}.</Text>
                </View>
            )}
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
  metaDot: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.muted,
    marginHorizontal: 4,
  },
  wakaCountText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 11,
    color: colors.secondary,
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
  loadingContainer: {
    width: 220,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
  },
  loadingText: {
    fontFamily: DT.typography.body,
    fontSize: 10,
    color: colors.muted,
    marginTop: 8,
  },
  emptyContainer: {
    width: 220,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    padding: 20,
  },
  emptyText: {
      fontFamily: DT.typography.body,
      fontSize: 12,
      color: colors.muted,
      textAlign: 'center',
  }
});
