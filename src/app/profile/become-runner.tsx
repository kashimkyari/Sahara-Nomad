import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bike, CheckCircle2, ShieldCheck, MapPin, Zap } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

const steps = [
  { icon: ShieldCheck, title: 'BVN Verification', desc: 'We verify your Bank Verification Number to confirm your identity. Takes 2 minutes.' },
  { icon: MapPin, title: 'Address Check', desc: 'Confirm your home area. This helps us match you with nearby wakas.' },
  { icon: Bike, title: 'Pickup Capability', desc: 'Tell us your mode of transport — bike, keke, or on foot for short runs.' },
  { icon: Zap, title: 'Go Live!', desc: 'Once verified, your profile goes live and buyers can find and hire you.' },
];

export default function BecomeRunnerScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [transport, setTransport] = useState('');
  const styles = getStyles(colors);

  const transports = ['Motorcycle', 'Keke Napep', 'Car', 'On Foot'];

  if (!started) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Become a Runner</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🏃</Text>
            <Text style={styles.heroTitle}>Earn on Your{'\n'}Own Schedule</Text>
            <Text style={styles.heroSub}>
              Turn idle hours into income. Run errands across markets in your neighbourhood — set your own pace, keep 100% of your runner fee.
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { value: '₦45k', label: 'Avg monthly' },
              { value: '2hrs', label: 'Onboarding' },
              { value: '100%', label: 'Your fee kept' },
            ].map((s, i, arr) => (
              <View key={s.label} style={[styles.statBox, i < arr.length - 1 && styles.statBorder]}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Steps overview */}
          <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          {steps.map((s, i) => (
            <View key={s.title} style={styles.stepCard}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <s.icon size={20} color={colors.primary} strokeWidth={2.5} />
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.startBtn} onPress={() => setStarted(true)}>
            <Text style={styles.startBtnText}>Start Application →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Application flow
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => currentStep > 0 ? setCurrentStep(c => c - 1) : setStarted(false)}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Step {currentStep + 1} of {steps.length}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((currentStep + 1) / steps.length) * 100}%` as any }]} />
      </View>

      <View style={styles.stepContent}>
        {currentStep < 3 && (
          <>
            <View style={styles.stepIconCircle}>
              {React.createElement(steps[currentStep].icon, { size: 32, color: colors.surface, strokeWidth: 2.5 })}
            </View>
            <Text style={styles.bigStepTitle}>{steps[currentStep].title}</Text>
            <Text style={styles.bigStepDesc}>{steps[currentStep].desc}</Text>

            {currentStep === 2 && (
              <View style={styles.transportGrid}>
                {transports.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.transportChip, transport === t && styles.transportChipActive]}
                    onPress={() => setTransport(t)}
                  >
                    <Text style={[styles.transportText, transport === t && styles.transportTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.nextBtn, currentStep === 2 && !transport && styles.nextBtnDisabled]}
              onPress={() => setCurrentStep(c => c + 1)}
              disabled={currentStep === 2 && !transport}
            >
              <Text style={styles.nextBtnText}>
                {currentStep === 2 ? 'Submit Application' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {currentStep === 3 && (
          <View style={styles.successBox}>
            <CheckCircle2 size={64} color={colors.secondary} strokeWidth={2} />
            <Text style={styles.successTitle}>Application Submitted!</Text>
            <Text style={styles.successSub}>We'll verify your details within 24 hours. You'll get an SMS when you're approved.</Text>
            <TouchableOpacity style={styles.nextBtn} onPress={() => router.back()}>
              <Text style={styles.nextBtnText}>Back to Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.text },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 40 },
  hero: {
    alignItems: 'center', borderWidth: 2, borderColor: colors.text,
    backgroundColor: colors.primary, padding: DT.spacing.xl, marginBottom: DT.spacing.lg,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  heroEmoji: { fontSize: 56, marginBottom: DT.spacing.md },
  heroTitle: { fontFamily: DT.typography.heading, fontSize: 28, color: colors.surface, textAlign: 'center', marginBottom: DT.spacing.md },
  heroSub: { fontFamily: DT.typography.body, fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
  statsRow: {
    flexDirection: 'row', borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
    marginBottom: DT.spacing.lg,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: DT.spacing.md },
  statBorder: { borderRightWidth: 2, borderRightColor: colors.text },
  statValue: { fontFamily: DT.typography.heading, fontSize: 20, color: colors.text },
  statLabel: { fontFamily: DT.typography.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  sectionLabel: {
    fontFamily: DT.typography.heading, fontSize: 11, color: colors.muted, letterSpacing: 1.5, marginBottom: DT.spacing.md,
  },
  stepCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: DT.spacing.md,
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
    padding: DT.spacing.md, marginBottom: DT.spacing.sm,
  },
  stepNum: {
    width: 24, height: 24, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumText: { fontFamily: DT.typography.heading, fontSize: 12, color: colors.text },
  stepInfo: { flex: 1 },
  stepTitle: { fontFamily: DT.typography.heading, fontSize: 14, color: colors.text },
  stepDesc: { fontFamily: DT.typography.body, fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 18 },
  startBtn: {
    height: 56, backgroundColor: colors.secondary, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center', marginTop: DT.spacing.lg,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  startBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: colors.surface },
  progressTrack: { height: 4, backgroundColor: colors.background, borderBottomWidth: 2, borderBottomColor: colors.text },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  stepContent: { flex: 1, paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.xl, gap: DT.spacing.md },
  stepIconCircle: {
    width: 72, height: 72, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  bigStepTitle: { fontFamily: DT.typography.heading, fontSize: 28, color: colors.text },
  bigStepDesc: { fontFamily: DT.typography.body, fontSize: 15, color: colors.muted, lineHeight: 24 },
  transportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: DT.spacing.sm },
  transportChip: {
    paddingHorizontal: DT.spacing.md, paddingVertical: DT.spacing.sm,
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
  },
  transportChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  transportText: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.text },
  transportTextActive: { color: colors.surface },
  nextBtn: {
    height: 56, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  nextBtnDisabled: { backgroundColor: colors.muted, shadowOpacity: 0, elevation: 0 },
  nextBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: colors.surface },
  successBox: { alignItems: 'center', gap: DT.spacing.md, paddingTop: DT.spacing.xl },
  successTitle: { fontFamily: DT.typography.heading, fontSize: 26, color: colors.text },
  successSub: { fontFamily: DT.typography.body, fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22 },
});
