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
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { ActivityIndicator, Alert } from 'react-native';

// Mock data removed in favor of real API calls

const STEPS = [
  { icon: CheckCircle2, label: 'Broadcast' },
  { icon: Truck, label: 'En-Route' },
  { icon: MapPin, label: 'Sourcing' },
  { icon: CheckCircle2, label: 'Delivered' },
];

export default function WakaStatusScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const { id, initialStatus } = useLocalSearchParams<{ id: string, initialStatus: string }>();
  
  const [waka, setWaka] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const styles = getStyles(colors);

  const getStatusText = (step: number, status: string) => {
    if (status === 'finding_runner') return 'Finding Runner...';
    switch (step) {
      case 1: return 'Finding Runner';
      case 2: return 'Runner en-route';
      case 3: return 'Sourcing Items';
      case 4: return 'Delivering';
      default: return status;
    }
  };

  const fetchWakaDetails = async () => {
    if (!id || !token) return;
    try {
      setLoading(true);
      const res = await fetch(API.WAKA.GET(id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Waka not found');
      const data = await res.json();
      setWaka(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWakaDetails();
  }, [id, token]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  if (loading || !waka) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{initialStatus || 'Loading Status...'}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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

        {/* Waka Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{waka.item_description}</Text>
          <View style={styles.infoRow}>
            <MapPin size={14} color={colors.primary} />
            <Text style={styles.infoText}>{waka.pickup_address}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={14} color={colors.secondary} />
            <Text style={styles.infoText}>{waka.dropoff_address}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.itemsLabel}>Category</Text>
          <Text style={[styles.itemsText, { textTransform: 'uppercase', fontFamily: DT.typography.heading }]}>
            {waka.category} Errand
          </Text>
          <View style={styles.divider} />
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Runner's Fee</Text>
            <View style={styles.feeTag}>
              <Text style={styles.feeTagText}>₦{waka.total_price.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <Clock size={18} color={colors.text} strokeWidth={2.5} />
          <Text style={styles.statusText}>{getStatusText(waka.step, waka.status)}</Text>
        </View>

        {/* Progress Stepper */}
        <View style={styles.stepperRow}>
          {STEPS.map((s, i) => {
            const active = i < waka.step;
            const current = i === waka.step - 1;
            return (
              <View key={s.label} style={styles.stepItem}>
                <View style={[styles.stepCircle, active && styles.stepCircleActive, current && styles.stepCircleCurrent]}>
                  <s.icon size={16} color={active ? colors.surface : colors.muted} strokeWidth={3} />
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{s.label}</Text>
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, active && styles.stepLineActive]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Runner Card */}
        {waka.runner_id ? (
          <View style={styles.runnerCard}>
            <View style={styles.runnerHeaderRow}>
              <Image 
                source={{ uri: `https://i.pravatar.cc/150?u=${waka.runner_id}` }} 
                style={styles.runnerAvatar} 
              />
              <View style={styles.runnerInfo}>
                <Text style={styles.runnerName}>Runner #{waka.runner_id.slice(0, 8)}</Text>
                <Text style={styles.runnerRating}>★ 4.9 · Your runner</Text>
              </View>
            </View>
            <View style={styles.runnerActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <MessageCircle size={20} color={colors.text} strokeWidth={2.5} />
                <Text style={styles.actionBtnText}>MESSAGE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]}>
                <Phone size={20} color={colors.surface} strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: colors.surface }]}>CALL</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.runnerCard}>
            <View style={styles.runnerHeaderRow}>
              <View style={styles.noRunnerBox}>
                <Text style={styles.noRunnerEmoji}>⏳</Text>
              </View>
              <View style={styles.runnerInfo}>
                <Text style={styles.runnerName}>Finding runner…</Text>
                <Text style={styles.runnerRating}>Broadcast active nearby</Text>
              </View>
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
    gap: DT.spacing.md,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.text,
    padding: DT.spacing.md,
    marginBottom: DT.spacing.xl,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statusText: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    position: 'relative',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderWidth: 3,
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
    fontFamily: DT.typography.heading,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.text,
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: '55%',
    right: '-55%',
    height: 4,
    backgroundColor: colors.border,
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.text,
    padding: DT.spacing.lg,
    marginBottom: DT.spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  cardTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 22,
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
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.text,
    padding: DT.spacing.md,
    marginBottom: DT.spacing.xl,
    shadowColor: colors.text,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
    gap: DT.spacing.md,
  },
  runnerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DT.spacing.md,
  },
  runnerAvatar: {
    width: 64,
    height: 64,
    borderWidth: 3,
    borderColor: colors.text,
  },
  noRunnerBox: {
    width: 64,
    height: 64,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noRunnerEmoji: { fontSize: 28 },
  runnerInfo: { flex: 1 },
  runnerName: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
  },
  runnerRating: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  runnerActions: {
    flexDirection: 'row',
    gap: DT.spacing.md,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  actionBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.text,
  },
  cancelBtn: {
    height: 64,
    borderWidth: 3,
    borderColor: colors.error,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    letterSpacing: 1,
    color: colors.error,
  },
});
