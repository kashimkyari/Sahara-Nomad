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
import { ChevronLeft, Package, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { MotiView } from 'moti';

export default function WakaHistoryScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { color: colors.secondary, icon: CheckCircle2 };
      case 'cancelled': return { color: colors.error || '#FF4B4B', icon: XCircle };
      default: return { color: colors.primary, icon: Clock };
    }
  };

  const renderWaka = ({ item }: { item: any }) => {
    const { color, icon: StatusIcon } = getStatusStyle(item.status);
    const date = new Date(item.created_at).toLocaleDateString();

    return (
      <MotiView 
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={styles.card}
      >
        <TouchableOpacity 
          style={styles.cardInner}
          onPress={() => router.push(`/waka/${item.id}` as any)}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: color }]}>
              <StatusIcon size={12} color={colors.surface} strokeWidth={3} />
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.dateText}>{date}</Text>
          </View>

          <Text style={styles.itemDesc} numberOfLines={2}>{item.item_description}</Text>

          <View style={styles.cardFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>TOTAL PAID</Text>
              <Text style={styles.priceValue}>₦{item.total_price.toLocaleString()}</Text>
            </View>
            <ArrowRight size={20} color={colors.text} />
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: colors.text,
    gap: 4,
  },
  statusText: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.surface,
  },
  dateText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.muted,
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
    alignItems: 'flex-end',
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  priceContainer: {},
  priceLabel: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 10,
    color: colors.muted,
    marginBottom: 2,
  },
  priceValue: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
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
