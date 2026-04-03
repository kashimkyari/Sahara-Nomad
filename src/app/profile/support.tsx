import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, MessageSquare, Phone, Mail } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
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
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const styles = getStyles(colors);

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
          { icon: Phone, label: 'Call Support', sub: '9am – 6pm Mon–Sat', color: colors.secondary },
          { icon: Mail, label: 'Email Us', sub: 'support@sendam.ng', color: colors.accent },
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

        {/* Contact form */}
        <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>SEND A TICKET</Text>
        <TextInput
          style={styles.input}
          placeholder="Subject"
          placeholderTextColor={colors.muted}
          value={subject}
          onChangeText={setSubject}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your issue in detail..."
          placeholderTextColor={colors.muted}
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>Submit Ticket</Text>
        </TouchableOpacity>
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
  input: {
    height: 48, borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
    paddingHorizontal: DT.spacing.md, fontFamily: DT.typography.body, fontSize: 15,
    color: colors.text, marginBottom: DT.spacing.md,
  },
  textArea: { height: 120, paddingTop: DT.spacing.md, textAlignVertical: 'top' },
  submitBtn: {
    height: 56, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  submitBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: colors.surface },
});
