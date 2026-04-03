import React, { useRef, useEffect, useState } from 'react';
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
import { ChevronLeft, MapPin, Phone, MessageCircle, CheckCircle2, Truck, Clock, Zap } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { ActivityIndicator } from 'react-native';
import { BrutalistAlert } from '../../components/ui/BrutalistAlert';

// Mock data removed in favor of real API calls

const STEPS = [
  { icon: CheckCircle2, label: 'Broadcast' },
  { icon: Truck, label: 'En-Route' },
  { icon: MapPin, label: 'Sourcing' },
  { icon: CheckCircle2, label: 'Delivered' },
];

export default function WakaStatusScreen() {
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const router = useRouter();
  const { id, initialStatus } = useLocalSearchParams<{ id: string, initialStatus: string }>();
  
  const [waka, setWaka] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isDeclining, setIsDeclining] = React.useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string, message: string, buttons: any[] }>({
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title: string, message: string, buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const styles = getStyles(colors);

  const getStatusText = (step: number, status: string) => {
    if (status === 'cancelled') return 'CANCELLED';
    if (status === 'completed') return 'COMPLETED';
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
      showAlert('Error', e.message, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !token) return;

    showAlert(
      'Cancel Waka?',
      'Are you sure you want to cancel this errand?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              const res = await fetch(API.WAKA.CANCEL(id), {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Failed to cancel');
              }

              const updatedWaka = await res.json();
              setWaka(updatedWaka);
              showAlert('Cancelled', 'Errand has been cancelled.');
            } catch (e: any) {
              showAlert('Error', e.message);
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleAccept = async () => {
    if (!id || !token) return;
    try {
      setIsAccepting(true);
      const res = await fetch(API.WAKA.ACCEPT(id), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to accept waka');
      }
      const updated = await res.json();
      setWaka(updated);
      showAlert('Waka Accepted', 'You have successfully joined this errand.');
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!id || !token) return;
    try {
      setIsDeclining(true);
      const res = await fetch(API.WAKA.DECLINE(id), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to decline waka');
      }
      showAlert('Declined', 'You have declined this direct booking.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setIsDeclining(false);
    }
  };

  const handleChat = async () => {
    if (!waka || !token || !user) return;
    try {
      const otherUser = user.id === waka.runner_id ? waka.employer : waka.runner;
      if (!otherUser) return;

      const res = await fetch(API.MESSAGES.CONVERSATIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employer_id: waka.employer_id,
          runner_id: waka.runner_id,
          waka_id: waka.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to start conversation');
      const conv = await res.json();
      router.push(`/conversation/${conv.id}`);
    } catch (e: any) {
      showAlert('Error', e.message);
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

  const isUserRunner = user?.id === waka.runner_id;
  const displayUser = isUserRunner ? waka.employer : waka.runner;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Waka Status</Text>
        {waka.status === 'completed' ? (
          <View style={[styles.livePill, { backgroundColor: colors.secondary }]}>
            <Text style={styles.liveText}>COMPLETED</Text>
          </View>
        ) : waka.status === 'cancelled' ? (
          <View style={[styles.livePill, { backgroundColor: colors.error || '#FF4B4B' }]}>
            <Text style={styles.liveText}>CANCELLED</Text>
          </View>
        ) : (
          <Animated.View style={[styles.livePill, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.liveText}>{waka.status === 'finding_runner' ? 'BROADCAST' : 'LIVE'}</Text>
          </Animated.View>
        )}
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
        <View style={[styles.statusBanner, waka.status === 'cancelled' && { backgroundColor: '#FFDEDE' }]}>
          <Clock size={18} color={waka.status === 'cancelled' ? colors.error : colors.text} strokeWidth={2.5} />
          <Text style={[styles.statusText, waka.status === 'cancelled' && { color: colors.error }]}>
            {getStatusText(waka.step, waka.status)}
          </Text>
        </View>

        {/* Progress Stepper - Hide if cancelled */}
        {waka.status !== 'cancelled' && (
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
        )}

        {/* Participant (Runner/Nomad) Card */}
        {displayUser ? (
          <View style={styles.runnerCard}>
            <View style={styles.runnerHeaderRow}>
              <Image 
                source={{ uri: displayUser.avatar_url || `https://i.pravatar.cc/150?u=${displayUser.id}` }} 
                style={styles.runnerAvatar} 
              />
              <View style={styles.runnerInfo}>
                <Text style={styles.runnerName}>{displayUser.full_name}</Text>
                <Text style={styles.runnerRating}>
                  {isUserRunner ? '★ 4.8 · Nomad' : '★ 4.9 · Runner'}
                </Text>
              </View>
            </View>
            <View style={styles.runnerActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleChat}>
                <MessageCircle size={20} color={colors.text} strokeWidth={2.5} />
                <Text style={styles.actionBtnText}>MESSAGE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]}>
                <Phone size={20} color={colors.surface} strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: colors.surface }]}>CALL</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : waka.status !== 'cancelled' && (
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

        {/* Actions for Runner */}
        {user?.is_runner && waka.employer_id !== user.id && (
          <View style={{ marginTop: DT.spacing.lg }}>
            {waka.status === 'finding_runner' && (
              <TouchableOpacity 
                style={[styles.primaryAction, isAccepting && { opacity: 0.7 }]} 
                onPress={handleAccept}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <>
                    <Zap size={20} color={colors.surface} strokeWidth={2.5} />
                    <Text style={styles.primaryActionText}>ACCEPT WAKA</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {waka.status === 'assigned' && waka.runner_id === user.id && waka.step === 1 && (
              <View style={{ gap: DT.spacing.md }}>
                <TouchableOpacity 
                  style={[styles.primaryAction, isAccepting && { opacity: 0.7 }]} 
                  onPress={handleAccept}
                  disabled={isAccepting}
                >
                  {isAccepting ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <>
                      <CheckCircle2 size={20} color={colors.surface} strokeWidth={2.5} />
                      <Text style={styles.primaryActionText}>CONFIRM ACCEPTANCE</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.cancelBtn, isDeclining && { opacity: 0.7 }]} 
                  onPress={handleDecline}
                  disabled={isDeclining}
                >
                  {isDeclining ? (
                    <ActivityIndicator color={colors.error} />
                  ) : (
                    <Text style={styles.cancelText}>Decline Booking</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Cancel (Employer Only) */}
        {user?.id === waka.employer_id && waka.status !== 'cancelled' && !waka.is_completed && (
          <TouchableOpacity 
            style={[styles.cancelBtn, isCancelling && { opacity: 0.5 }]} 
            onPress={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text style={styles.cancelText}>Cancel Waka</Text>
            )}
          </TouchableOpacity>
        )}

        {waka.status === 'cancelled' && (
          <View style={[styles.card, { borderColor: colors.error, borderStyle: 'dashed' }]}>
            <Text style={[styles.cardTitle, { color: colors.error }]}>This waka was cancelled</Text>
            <Text style={styles.infoText}>You can broadcast a new errand from the home screen.</Text>
            <TouchableOpacity 
              style={[styles.actionBtn, { marginTop: DT.spacing.md, backgroundColor: colors.text }]}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={{ color: colors.surface, fontFamily: DT.typography.heading }}>BACK HOME</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <BrutalistAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
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
  primaryAction: {
    height: 64,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  primaryActionText: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.surface,
    letterSpacing: 1,
  },
});
