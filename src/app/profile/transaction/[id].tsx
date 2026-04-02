import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ArrowDownLeft, ArrowUpRight, Share2 } from 'lucide-react-native';
import { DesignTokens as DT } from '../../../constants/design';
import { useTheme } from '../../../hooks/use-theme';

type TxType = { label: string; amount: string; date: string; time: string; ref: string; positive: boolean; status: string; method: string; description: string };

const txData: Record<string, TxType> = {
  '0': { label: 'Waka — Mile 12 Run', amount: '₦2,500', date: 'Today', time: '12:45 PM', ref: 'TXN20240401001', positive: false, status: 'Successful', method: 'Sendam Wallet', description: 'Runner fee paid to Chinedu O. for sourcing 2 baskets of tomatoes and pepper at Mile 12 Market.' },
  '1': { label: 'Wallet Top-up', amount: '₦10,000', date: 'Yesterday', time: '09:12 AM', ref: 'TXN20240331001', positive: true, status: 'Successful', method: 'Kuda Bank Transfer', description: 'Wallet funded via bank transfer from Kuda Bank account ending 4521.' },
  '2': { label: 'Waka — Shoprite Lekki', amount: '₦3,000', date: 'Mon, Apr 30', time: '3:22 PM', ref: 'TXN20240401002', positive: false, status: 'Successful', method: 'Sendam Wallet', description: 'Runner fee paid to Amina B. for grocery shopping at Shoprite Lekki Phase 1.' },
};

export default function TransactionDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tx = txData[id as string] ?? txData['0'];
  const styles = getStyles(colors);

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
        <View style={[styles.amountHero, { backgroundColor: tx.positive ? colors.secondary : colors.primary }]}>
          <View style={styles.arrowCircle}>
            {tx.positive
              ? <ArrowDownLeft size={28} color={colors.secondary} strokeWidth={2.5} />
              : <ArrowUpRight size={28} color={colors.primary} strokeWidth={2.5} />}
          </View>
          <Text style={styles.heroAmount}>{tx.positive ? '+' : '-'}{tx.amount}</Text>
          <Text style={styles.heroLabel}>{tx.label}</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{tx.status}</Text>
          </View>
        </View>

        {/* Details card */}
        <Text style={styles.sectionLabel}>TRANSACTION DETAILS</Text>
        <View style={styles.detailCard}>
          {[
            { label: 'Reference', value: tx.ref },
            { label: 'Date', value: tx.date },
            { label: 'Time', value: tx.time },
            { label: 'Method', value: tx.method },
            { label: 'Status', value: tx.status },
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
        <Text style={styles.sectionLabel}>DESCRIPTION</Text>
        <View style={styles.descCard}>
          <Text style={styles.descText}>{tx.description}</Text>
        </View>

        {/* Actions */}
        {!tx.positive && (
          <TouchableOpacity style={styles.disputeBtn}>
            <Text style={styles.disputeText}>Raise a Dispute</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
