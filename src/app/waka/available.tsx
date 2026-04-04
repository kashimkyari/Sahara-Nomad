import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Package, 
  Zap, 
  MapPin, 
  ArrowRight,
  ShoppingBag,
  Utensils,
  Navigation
} from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { MotiView, AnimatePresence } from 'moti';
import { Button } from '../../components/ui/Button';

export default function AvailableWakasScreen() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();
  const styles = getStyles(colors);

  const [wakas, setWakas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'ALL', icon: Package },
    { id: 'package', label: 'PACKAGE', icon: Package },
    { id: 'market', label: 'MARKET', icon: ShoppingBag },
    { id: 'food', label: 'FOOD', icon: Utensils },
    { id: 'flash', label: 'URGENT', icon: Zap },
  ];

  const filteredWakas = wakas.filter(waka => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'flash') return waka.urgency === 'flash';
    return waka.category === activeCategory;
  });

  const fetchAvailable = async () => {
    if (!token) return;
    try {
      const res = await fetch(API.WAKA.AVAILABLE, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWakas(data);
      }
    } catch (e) {
      console.error('Failed to fetch available errands:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAvailable();
  };

  const getArea = (address: string) => {
    if (!address) return 'Nearby';
    const parts = address.split(',');
    if (parts.length > 2) return parts[parts.length - 2].trim();
    return parts[parts.length - 1].trim();
  };

  const renderWaka = ({ item, index }: { item: any, index: number }) => {
    const CategoryIcon = item.category === 'market' ? ShoppingBag : item.category === 'food' ? Utensils : Package;
    
    return (
      <MotiView 
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 50 }}
        style={styles.card}
      >
        <TouchableOpacity 
          style={styles.cardInner}
          onPress={() => router.push(`/waka/${item.id}` as any)}
        >
          {/* Top Row: Category & Price */}
          <View style={styles.cardTopRow}>
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <CategoryIcon size={12} color={colors.text} />
                <Text style={styles.categoryLabel}>{item.category.toUpperCase()}</Text>
              </View>
              <View style={styles.areaBadge}>
                <MapPin size={10} color={colors.surface} fill={colors.surface} />
                <Text style={styles.areaLabel}>{getArea(item.pickup_address).toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.priceValue}>₦{item.total_price.toLocaleString()}</Text>
          </View>

          {/* Body: Description */}
          <Text style={styles.itemTitle} numberOfLines={1}>{item.item_description}</Text>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <MapPin size={12} color={colors.accent} strokeWidth={2.5} />
              <Text style={styles.detailLabel} numberOfLines={1}>PICK: {item.pickup_address}</Text>
            </View>
            <View style={styles.detailItem}>
              <Navigation size={12} color={colors.secondary} strokeWidth={2.5} />
              <Text style={styles.detailLabel} numberOfLines={1}>DROP: {item.dropoff_address}</Text>
            </View>
          </View>

          {/* Footer: Urgency & Action */}
          <View style={styles.cardBottomRow}>
            {item.urgency === 'flash' ? (
              <View style={styles.flashBadge}>
                <Zap size={10} color={colors.surface} fill={colors.surface} />
                <Text style={styles.flashText}>FLASH</Text>
              </View>
            ) : (
              <View style={styles.standardBadge}>
                <Text style={styles.standardText}>STANDARD</Text>
              </View>
            )}
            
            <View style={styles.miniActionRow}>
              <Text style={styles.detailsBtnText}>DETAILS</Text>
              <ArrowRight size={14} color={colors.text} />
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={3} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Available Errands</Text>
          <Text style={styles.headerSubtitle}>{filteredWakas.length} tasks matching your area</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.id}
              style={[
                styles.categoryChip,
                activeCategory === cat.id && styles.activeChip
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <cat.icon 
                size={14} 
                color={activeCategory === cat.id ? colors.surface : colors.text} 
                strokeWidth={2.5}
              />
              <Text style={[
                styles.chipLabel,
                activeCategory === cat.id && styles.activeChipLabel
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.flex1}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Scouting for errands...</Text>
          </View>
        ) : filteredWakas.length > 0 ? (
          <FlatList
            data={filteredWakas}
            keyExtractor={item => item.id}
            renderItem={renderWaka}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        ) : (
          <View style={styles.centered}>
            <Package size={64} color={colors.muted} strokeWidth={1} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySub}>No errands found for this category. Try switching filters or refreshing the radar.</Text>
            <TouchableOpacity 
              style={styles.refreshBtn}
              onPress={onRefresh}
            >
              <Text style={styles.refreshBtnText}>REFRESH RADAR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    borderBottomWidth: 4,
    borderBottomColor: colors.text,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
    paddingVertical: DT.spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: DT.spacing.lg,
    gap: DT.spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  activeChip: {
    backgroundColor: colors.text,
  },
  chipLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.text,
    letterSpacing: 1,
  },
  activeChipLabel: {
    color: colors.surface,
  },
  listContent: {
    padding: DT.spacing.md,
    paddingBottom: 40,
  },
  card: {
    marginBottom: DT.spacing.md,
  },
  cardInner: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.text,
    padding: DT.spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  areaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: colors.text,
    gap: 4,
  },
  areaLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 9,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: colors.text,
    gap: 4,
  },
  categoryLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 9,
    color: colors.text,
    letterSpacing: 0.5,
  },
  priceValue: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
    color: colors.text,
  },
  itemTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  detailsGrid: {
    gap: 8,
    marginBottom: 12,
    backgroundColor: colors.background,
    padding: 10,
    borderWidth: 2,
    borderColor: colors.text,
    borderStyle: 'dashed',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 10,
    color: colors.muted,
    flex: 1,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: colors.text,
    paddingTop: 10,
    marginTop: 4,
  },
  flashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  flashText: {
    fontFamily: DT.typography.heading,
    fontSize: 9,
    color: colors.surface,
    letterSpacing: 1,
  },
  standardBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.text + '30',
  },
  standardText: {
    fontFamily: DT.typography.heading,
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  miniActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.text,
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
    fontSize: 24,
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  refreshBtn: {
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.text,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  refreshBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.text,
    letterSpacing: 1,
  },
});
