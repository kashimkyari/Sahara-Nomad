import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ArrowRight } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';

type Step = 'phone' | 'otp' | 'done';

export default function ChangePhoneScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (val: string, i: number) => {
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handlePhoneSubmit = () => {
    if (phone.length < 10) return;
    setStep('otp');
  };

  const handleVerify = () => {
    if (otp.join('').length < 6) return;
    setStep('done');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={DT.colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Phone</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <View style={styles.content}>
          {/* Step indicator */}
          <View style={styles.stepBar}>
            {(['phone', 'otp', 'done'] as Step[]).map((s, i) => (
              <View key={s} style={styles.stepBarItem}>
                <View style={[styles.stepCircle, step === s && styles.stepCircleActive,
                  ((step === 'otp' && i === 0) || (step === 'done' && i < 2)) && styles.stepCircleDone]}>
                  <Text style={[styles.stepNum,
                    step === s && styles.stepNumActive,
                    ((step === 'otp' && i === 0) || (step === 'done' && i < 2)) && styles.stepNumDone]}>
                    {i + 1}
                  </Text>
                </View>
                {i < 2 && <View style={styles.stepConnector} />}
              </View>
            ))}
          </View>

          {step === 'phone' && (
            <>
              <Text style={styles.stepTitle}>Enter New Number</Text>
              <Text style={styles.stepSub}>We'll send an OTP to verify ownership</Text>
              <View style={styles.phoneRow}>
                <View style={styles.prefixBox}><Text style={styles.prefixText}>+234</Text></View>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="812 000 0000"
                  placeholderTextColor={DT.colors.muted}
                  maxLength={10}
                  autoFocus
                />
              </View>
              <TouchableOpacity style={styles.actionBtn} onPress={handlePhoneSubmit}>
                <Text style={styles.actionBtnText}>Send OTP</Text>
                <ArrowRight size={20} color={DT.colors.surface} strokeWidth={2.5} />
              </TouchableOpacity>
            </>
          )}

          {step === 'otp' && (
            <>
              <Text style={styles.stepTitle}>Enter OTP Code</Text>
              <Text style={styles.stepSub}>Sent to +234 {phone}</Text>
              <View style={styles.otpRow}>
                {otp.map((val, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => { inputRefs.current[i] = r; }}
                    style={[styles.otpBox, val && styles.otpBoxFilled]}
                    value={val}
                    onChangeText={(v) => handleOtpChange(v, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.actionBtn} onPress={handleVerify}>
                <Text style={styles.actionBtnText}>Verify OTP</Text>
                <ArrowRight size={20} color={DT.colors.surface} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.resendBtn}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'done' && (
            <View style={styles.successBox}>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={styles.successTitle}>Number Updated!</Text>
              <Text style={styles.successSub}>Your phone number has been changed successfully.</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.back()}>
                <Text style={styles.actionBtnText}>Back to Settings</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DT.colors.background },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.md,
    borderBottomWidth: 2, borderBottomColor: DT.colors.text,
  },
  backBtn: {
    width: 40, height: 40, borderWidth: 2, borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 20, color: DT.colors.text },
  content: { flex: 1, paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.xl },
  stepBar: { flexDirection: 'row', alignItems: 'center', marginBottom: DT.spacing.xl },
  stepBarItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepCircle: {
    width: 32, height: 32, borderWidth: 2, borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: DT.colors.primary },
  stepCircleDone: { backgroundColor: DT.colors.secondary },
  stepNum: { fontFamily: DT.typography.heading, fontSize: 14, color: DT.colors.muted },
  stepNumActive: { color: DT.colors.surface },
  stepNumDone: { color: DT.colors.surface },
  stepConnector: { flex: 1, height: 2, backgroundColor: DT.colors.text },
  stepTitle: { fontFamily: DT.typography.heading, fontSize: 24, color: DT.colors.text, marginBottom: 6 },
  stepSub: { fontFamily: DT.typography.body, fontSize: 14, color: DT.colors.muted, marginBottom: DT.spacing.xl },
  phoneRow: {
    flexDirection: 'row', borderWidth: 2, borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface, marginBottom: DT.spacing.lg,
    shadowColor: DT.colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  prefixBox: {
    width: 64, backgroundColor: DT.colors.secondary, borderRightWidth: 2,
    borderRightColor: DT.colors.text, alignItems: 'center', justifyContent: 'center', height: 52,
  },
  prefixText: { fontFamily: DT.typography.heading, fontSize: 14, color: DT.colors.surface },
  phoneInput: {
    flex: 1, height: 52, paddingHorizontal: DT.spacing.md,
    fontFamily: DT.typography.body, fontSize: 18, color: DT.colors.text, letterSpacing: 2,
  },
  otpRow: { flexDirection: 'row', gap: DT.spacing.sm, marginBottom: DT.spacing.lg },
  otpBox: {
    flex: 1, height: 56, borderWidth: 2, borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface, fontFamily: DT.typography.heading, fontSize: 22, color: DT.colors.text,
    shadowColor: DT.colors.text, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  otpBoxFilled: { borderColor: DT.colors.primary, backgroundColor: '#FFF0EB' },
  actionBtn: {
    height: 56, backgroundColor: DT.colors.primary, borderWidth: 2, borderColor: DT.colors.text,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DT.spacing.sm,
    shadowColor: DT.colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  actionBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: DT.colors.surface },
  resendBtn: { alignItems: 'center', marginTop: DT.spacing.md, padding: DT.spacing.sm },
  resendText: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: DT.colors.primary },
  successBox: { alignItems: 'center', gap: DT.spacing.md, marginTop: DT.spacing.xl },
  successEmoji: { fontSize: 64 },
  successTitle: { fontFamily: DT.typography.heading, fontSize: 28, color: DT.colors.text },
  successSub: { fontFamily: DT.typography.body, fontSize: 15, color: DT.colors.muted, textAlign: 'center' },
});
