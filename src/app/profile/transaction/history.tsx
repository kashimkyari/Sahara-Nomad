import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { DesignTokens as DT } from '../../../constants/design';
import { useTheme } from '../../../hooks/use-theme';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../constants/api';
import { useFocusEffect } from 'expo-router';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  created_at: string;
  is_completed: boolean;
  reference: string;
}

export default function TransactionHistoryScreen() {
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const router = useRouter();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const res = await fetch(API.WALLET.TRANSACTIONS(user.id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTxns(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch history:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchHistory();
    }, [user, token])
  );

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {txns.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No transactions yet.</Text>
            </View>
          ) : (
            txns.map((tx) => {
              const isPositive = tx.type.includes('fund') || tx.type.includes('refund');
              const dateObj = new Date(tx.created_at);
              const dateLabel = dateObj.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
              const yearLabel = dateObj.getFullYear();
              
              let label = tx.type.replace(/_/g, ' ').toUpperCase();
              if (tx.type === 'fund_bank') label = 'BANK TOP-UP';
              if (tx.type === 'fund_card') label = 'CARD TOP-UP';
              if (tx.type === 'waka_payment') label = 'ERRAND PAYMENT';

              return (
                <TouchableOpacity 
                  key={tx.id} 
                  style={styles.txRow}
                  onPress={() => router.push(`/profile/transaction/${tx.id}` as any)}
                >
                  <View style={styles.txMain}>
                    <Text style={styles.txLabel}>{label}</Text>
                    <Text style={styles.txDate}>{dateLabel}, {yearLabel} · {tx.reference.slice(0, 10)}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: isPositive ? colors.secondary : colors.text }]}>
                    {isPositive ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.md,
    borderBottomWidth: 2, borderBottomColor: colors.text,
  },
  backBtn: {
    width: 40, height: 40, borderWidth: 2, borderColor: colors.text,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 20, color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 40 },
  txRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: DT.spacing.md,
    borderBottomWidth: 2, borderBottomColor: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: DT.spacing.md,
    marginBottom: DT.spacing.md,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  txMain: { flex: 1 },
  txLabel: { fontFamily: DT.typography.heading, fontSize: 14, color: colors.text },
  txDate: { fontFamily: DT.typography.body, fontSize: 12, color: colors.muted },
  txAmount: { fontFamily: DT.typography.heading, fontSize: 15 },
  emptyBox: { 
    padding: DT.spacing.xl, 
    borderWidth: 2, 
    borderColor: colors.text, 
    borderStyle: 'dashed', 
    alignItems: 'center' 
  },
  emptyText: { fontFamily: DT.typography.body, color: colors.muted },
});
