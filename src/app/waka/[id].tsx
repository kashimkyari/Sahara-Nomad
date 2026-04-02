import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MapPin, Phone, MessageCircle, CheckCircle2, Truck, Clock } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

const wakaData: Record<string, {
  title: string;
  market: string;
  delivery: string;
  status: string;
  step: number;
  fee: string;
  runner: { name: string; phone: string; img: string; rating: number };
  items: string;
}> = {
  w1: {
    title: 'Sourcing Tomatoes at Mile 12',
    market: 'Mile 12 Market, Lagos',
    delivery: '15 Awolowo Road, Ikoyi',
    status: 'Runner en-route to market',
    step: 2,
    fee: '₦2,500',
    runner: { name: 'Chinedu O.', phone: '+234 812 000 0001', img: 'https://i.pravatar.cc/150?u=chinedu', rating: 4.9 },
    items: '2 baskets of fresh tomatoes, 1 bag of pepper',
  },
  w2: {
    title: 'Groceries from Shoprite Lekki',
    market: 'Shoprite, Lekki',
    delivery: '4 Admiralty Way, Lekki Phase 1',
    status: 'Waiting for runner to accept',
    step: 1,
    fee: '₦3,000',
    runner: { name: 'Unassigned', phone: '', img: '', rating: 0 },
    items: 'Full grocery list - rice, oil, tomatoes, onions',
  },
};

const STEPS = [
  { icon: CheckCircle2, label: 'Broadcast' },
  { icon: Truck, label: 'En-Route' },
  { icon: MapPin, label: 'Sourcing' },
  { icon: CheckCircle2, label: 'Delivered' },
];

export default function WakaStatusScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const waka = wakaData[id as string] ?? wakaData.w1;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const styles = getStyles(colors);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Waka Status</Text>
        <Animated.View style={[styles.livePill, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.liveText}>LIVE</Text>
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <Clock size={18} color={colors.text} strokeWidth={2.5} />
          <Text style={styles.statusText}>{waka.status}</Text>
        </View>

        {/* Progress Stepper */}
        <View style={styles.stepperRow}>
          {STEPS.map((s, i) => {
            const active = i < waka.step;
            const current = i === waka.step - 1;
            return (
              <View key={s.label} style={styles.stepItem}>
                <View style={[styles.stepCircle, active && styles.stepCircleActive, current && styles.stepCircleCurrent]}>
                  <s.icon size={14} color={active ? colors.surface : colors.muted} strokeWidth={2.5} />
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{s.label}</Text>
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, active && styles.stepLineActive]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Waka Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{waka.title}</Text>
          <View style={styles.infoRow}>
            <MapPin size={14} color={colors.primary} />
            <Text style={styles.infoText}>{waka.market}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={14} color={colors.secondary} />
            <Text style={styles.infoText}>{waka.delivery}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.itemsLabel}>Items</Text>
          <Text style={styles.itemsText}>{waka.items}</Text>
          <View style={styles.divider} />
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Runner's Fee</Text>
            <View style={styles.feeTag}>
              <Text style={styles.feeTagText}>{waka.fee}</Text>
            </View>
          </View>
        </View>

        {/* Runner Card */}
        {waka.runner.img ? (
          <View style={styles.runnerCard}>
            <Image source={{ uri: waka.runner.img }} style={styles.runnerAvatar} />
            <View style={styles.runnerInfo}>
              <Text style={styles.runnerName}>{waka.runner.name}</Text>
              <Text style={styles.runnerRating}>★ {waka.runner.rating} · Your runner</Text>
            </View>
            <View style={styles.runnerActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <MessageCircle size={18} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]}>
                <Phone size={18} color={colors.surface} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.runnerCard}>
            <View style={styles.noRunnerBox}>
              <Text style={styles.noRunnerEmoji}>⏳</Text>
            </View>
            <View style={styles.runnerInfo}>
              <Text style={styles.runnerName}>Finding runner…</Text>
              <Text style={styles.runnerRating}>Broadcast active nearby</Text>
            </View>
          </View>
        )}

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel Waka</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
    backgroundColor: colors.background,
    gap: DT.spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
    color: colors.text,
    flex: 1,
  },
  livePill: {
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveText: {
    fontFamily: DT.typography.heading,
    fontSize: 11,
    color: colors.surface,
    letterSpacing: 1,
  },
  scroll: {
    paddingHorizontal: DT.spacing.lg,
    paddingBottom: DT.spacing.xl,
    paddingTop: DT.spacing.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DT.spacing.sm,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.md,
    marginBottom: DT.spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statusText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DT.spacing.lg,
    position: 'relative',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.muted,
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontFamily: DT.typography.body,
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.text,
    fontFamily: DT.typography.bodySemiBold,
  },
  stepLine: {
    position: 'absolute',
    top: 15,
    left: '55%',
    right: '-55%',
    height: 2,
    backgroundColor: colors.muted,
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.md,
    marginBottom: DT.spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  cardTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 17,
    color: colors.text,
    marginBottom: DT.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DT.spacing.sm,
    marginBottom: 6,
  },
  infoText: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  divider: {
    height: 2,
    backgroundColor: colors.text,
    marginVertical: DT.spacing.md,
  },
  itemsLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  itemsText: {
    fontFamily: DT.typography.body,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 14,
    color: colors.text,
  },
  feeTag: {
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: 10,
    paddingVertical: 3,
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  feeTagText: {
    fontFamily: DT.typography.heading,
    fontSize: 15,
    color: colors.text,
  },
  runnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.md,
    marginBottom: DT.spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
    gap: DT.spacing.md,
  },
  runnerAvatar: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderColor: colors.text,
  },
  noRunnerBox: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noRunnerEmoji: { fontSize: 24 },
  runnerInfo: { flex: 1 },
  runnerName: {
    fontFamily: DT.typography.heading,
    fontSize: 15,
    color: colors.text,
  },
  runnerRating: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  runnerActions: {
    flexDirection: 'row',
    gap: DT.spacing.sm,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  cancelBtn: {
    height: 48,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: DT.typography.heading,
    fontSize: 15,
    color: colors.error,
  },
});
