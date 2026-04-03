import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Phone, MessageCircle, Clock } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { MotiView } from 'moti';

const SUPPORT_PHONE = '+2348135964992';
const WHATSAPP_LINK = `https://wa.me/2348135964992`;

export default function CallSupportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = getStyles(colors);

  const handleCall = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`);
  };

  const handleWhatsApp = () => {
    Linking.openURL(WHATSAPP_LINK);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={3} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phone Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        >
          <Text style={styles.sectionLabel}>DIRECT CALL</Text>
          <View style={styles.contactCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
              <Phone size={24} color={colors.surface} strokeWidth={2.5} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>Official Support Line</Text>
              <Text style={styles.cardValue}>{SUPPORT_PHONE}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Text style={styles.callBtnText}>CALL NOW</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>SEND A MESSAGE</Text>
          <TouchableOpacity style={styles.whatsappCard} onPress={handleWhatsApp}>
            <View style={[styles.iconBox, { backgroundColor: '#25D366' }]}>
              <MessageCircle size={24} color={colors.surface} strokeWidth={2.5} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>WhatsApp Support</Text>
              <Text style={styles.cardValue}>Instant Chat</Text>
            </View>
            <ChevronLeft size={20} color={colors.muted} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <View style={styles.hoursBox}>
            <View style={styles.hoursHeader}>
              <Clock size={18} color={colors.text} strokeWidth={2.5} />
              <Text style={styles.hoursTitle}>SERVICE HOURS</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.dayText}>Monday – Friday</Text>
              <Text style={styles.timeText}>09:00 AM – 06:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.dayText}>Saturday</Text>
              <Text style={styles.timeText}>10:00 AM – 04:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.dayText}>Sunday</Text>
              <Text style={styles.timeText}>Closed</Text>
            </View>
          </View>
          
          <Text style={styles.disclaimer}>
            Calls are charged at standard network rates. For 24/7 assistance, please use our Live Support feature.
          </Text>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.md,
    borderBottomWidth: 3, borderBottomColor: colors.text,
  },
  backBtn: {
    width: 44, height: 44, borderWidth: 3, borderColor: colors.text,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.text },
  scroll: { padding: DT.spacing.lg, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: DT.typography.heading, fontSize: 11, color: colors.muted,
    letterSpacing: 1.5, marginBottom: DT.spacing.md,
  },
  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md,
    borderWidth: 3, borderColor: colors.text, backgroundColor: colors.surface,
    padding: DT.spacing.md, marginBottom: DT.spacing.md,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  whatsappCard: {
    flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md,
    borderWidth: 3, borderColor: colors.text, backgroundColor: colors.surface,
    padding: DT.spacing.md, marginBottom: DT.spacing.md,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  iconBox: {
    width: 50, height: 50, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardLabel: { fontFamily: DT.typography.bodySemiBold, fontSize: 12, color: colors.muted },
  cardValue: { fontFamily: DT.typography.heading, fontSize: 16, color: colors.text, marginTop: 2 },
  callBtn: {
    backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.text,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  callBtnText: { fontFamily: DT.typography.heading, fontSize: 11, color: colors.surface },
  hoursBox: {
    borderWidth: 3, borderColor: colors.text, backgroundColor: colors.background,
    padding: DT.spacing.lg, marginTop: DT.spacing.xl,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
  },
  hoursHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: DT.spacing.md },
  hoursTitle: { fontFamily: DT.typography.heading, fontSize: 14, color: colors.text },
  hoursRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dayText: { fontFamily: DT.typography.bodySemiBold, fontSize: 13, color: colors.text },
  timeText: { fontFamily: DT.typography.body, fontSize: 13, color: colors.muted },
  disclaimer: {
    fontFamily: DT.typography.body, fontSize: 12, color: colors.muted,
    textAlign: 'center', marginTop: DT.spacing.xl, lineHeight: 18,
  },
});
