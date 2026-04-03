import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Mail, MessageSquare, Phone } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignTokens as DT } from '../../constants/design';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/use-theme';

const faqs = [
  { q: 'How do I cancel a waka?', a: 'Open the active waka from your Home screen and tap "Cancel Waka". Cancellations are free before a runner accepts. After acceptance, a ₦500 cancellation fee applies.' },
  { q: 'What if the runner buys the wrong item?', a: 'Take a photo, tap "Raise Dispute" on the waka status screen, and our team will mediate within 24 hours. Funds stay in escrow until resolved.' },
  { q: 'How long does delivery take?', a: 'Typically 1–3 hours depending on market distance and traffic. You can track your runner in real time on the waka status screen.' },
  { q: 'Are there weight or size limits?', a: 'Runners use personal transport (bikes/keke). Items over 50kg or requiring a van need to be arranged separately via the custom errand option.' },
  { q: 'How do I become a runner?', a: 'Tap "Become a Runner" in your profile settings. You will need to complete BVN verification and an address check before going live.' },
];

export default function SupportScreen() {
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const styles = getStyles(colors);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/support/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch support history', e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Contact channels */}
        <Text style={styles.sectionLabel}>REACH US</Text>
        {[
          { icon: MessageSquare, label: 'Live Support', sub: 'Avg. 3 min response', color: colors.primary, action: () => router.push('/profile/live-support' as any) },
          { icon: Phone, label: 'Call Support', sub: '9am – 6pm Mon–Sat', color: colors.secondary, action: () => router.push('/profile/call-support' as any) },
          {
            icon: Mail,
            label: 'Email Us',
            sub: 'support@sendam.ng',
            color: colors.accent,
            action: () => {
              const subject = encodeURIComponent('Support Request - SendAm');
              const body = encodeURIComponent(
                `USER INFO:\n` +
                `Name: ${user?.full_name || 'N/A'}\n` +
                `Phone: ${user?.phone_number || 'N/A'}\n` +
                `User ID: ${user?.id || 'N/A'}\n\n` +
                `DESCRIPTION:\n` +
                `[Please describe your issue here]\n`
              );
              Linking.openURL(`mailto:support@sendam.ng?subject=${subject}&body=${body}`);
            }
          },
        ].map((ch) => (
          <TouchableOpacity key={ch.label} style={styles.channelRow} onPress={ch.action}>
            <View style={[styles.channelIcon, { backgroundColor: ch.color }]}>
              <ch.icon size={20} color={colors.surface} strokeWidth={2.5} />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelLabel}>{ch.label}</Text>
              <Text style={styles.channelSub}>{ch.sub}</Text>
            </View>
            <ChevronRight size={18} color={colors.muted} />
          </TouchableOpacity>
        ))}

        {/* FAQ */}
        <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>FREQUENTLY ASKED</Text>
        {faqs.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqItem}
            onPress={() => setExpanded(expanded === i ? null : i)}
          >
            <Text style={styles.faqQ}>{faq.q}</Text>
            {expanded === i && <Text style={styles.faqA}>{faq.a}</Text>}
          </TouchableOpacity>
        ))}

        {/* Chat History */}
        <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>LIVE SUPPORT HISTORY</Text>
        {history.length > 0 ? history.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.historyCard}
            onPress={() => router.push({ pathname: '/profile/live-support', params: { ticketId: item.id } } as any)}
          >
            <View style={styles.historyHeader}>
              <Text style={styles.historyId}>Ticket #{item.id.slice(0, 5).toUpperCase()}</Text>
              <View style={[styles.statusTag, { backgroundColor: item.status === 'active' ? colors.primary : colors.secondary }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.historyMsg} numberOfLines={1}>
              {item.last_message_text || 'No messages yet'}
            </Text>
            <View style={styles.historyFooter}>
              <Text style={styles.historyDate}>
                {item.last_message_at ? new Date(item.last_message_at).toLocaleDateString() : 'Just now'}
              </Text>
              <ChevronRight size={16} color={colors.muted} />
            </View>
          </TouchableOpacity>
        )) : (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyText}>No previous support chats found.</Text>
          </View>
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
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 20, color: colors.text },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: DT.typography.heading, fontSize: 11, color: colors.muted,
    letterSpacing: 1.5, marginBottom: DT.spacing.md,
  },
  channelRow: {
    flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md,
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
    padding: DT.spacing.md, marginBottom: DT.spacing.md,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  channelIcon: {
    width: 44, height: 44, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
  },
  channelInfo: { flex: 1 },
  channelLabel: { fontFamily: DT.typography.heading, fontSize: 14, color: colors.text },
  channelSub: { fontFamily: DT.typography.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  faqItem: {
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
    padding: DT.spacing.md, marginBottom: DT.spacing.sm,
  },
  faqQ: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.text, lineHeight: 20 },
  faqA: {
    fontFamily: DT.typography.body, fontSize: 13, color: colors.muted,
    marginTop: DT.spacing.sm, lineHeight: 20,
  },
  historyCard: {
    borderWidth: 3, borderColor: colors.text, backgroundColor: colors.surface,
    padding: DT.spacing.md, marginBottom: DT.spacing.md,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyId: { fontFamily: DT.typography.heading, fontSize: 13, color: colors.text },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 2, borderColor: colors.text },
  statusText: { fontFamily: DT.typography.heading, fontSize: 10, color: colors.surface },
  historyMsg: { fontFamily: DT.typography.body, fontSize: 14, color: colors.muted, marginBottom: 12 },
  historyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { fontFamily: DT.typography.bodySemiBold, fontSize: 11, color: colors.muted },
  emptyHistory: { 
    alignItems: 'center', 
    paddingVertical: 40, 
    borderStyle: 'dashed', 
    borderWidth: 2, 
    borderColor: colors.muted,
    marginTop: 10,
  },
  emptyText: { fontFamily: DT.typography.body, fontSize: 14, color: colors.muted },
});
