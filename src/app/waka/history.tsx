import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  MapPin,
  Navigation,
  ShoppingBag,
  Utensils
} from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { MotiView } from 'moti';

export default function WakaHistoryScreen() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();
  const styles = getStyles(colors);

  const [wakas, setWakas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API.WAKA.MY_WAKAS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWakas(data);
      }
    } catch (e) {
      console.error('Failed to fetch waka history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getArea = (address: string) => {
    if (!address) return 'Nearby';
    const parts = address.split(',');
    if (parts.length > 2) return parts[parts.length - 2].trim();
    return parts[parts.length - 1].trim();
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { color: colors.secondary, icon: CheckCircle2 };
      case 'cancelled': return { color: colors.error || '#FF4B4B', icon: XCircle };
      default: return { color: colors.primary, icon: Clock };
    }
  };

  const renderWaka = ({ item, index }: { item: any, index: number }) => {
    const { color, icon: StatusIcon } = getStatusStyle(item.status);
    const date = new Date(item.created_at).toLocaleDateString();
    const isRunner = item.runner_id === user?.id;
    const displayAmount = isRunner ? (item.runner_fee + item.flash_incentive) : item.total_price;
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
          {/* Top Row: Category, Area & Date */}
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
            <Text style={styles.dateText}>{date}</Text>
          </View>

          {/* Body: Description */}
          <Text style={styles.itemTitle} numberOfLines={1}>{item.item_description}</Text>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <MapPin size={12} color={colors.accent} strokeWidth={2.5} />
              <Text style={styles.detailLabel} numberOfLines={1}>PICKUP: {item.pickup_address}</Text>
            </View>
            <View style={styles.detailItem}>
              <Navigation size={12} color={colors.secondary} strokeWidth={2.5} />
              <Text style={styles.detailLabel} numberOfLines={1}>DROPOFF: {item.dropoff_address}</Text>
            </View>
          </View>

          {/* Footer: Status, Role & Price */}
          <View style={styles.cardBottomRow}>
            <View style={styles.statusGroup}>
              <View style={[styles.statusBadge, { backgroundColor: color }]}>
                <StatusIcon size={10} color={colors.surface} strokeWidth={3} />
                <Text style={styles.statusLabelText}>{item.status.toUpperCase()}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: isRunner ? colors.accent : colors.secondary }]}>
                <Text style={styles.roleLabelText}>{isRunner ? 'RUNNER' : 'NOMAD'}</Text>
              </View>
            </View>
            <View style={styles.priceStrip}>
              <Text style={styles.priceLabel}>{isRunner ? 'EARNED' : 'PAID'}</Text>
              <Text style={styles.priceValue}>₦{displayAmount.toLocaleString()}</Text>
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
        <Text style={styles.headerTitle}>Errand History</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.flex1}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching your history...</Text>
          </View>
        ) : wakas.length > 0 ? (
          <FlatList
            data={wakas}
            keyExtractor={item => item.id}
            renderItem={renderWaka}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.centered}>
            <Package size={48} color={colors.muted} strokeWidth={1} />
            <Text style={styles.emptyTitle}>No Errands Yet</Text>
            <Text style={styles.emptySub}>Your errand history will appear here once you post your first SendAm.</Text>
            <TouchableOpacity 
              style={styles.ctaBtn}
              onPress={() => router.push('/new-errand')}
            >
              <Text style={styles.ctaBtnText}>POST AN ERRAND</Text>
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
  headerTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 22,
    color: colors.text,
  },
  listContent: {
    padding: DT.spacing.lg,
    paddingBottom: 40,
  },
  card: {
    marginBottom: DT.spacing.lg,
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
  dateText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 10,
    color: colors.muted,
  },
  itemTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  detailsGrid: {
    gap: 6,
    marginBottom: 12,
    backgroundColor: colors.background,
    padding: 8,
    borderWidth: 1.5,
    borderColor: colors.text + '20',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    borderTopWidth: 1.5,
    borderTopColor: colors.text + '10',
    paddingTop: 10,
  },
  statusGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: colors.text,
    gap: 4,
  },
  statusLabelText: {
    fontFamily: DT.typography.heading,
    fontSize: 9,
    color: colors.surface,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  roleLabelText: {
    fontFamily: DT.typography.heading,
    fontSize: 9,
    color: colors.surface,
  },
  priceStrip: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 8,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  priceValue: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.secondary,
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
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 30,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.text,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  ctaBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.surface,
  },
});
