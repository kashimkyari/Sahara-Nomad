import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ArrowDownLeft, ArrowUpRight, Share2 } from 'lucide-react-native';
import { DesignTokens as DT } from '../../../constants/design';
import { useTheme } from '../../../hooks/use-theme';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../constants/api';
import { ActivityIndicator } from 'react-native';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  reference: string;
  is_completed: boolean;
  created_at: string;
  previous_balance: number;
  new_balance: number;
}

export default function TransactionDetailScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [txn, setTxn] = React.useState<Transaction | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    const fetchTxn = async () => {
      try {
        const res = await fetch(API.WALLET.TRANSACTION_DETAIL(id), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setTxn(await res.json());
        }
      } catch (e) {
        console.error('Failed to fetch transaction:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTxn();
  }, [id, token]);

  const styles = getStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!txn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={{ fontFamily: DT.typography.heading, color: colors.text }}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPositive = txn.type.includes('fund') || txn.type.includes('refund');
  const dateStr = new Date(txn.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = new Date(txn.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  
  let label = txn.type.replace(/_/g, ' ').toUpperCase();
  if (txn.type === 'fund_bank') label = 'BANK TOP-UP';
  if (txn.type === 'fund_card') label = 'CARD TOP-UP';
  if (txn.type === 'waka_payment') label = 'ERRAND PAYMENT';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Share2 size={18} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Amount hero */}
        <View style={[styles.amountHero, { backgroundColor: isPositive ? colors.secondary : colors.primary }]}>
          <View style={styles.arrowCircle}>
            {isPositive
              ? <ArrowDownLeft size={28} color={colors.secondary} strokeWidth={2.5} />
              : <ArrowUpRight size={28} color={colors.primary} strokeWidth={2.5} />}
          </View>
          <Text style={styles.heroAmount}>{isPositive ? '+' : '-'}₦{Number(txn.amount).toLocaleString()}</Text>
          <Text style={styles.heroLabel}>{label}</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{txn.is_completed ? 'SUCCESSFUL' : 'PENDING'}</Text>
          </View>
        </View>

        {/* Details card */}
        <Text style={styles.sectionLabel}>TRANSACTION DETAILS</Text>
        <View style={styles.detailCard}>
          {[
            { label: 'Reference', value: txn.reference },
            { label: 'Date', value: dateStr },
            { label: 'Time', value: timeStr },
            { label: 'Type', value: label },
            { label: 'Status', value: txn.is_completed ? 'Completed' : 'Pending' },
          ].map((row, i, arr) => (
            <View key={row.label}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={[styles.detailValue, row.label === 'Status' && { color: colors.secondary }]}>
                  {row.value}
                </Text>
              </View>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.sectionLabel}>AUDIT TRAIL</Text>
        <View style={styles.descCard}>
          <Text style={styles.descText}>
            Previous Balance: ₦{Number(txn.previous_balance).toLocaleString()}{'\n'}
            New Balance: ₦{Number(txn.new_balance).toLocaleString()}
          </Text>
        </View>

        {/* Actions */}
        {!isPositive && (
          <TouchableOpacity 
            style={styles.disputeBtn}
            onPress={() => router.push({ pathname: '/dispute/create', params: { txnId: txn.reference } } as any)}
          >
            <Text style={styles.disputeText}>Raise a Dispute</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.md,
    borderBottomWidth: 2, borderBottomColor: colors.text,
  },
  backBtn: {
    width: 40, height: 40, borderWidth: 2, borderColor: colors.text,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  shareBtn: {
    width: 40, height: 40, borderWidth: 2, borderColor: colors.text,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 20, color: colors.text },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.md, paddingBottom: 40 },
  amountHero: {
    alignItems: 'center', padding: DT.spacing.xl, marginBottom: DT.spacing.lg,
    borderWidth: 2, borderColor: colors.text, gap: DT.spacing.sm,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  arrowCircle: {
    width: 56, height: 56, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
  },
  heroAmount: { fontFamily: DT.typography.heading, fontSize: 40, color: colors.surface },
  heroLabel: { fontFamily: DT.typography.body, fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  heroBadge: {
    backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.text,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  heroBadgeText: { fontFamily: DT.typography.heading, fontSize: 11, color: colors.text, letterSpacing: 1 },
  sectionLabel: {
    fontFamily: DT.typography.heading, fontSize: 11, color: colors.muted,
    letterSpacing: 1.5, marginBottom: DT.spacing.md,
  },
  detailCard: {
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface, marginBottom: DT.spacing.lg,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', padding: DT.spacing.md },
  detailLabel: { fontFamily: DT.typography.body, fontSize: 13, color: colors.muted },
  detailValue: { fontFamily: DT.typography.bodySemiBold, fontSize: 13, color: colors.text },
  divider: { height: 2, backgroundColor: colors.text },
  descCard: {
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface, padding: DT.spacing.md,
    marginBottom: DT.spacing.lg,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  descText: { fontFamily: DT.typography.body, fontSize: 14, color: colors.text, lineHeight: 22 },
  disputeBtn: {
    height: 48, borderWidth: 2, borderColor: colors.error, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  disputeText: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.error },
});
