import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

const rules = [
  { title: 'Seller (Runner) Code of Conduct', body: 'Runners must be punctual, honest with pricing, and provide photographic evidence of items sourced. Any form of price inflation or fraud leads to permanent account ban.' },
  { title: 'Buyer Responsibilities', body: 'Buyers must provide accurate market names and item descriptions. Price caps must be reasonable. Cancelling after a runner has purchased is prohibited.' },
  { title: 'Escrow & Payment Protection', body: 'All funds are held in escrow until the buyer confirms delivery. Disputes are resolved by the Sendam team within 48 hours.' },
  { title: 'Dispute Resolution', body: 'If you have a dispute, submit it via the Support screen within 24 hours of delivery. Provide photos and a description of the issue.' },
  { title: 'Prohibited Items', body: 'Alcohol, tobacco, weapons, controlled substances, and counterfeit goods cannot be sourced through Sendam. Violations result in immediate ban.' },
];

export default function SafetyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(0);
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trust & Safety</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Trust badge */}
        <View style={styles.trustBanner}>
          <ShieldCheck size={28} color={colors.secondary} strokeWidth={2.5} />
          <View style={styles.trustText}>
            <Text style={styles.trustTitle}>Sendam Verified Network</Text>
            <Text style={styles.trustSub}>All runners pass BVN verification and address checks before going live.</Text>
          </View>
        </View>

        {/* Safety score */}
        <View style={styles.scoreRow}>
          {[
            { label: 'BVN Verified', checked: true },
            { label: 'ID Checked', checked: true },
            { label: 'Phone Verified', checked: true },
          ].map((item) => (
            <View key={item.label} style={styles.scoreItem}>
              <View style={[styles.scoreCheck, item.checked && styles.scoreCheckActive]}>
                <Text style={styles.scoreCheckMark}>{item.checked ? '✓' : '—'}</Text>
              </View>
              <Text style={styles.scoreLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>PLATFORM RULES</Text>

        {rules.map((rule, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.accordion, expanded === i && styles.accordionOpen]}
            onPress={() => setExpanded(expanded === i ? null : i)}
          >
            <View style={styles.accordionHeader}>
              <Text style={styles.accordionTitle}>{rule.title}</Text>
              {expanded === i
                ? <ChevronUp size={18} color={colors.text} strokeWidth={2.5} />
                : <ChevronDown size={18} color={colors.text} strokeWidth={2.5} />}
            </View>
            {expanded === i && (
              <Text style={styles.accordionBody}>{rule.body}</Text>
            )}
          </TouchableOpacity>
        ))}
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
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 20, color: colors.text },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 40 },
  trustBanner: {
    flexDirection: 'row', gap: DT.spacing.md, alignItems: 'flex-start',
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.secondary,
    padding: DT.spacing.md, marginBottom: DT.spacing.md,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  trustText: { flex: 1 },
  trustTitle: { fontFamily: DT.typography.heading, fontSize: 15, color: colors.text },
  trustSub: { fontFamily: DT.typography.body, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 18 },
  scoreRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: DT.spacing.lg,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.text,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  scoreItem: { flex: 1, alignItems: 'center', paddingVertical: DT.spacing.md },
  scoreCheck: {
    width: 32, height: 32, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  scoreCheckActive: { backgroundColor: colors.secondary },
  scoreCheckMark: { fontFamily: DT.typography.heading, fontSize: 14, color: colors.surface },
  scoreLabel: { fontFamily: DT.typography.body, fontSize: 11, color: colors.muted, textAlign: 'center' as const },
  sectionLabel: {
    fontFamily: DT.typography.heading, fontSize: 11, color: colors.muted,
    letterSpacing: 1.5, marginBottom: DT.spacing.md,
  },
  accordion: {
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
    marginBottom: DT.spacing.md, padding: DT.spacing.md,
    shadowColor: colors.text, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  accordionOpen: { borderColor: colors.primary },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accordionTitle: { fontFamily: DT.typography.heading, fontSize: 14, color: colors.text, flex: 1, marginRight: DT.spacing.sm },
  accordionBody: {
    fontFamily: DT.typography.body, fontSize: 13, color: colors.muted,
    lineHeight: 20, marginTop: DT.spacing.md,
  },
});
