import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Package, Zap, MapPin, ArrowRight } from 'lucide-react-native';
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

  const renderWaka = ({ item, index }: { item: any, index: number }) => {
    return (
      <MotiView 
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 100 }}
        style={styles.card}
      >
        <TouchableOpacity 
          style={styles.cardInner}
          onPress={() => router.push(`/waka/${item.id}` as any)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>NEW TASK</Text>
            </View>
            <Text style={styles.priceText}>₦{item.total_price.toLocaleString()}</Text>
          </View>

          <Text style={styles.itemDesc} numberOfLines={2}>{item.item_description}</Text>

          <View style={styles.cardFooter}>
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.muted} />
              <Text style={styles.locationText}>{item.pickup_address || 'Nearby pickup'}</Text>
            </View>
            <View style={styles.actionBtn}>
              <Text style={styles.actionText}>VIEW DETAILS</Text>
              <ArrowRight size={16} color={colors.text} />
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
          <Text style={styles.headerSubtitle}>{wakas.length} tasks matching your area</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.flex1}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Scouting for errands...</Text>
          </View>
        ) : wakas.length > 0 ? (
          <FlatList
            data={wakas}
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
            <Text style={styles.emptySub}>There are no new errands available right now. We'll alert you when something comes up.</Text>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: colors.text,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text,
  },
  liveText: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.text,
    letterSpacing: 1,
  },
  priceText: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
  },
  itemDesc: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
    minHeight: 44,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: colors.text + '20',
    paddingTop: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.muted,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: colors.text,
  },
  actionText: {
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
