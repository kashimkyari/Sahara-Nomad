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
        <View style={styles.receiptContainer}>
          <View style={styles.receiptHeader}>
            <View style={[styles.iconPill, { backgroundColor: note.type === 'warning' ? colors.accent : colors.primary }]}>
              {getTypeIcon(note.type, note.type === 'warning' ? colors.text : colors.surface)}
              <Text style={[styles.iconPillText, { color: note.type === 'warning' ? colors.text : colors.surface }]}>
                {note.type.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.receiptTitle} numberOfLines={2}>{note.title.toUpperCase()}</Text>
          
          <View style={styles.receiptDivider} />
          
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>DATE</Text>
            <Text style={styles.metaValue}>{note.date}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>TIME</Text>
            <Text style={styles.metaValue}>{note.time}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>FROM</Text>
            <Text style={styles.metaValue}>{note.sender}</Text>
          </View>

          <View style={styles.receiptDivider} />

          <Text style={styles.body}>{note.body}</Text>
          
          <View style={styles.receiptDivider} />
          <Text style={styles.barcodeText}>||| ||||| || ||| || ||</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryAction}
            onPress={() => {
              if (note.title.includes('Runner') && note.wakaId) router.push(`/waka/${note.wakaId}` as any);
              else if (note.title.includes('Payment')) router.push('/profile/settings' as any);
              else if (note.title.includes('Dispute')) router.push('/profile/support' as any);
              else router.back();
            }}
          >
            <Text style={styles.primaryActionText}>
              {note.title.includes('Runner') ? 'TRACK ERRAND' : 
               note.title.includes('Payment') ? 'VIEW WALLET' : 
               note.title.includes('Dispute') ? 'VIEW SUPPORT' : 'ACKNOWLEDGE'}
            </Text>
            <ArrowRight size={24} color={colors.surface} strokeWidth={3} />
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
  },
  backBtn: {
    width: 44, height: 44, borderWidth: 3, borderColor: colors.text,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 24, color: colors.text, textTransform: 'uppercase' },
  
  scroll: { paddingHorizontal: DT.spacing.md, paddingTop: DT.spacing.md, paddingBottom: 60 },
  
  receiptContainer: {
    backgroundColor: '#FFFDEB',
    borderWidth: 3,
    borderColor: colors.text,
    borderStyle: 'dashed',
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginBottom: 32,
    shadowColor: colors.text,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 3,
    borderColor: colors.text,
    gap: 8,
    transform: [{ rotate: '-2deg' }]
  },
  iconPillText: {
    fontFamily: DT.typography.heading, fontSize: 16, letterSpacing: 1,
  },
  receiptTitle: { 
    fontFamily: DT.typography.heading, 
    fontSize: 32, 
    lineHeight: 34,
    color: colors.text, 
    textAlign: 'center',
    marginBottom: 24,
  },
  receiptDivider: {
    height: 3,
    backgroundColor: colors.text,
    width: '100%',
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaLabel: { 
    fontFamily: DT.typography.heading, 
    fontSize: 14, 
    color: colors.muted,
  },
  metaValue: { 
    fontFamily: DT.typography.bodySemiBold, 
    fontSize: 15, 
    color: colors.text,
  },
  body: { 
    fontFamily: DT.typography.body, 
    fontSize: 17, 
    color: colors.text, 
    lineHeight: 28,
    marginBottom: 12,
  },
  barcodeText: {
    fontFamily: DT.typography.heading,
    fontSize: 24,
    letterSpacing: 6,
    color: colors.text,
    textAlign: 'center',
    opacity: 0.8,
  },
  
  actions: { paddingHorizontal: 16 },
  primaryAction: {
    height: 64, backgroundColor: colors.text, borderWidth: 3, borderColor: colors.text,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: colors.text, shadowOffset: { width: -4, height: -4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  primaryActionText: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.surface },
});
