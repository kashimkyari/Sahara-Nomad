import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, CheckCircle2, AlertTriangle, Info, ArrowRight, ExternalLink } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

const notificationData: Record<string, { title: string; body: string; time: string; date: string; type: 'success' | 'warning' | 'info'; sender: string; wakaId?: string }> = {
  '1': { 
    title: 'Runner Accepted', 
    body: 'Chinedu O. has accepted your errand to Mile 12 Market. He is currently at Ketu and moving towards the market area.\n\nHe will provide photos of the items once he arrives at the stall. You can chat with him directly if you need to add more items or give specific instructions.', 
    time: '10:15 AM', 
    date: 'Today, Oct 12',
    type: 'success',
    sender: 'Sendam System',
    wakaId: 'w1'
  },
  '2': { 
    title: 'Payment Confirmed', 
    body: 'Your wallet has been credited with ₦10,000 via Bank Transfer (Kuda MFB).\n\nTransaction ID: TRN-98234-AX\nReference: Wallet Top-up\n\nYou can now use these funds to broadcast new wakas or pay for active errands.', 
    time: '08:30 AM', 
    date: 'Today, Oct 12',
    type: 'info',
    sender: 'Finance Dept'
  },
  '3': { 
    title: 'Dispute Resolved', 
    body: 'The dispute you raised for the "Sourcing Tomatoes" waka has been resolved in your favor.\n\nThe escrowed funds (₦3,500) have been returned to your wallet. We apologize for the inconvenience caused by the runner.', 
    time: '04:45 PM', 
    date: 'Yesterday, Oct 11',
    type: 'success',
    sender: 'Support Team',
    wakaId: 'w1'
  },
  '4': { 
    title: 'Price Alert', 
    body: 'Due to heavy rainfall in the Lagos area, runner availability is limited and market prices for produce are currently spiking.\n\nWe recommend setting higher price caps for urgent errands to ensure faster acceptance by runners.', 
    time: '09:00 AM', 
    date: 'Oct 10',
    type: 'warning',
    sender: 'Market Ops'
  },
};

export default function NotificationDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = getStyles(colors);

  const note = notificationData[id as string] || notificationData['1'];

  const getTypeIcon = (type: string, color: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={32} color={color} strokeWidth={2.5} />;
      case 'warning': return <AlertTriangle size={32} color={color} strokeWidth={2.5} />;
      case 'info':
      default: return <Info size={32} color={color} strokeWidth={2.5} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Alert Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.iconBox, { backgroundColor: note.type === 'warning' ? colors.accent : colors.primary }]}>
            {getTypeIcon(note.type, note.type === 'warning' ? colors.text : colors.surface)}
          </View>
          <Text style={styles.title}>{note.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{note.date} · {note.time}</Text>
            <View style={styles.dot} />
            <Text style={styles.metaLabel}>from {note.sender}</Text>
          </View>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.body}>{note.body}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryAction}
            onPress={() => {
              if (note.title.includes('Runner') && note.wakaId) router.push(`/waka/${note.wakaId}` as any);
              else if (note.title.includes('Payment')) router.push('/profile/payment' as any);
              else if (note.title.includes('Dispute')) router.push('/profile/support' as any);
              else router.back();
            }}
          >
            <Text style={styles.primaryActionText}>
              {note.title.includes('Runner') ? 'Track Errand' : 
               note.title.includes('Payment') ? 'View Wallet' : 
               note.title.includes('Dispute') ? 'View Support' : 'Go Back'}
            </Text>
            <ArrowRight size={20} color={colors.surface} strokeWidth={2.5} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryAction}
            onPress={() => router.push('/profile/support' as any)}
          >
            <ExternalLink size={18} color={colors.text} strokeWidth={2.5} />
            <Text style={styles.secondaryActionText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
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
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.xl, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: DT.spacing.xl },
  iconBox: {
    width: 72, height: 72, borderWidth: 3, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center', marginBottom: DT.spacing.md,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6,
  },
  title: { fontFamily: DT.typography.heading, fontSize: 28, color: colors.text, textAlign: 'center', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaLabel: { fontFamily: DT.typography.body, fontSize: 13, color: colors.muted },
  dot: { width: 4, height: 4, backgroundColor: colors.muted, borderRadius: 0 },
  contentCard: {
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.text,
    padding: DT.spacing.lg, marginBottom: DT.spacing.xl,
    shadowColor: colors.text, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  body: { fontFamily: DT.typography.body, fontSize: 16, color: colors.text, lineHeight: 26 },
  actions: { gap: DT.spacing.md },
  primaryAction: {
    height: 56, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.text,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  primaryActionText: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.surface },
  secondaryAction: {
    height: 56, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.text,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  secondaryActionText: { fontFamily: DT.typography.heading, fontSize: 16, color: colors.text },
});
