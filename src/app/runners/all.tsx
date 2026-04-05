import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Image, 
  ActivityIndicator,
  FlatList,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Star, Filter, ArrowUpDown, ShieldCheck, Zap } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { MotiView } from 'moti';

const SORT_OPTIONS = [
  { label: 'Nearest', value: 'distance' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Trips', value: 'trips' },
  { label: 'Price: Low-High', value: 'price' },
];

const FILTER_CHIPS = [
  { label: 'Online Now', value: 'available_now' },
  { label: '5★ Rated', value: '5_star' },
];

export default function AllRunnersScreen() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();
  const styles = getStyles(colors);

  const [runners, setRunners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState('distance');
  const [showSortModal, setShowSortModal] = useState(false);

  const fetchRunners = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API.SEARCH.RUNNERS(undefined, activeFilter || 'nearby', undefined, activeSort), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRunners(data.runners || []);
    } catch (e) {
      console.error('Failed to fetch runners:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRunners();
  }, [activeFilter, activeSort]);

  const renderRunner = ({ item }: { item: any }) => (
    (() => {
      const avatarUrl = item.avatar_url || item.image || null;
      const avatarSource = avatarUrl
        ? avatarUrl.startsWith('http')
          ? { uri: avatarUrl }
          : { uri: `${API.API_URL}${avatarUrl}`, headers: { Authorization: `Bearer ${token}` } }
        : null;

      return (
        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.runnerCard}
        >
          <TouchableOpacity 
            style={styles.runnerCardInner}
            onPress={() => router.push(`/runner/${item.id}` as any)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.avatarWrap}>
                {avatarSource ? (
                  <Image 
                    source={avatarSource}
                    style={styles.avatar} 
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarFallbackText}>
                      {(item.name || '?').slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
                {item.is_online && <View style={styles.onlineDot} />}
              </View>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.runnerName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.hourlyRate}>₦{item.hourly_rate.toLocaleString()}/hr</Text>
            </View>
            <View style={styles.metaRow}>
              <Star size={12} color={colors.accent} fill={colors.accent} />
              <Text style={styles.metaText}>{item.rating}</Text>
              <View style={styles.metaDot} />
              <MapPin size={12} color={colors.text} />
              <Text style={styles.metaText}>{item.distance_km}km away</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
           <Text style={styles.bioText} numberOfLines={2}>
             {item.bio || "Pro runner ready to help with your errands today!"}
           </Text>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.hireBtn}
            onPress={() => router.push({
              pathname: '/new-errand',
              params: { runnerId: item.id, runnerName: item.name }
            } as any)}
          >
            <Text style={styles.hireBtnText}>HIRE NOW</Text>
          </TouchableOpacity>
        </View>
          </TouchableOpacity>
        </MotiView>
      );
    })()
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={3} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>Local Runners</Text>
          <Text style={styles.headerSub}>In {user?.city || 'Your Area'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.sortBtn}
          onPress={() => setShowSortModal(true)}
        >
          <ArrowUpDown size={20} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_CHIPS.map(chip => (
            <TouchableOpacity 
              key={chip.value}
              style={[
                styles.chip,
                activeFilter === chip.value && styles.chipActive
              ]}
              onPress={() => setActiveFilter(activeFilter === chip.value ? null : chip.value)}
            >
              <Text style={[
                styles.chipText,
                activeFilter === chip.value && styles.chipTextActive
              ]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main List */}
      <View style={styles.flex1}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Pinging runners...</Text>
          </View>
        ) : runners.length > 0 ? (
          <FlatList
            data={runners}
            keyExtractor={item => item.id}
            renderItem={renderRunner}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.centered}>
            <MapPin size={48} color={colors.muted} strokeWidth={1} />
            <Text style={styles.emptyTitle}>No Runners Found</Text>
            <Text style={styles.emptySub}>Try adjusting your filters or area.</Text>
          </View>
        )}
      </View>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SORT BY</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity 
                key={opt.value}
                style={[
                  styles.sortOption,
                  activeSort === opt.value && styles.sortOptionActive
                ]}
                onPress={() => {
                  setActiveSort(opt.value);
                  setShowSortModal(false);
                }}
              >
                <Text style={[
                  styles.sortOptionText,
                  activeSort === opt.value && styles.sortOptionTextActive
                ]}>
                  {opt.label}
                </Text>
                {activeSort === opt.value && <Zap size={16} color={colors.surface} fill={colors.surface} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: colors.text,
  },
  backBtn: {
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
  avatarFallback: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
    color: colors.text,
  },
  titleWrap: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 22,
    color: colors.text,
  },
  headerSub: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.muted,
  },
  sortBtn: {
    width: 44,
    height: 44,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  filterBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterScroll: {
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: 12,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.text,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontFamily: DT.typography.heading,
    fontSize: 13,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.surface,
  },
  listContent: {
    padding: DT.spacing.lg,
    gap: 16,
    paddingBottom: 100,
  },
  runnerCard: {
    marginBottom: DT.spacing.md,
  },
  runnerCardInner: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.text,
    padding: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderWidth: 3,
    borderColor: colors.text,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.text,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  runnerName: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  hourlyRate: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.muted,
    marginHorizontal: 8,
  },
  cardBody: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  bioText: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  cardFooter: {
    flexDirection: 'row',
  },
  hireBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.text,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hireBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.surface,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.muted,
    marginTop: 15,
  },
  emptyTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: DT.typography.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopWidth: 5,
    borderTopColor: colors.text,
    padding: DT.spacing.lg,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
    letterSpacing: 2,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sortOptionActive: {
    backgroundColor: colors.text,
    paddingHorizontal: 15,
    marginHorizontal: -DT.spacing.lg,
    borderBottomColor: colors.text,
  },
  sortOptionText: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
  },
  sortOptionTextActive: {
    color: colors.surface,
  },
});
