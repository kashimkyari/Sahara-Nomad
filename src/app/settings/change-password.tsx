import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const rules = [
    { label: 'At least 8 characters', met: newPass.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(newPass) },
    { label: 'Contains uppercase', met: /[A-Z]/.test(newPass) },
    { label: 'Passwords match', met: newPass.length > 0 && newPass === confirm },
  ];

  const allMet = rules.every((r) => r.met) && current.length > 0;

  const PasswordInput = ({
    label, value, onChange, show, onToggle
  }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) => (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder="••••••••"
          placeholderTextColor={DT.colors.muted}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={onToggle}>
          {show
            ? <EyeOff size={18} color={DT.colors.muted} strokeWidth={2} />
            : <Eye size={18} color={DT.colors.muted} strokeWidth={2} />}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={DT.colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
        <View style={styles.content}>
          <PasswordInput
            label="Current Password"
            value={current}
            onChange={setCurrent}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
          />
          <PasswordInput
            label="New Password"
            value={newPass}
            onChange={setNewPass}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
          />
          <PasswordInput
            label="Confirm New Password"
            value={confirm}
            onChange={setConfirm}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
          />

          {/* Rules checker */}
          {newPass.length > 0 && (
            <View style={styles.rulesWrap}>
              {rules.map((r) => (
                <View key={r.label} style={styles.ruleRow}>
                  {r.met
                    ? <CheckCircle2 size={16} color={DT.colors.secondary} strokeWidth={2.5} />
                    : <XCircle size={16} color={DT.colors.error} strokeWidth={2.5} />}
                  <Text style={[styles.ruleText, r.met && styles.ruleTextMet]}>{r.label}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, !allMet && styles.saveBtnDisabled]}
            onPress={() => allMet && router.back()}
            disabled={!allMet}
          >
            <Text style={styles.saveBtnText}>Update Password</Text>
          </TouchableOpacity>
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
  content: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, gap: DT.spacing.md },
  inputWrap: { gap: 6 },
  inputLabel: {
    fontFamily: DT.typography.heading, fontSize: 11, color: DT.colors.muted, letterSpacing: 1.5,
  },
  inputRow: {
    flexDirection: 'row', borderWidth: 2, borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface,
    shadowColor: DT.colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  textInput: {
    flex: 1, height: 52, paddingHorizontal: DT.spacing.md,
    fontFamily: DT.typography.body, fontSize: 16, color: DT.colors.text, letterSpacing: 3,
  },
  eyeBtn: {
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
    borderLeftWidth: 2, borderLeftColor: DT.colors.text,
  },
  rulesWrap: {
    borderWidth: 2, borderColor: DT.colors.text, backgroundColor: DT.colors.surface,
    padding: DT.spacing.md, gap: 8,
    shadowColor: DT.colors.text, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { fontFamily: DT.typography.body, fontSize: 13, color: DT.colors.muted },
  ruleTextMet: { color: DT.colors.secondary },
  saveBtn: {
    height: 56, backgroundColor: DT.colors.primary, borderWidth: 2, borderColor: DT.colors.text,
    alignItems: 'center', justifyContent: 'center', marginTop: DT.spacing.sm,
    shadowColor: DT.colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  saveBtnDisabled: { backgroundColor: DT.colors.muted, shadowOpacity: 0, elevation: 0 },
  saveBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: DT.colors.surface },
});
