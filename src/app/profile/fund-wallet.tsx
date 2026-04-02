import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Landmark, CreditCard, CheckCircle2 } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

type Method = 'bank' | 'card' | 'ussd';

export default function FundWalletScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Method>('bank');
  const [done, setDone] = useState(false);

  const formatted = amount ? `₦${Number(amount.replace(/\D/g, '')).toLocaleString()}` : '';

  const handleAmountPress = (val: number) => {
    setAmount(String(val));
  };

  const handleFund = () => {
    if (!amount) return;
    setDone(true);
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={DT.colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fund Wallet</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.successContainer}>
          <CheckCircle2 size={72} color={DT.colors.secondary} strokeWidth={1.5} />
          <Text style={styles.successAmount}>{`₦${Number(amount).toLocaleString()}`}</Text>
          <Text style={styles.successTitle}>Wallet Funded!</Text>
          <Text style={styles.successSub}>
            Your Sendam wallet has been topped up. Ready to post wakas!
          </Text>
          <View style={styles.receiptCard}>
            {[
              { label: 'Reference', value: `TXN${Date.now().toString().slice(-8)}` },
              { label: 'Method', value: method === 'bank' ? 'Bank Transfer' : method === 'card' ? 'Card' : 'USSD' },
              { label: 'Status', value: 'Successful' },
              { label: 'Time', value: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) },
            ].map((r, i, arr) => (
              <View key={r.label}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>{r.label}</Text>
                  <Text style={[styles.receiptValue, r.label === 'Status' && { color: DT.colors.secondary }]}>{r.value}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.receiptDivider} />}
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Back to Wallet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={DT.colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fund Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Amount entry */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>AMOUNT TO ADD</Text>
            <View style={styles.amountRow}>
              <Text style={styles.nairaSign}>₦</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>
          </View>

          {/* Quick amounts */}
          <Text style={styles.sectionLabel}>QUICK AMOUNTS</Text>
          <View style={styles.quickGrid}>
            {QUICK_AMOUNTS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.quickChip, amount === String(a) && styles.quickChipActive]}
                onPress={() => handleAmountPress(a)}
              >
                <Text style={[styles.quickChipText, amount === String(a) && styles.quickChipTextActive]}>
                  ₦{a.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Payment method */}
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          <View style={styles.methodGroup}>
            {([
              { id: 'bank' as Method, icon: Landmark, label: 'Bank Transfer', sub: 'Transfer from any Nigerian bank' },
              { id: 'card' as Method, icon: CreditCard, label: 'Debit Card', sub: 'Kuda, GTBank, Zenith, etc.' },
              { id: 'ussd' as Method, icon: null, label: 'USSD', sub: '*737#, *966#, *919# etc.' },
            ]).map((m, i, arr) => (
              <View key={m.id}>
                <TouchableOpacity style={styles.methodRow} onPress={() => setMethod(m.id)}>
                  <View style={[styles.methodIconBox, method === m.id && styles.methodIconBoxActive]}>
                    {m.icon
                      ? <m.icon size={18} color={method === m.id ? DT.colors.surface : DT.colors.text} strokeWidth={2.5} />
                      : <Text style={[styles.ussdIcon, method === m.id && { color: DT.colors.surface }]}>*#</Text>}
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodLabel}>{m.label}</Text>
                    <Text style={styles.methodSub}>{m.sub}</Text>
                  </View>
                  <View style={[styles.radio, method === m.id && styles.radioActive]}>
                    {method === m.id && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          {/* Bank details shown when bank selected */}
          {method === 'bank' && (
            <View style={styles.bankDetails}>
              <Text style={styles.bankDetailsTitle}>Transfer to this account</Text>
              {[
                { label: 'Bank Name', value: 'Providus Bank' },
                { label: 'Account Number', value: '9912345678' },
                { label: 'Account Name', value: 'Sendam Ltd / Chidi Amaechi' },
              ].map((d) => (
                <View key={d.label} style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>{d.label}</Text>
                  <Text style={styles.bankDetailValue}>{d.value}</Text>
                </View>
              ))}
              <Text style={styles.bankNote}>
                ⚡ This account is unique to you. Funds reflect within 5 minutes.
              </Text>
            </View>
          )}

          {method === 'ussd' && (
            <View style={styles.bankDetails}>
              <Text style={styles.bankDetailsTitle}>Dial the code for your bank</Text>
              {[
                { bank: 'GTBank', code: '*737*58#' },
                { bank: 'Zenith', code: '*966*58#' },
                { bank: 'First Bank', code: '*894*58#' },
              ].map((u) => (
                <View key={u.bank} style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>{u.bank}</Text>
                  <Text style={[styles.bankDetailValue, { fontFamily: DT.typography.heading, color: DT.colors.primary }]}>{u.code}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.fundBtn, !amount && styles.fundBtnDisabled]}
            onPress={handleFund}
            disabled={!amount}
          >
            <Text style={styles.fundBtnText}>
              {amount ? `Fund ${formatted}` : 'Enter an Amount'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.md, paddingBottom: 40 },
  amountCard: {
    backgroundColor: DT.colors.primary, borderWidth: 2, borderColor: DT.colors.text,
    padding: DT.spacing.lg, marginBottom: DT.spacing.lg,
    shadowColor: DT.colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  amountLabel: { fontFamily: DT.typography.heading, fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  nairaSign: { fontFamily: DT.typography.heading, fontSize: 32, color: DT.colors.surface, marginRight: 6 },
  amountInput: {
    flex: 1, fontFamily: DT.typography.heading, fontSize: 42,
    color: DT.colors.surface, padding: 0,
  },
  sectionLabel: {
    fontFamily: DT.typography.heading, fontSize: 11, color: DT.colors.muted,
    letterSpacing: 1.5, marginBottom: DT.spacing.md, marginTop: DT.spacing.sm,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: DT.spacing.sm, marginBottom: DT.spacing.lg },
  quickChip: {
    paddingHorizontal: DT.spacing.md, paddingVertical: DT.spacing.sm,
    borderWidth: 2, borderColor: DT.colors.text, backgroundColor: DT.colors.surface,
    shadowColor: DT.colors.text, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  quickChipActive: { backgroundColor: DT.colors.accent },
  quickChipText: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: DT.colors.text },
  quickChipTextActive: { fontFamily: DT.typography.heading },
  methodGroup: {
    borderWidth: 2, borderColor: DT.colors.text, backgroundColor: DT.colors.surface, marginBottom: DT.spacing.md,
    shadowColor: DT.colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  methodRow: { flexDirection: 'row', alignItems: 'center', padding: DT.spacing.md, gap: DT.spacing.md },
  methodIconBox: {
    width: 40, height: 40, borderWidth: 2, borderColor: DT.colors.text,
    backgroundColor: DT.colors.background, alignItems: 'center', justifyContent: 'center',
  },
  methodIconBoxActive: { backgroundColor: DT.colors.primary },
  ussdIcon: { fontFamily: DT.typography.heading, fontSize: 14, color: DT.colors.text },
  methodInfo: { flex: 1 },
  methodLabel: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: DT.colors.text },
  methodSub: { fontFamily: DT.typography.body, fontSize: 11, color: DT.colors.muted, marginTop: 1 },
  radio: {
    width: 20, height: 20, borderWidth: 2, borderColor: DT.colors.text,
    borderRadius: 0, alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: DT.colors.primary },
  radioDot: { width: 10, height: 10, backgroundColor: DT.colors.primary },
  divider: { height: 2, backgroundColor: DT.colors.text },
  bankDetails: {
    borderWidth: 2, borderColor: DT.colors.secondary, backgroundColor: DT.colors.surface,
    padding: DT.spacing.md, marginBottom: DT.spacing.lg,
  },
  bankDetailsTitle: {
    fontFamily: DT.typography.heading, fontSize: 12, color: DT.colors.secondary,
    letterSpacing: 0.5, marginBottom: DT.spacing.md,
  },
  bankDetailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: DT.spacing.sm, borderBottomWidth: 1, borderBottomColor: DT.colors.background,
  },
  bankDetailLabel: { fontFamily: DT.typography.body, fontSize: 13, color: DT.colors.muted },
  bankDetailValue: { fontFamily: DT.typography.bodySemiBold, fontSize: 13, color: DT.colors.text },
  bankNote: {
    fontFamily: DT.typography.body, fontSize: 11, color: DT.colors.muted,
    marginTop: DT.spacing.md, lineHeight: 18,
  },
  fundBtn: {
    height: 56, backgroundColor: DT.colors.primary, borderWidth: 2, borderColor: DT.colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: DT.colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  fundBtnDisabled: { backgroundColor: DT.colors.muted, shadowOpacity: 0, elevation: 0 },
  fundBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: DT.colors.surface },
  successContainer: { flex: 1, alignItems: 'center', paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.xl, gap: DT.spacing.md },
  successAmount: { fontFamily: DT.typography.heading, fontSize: 40, color: DT.colors.text },
  successTitle: { fontFamily: DT.typography.heading, fontSize: 24, color: DT.colors.text },
  successSub: { fontFamily: DT.typography.body, fontSize: 14, color: DT.colors.muted, textAlign: 'center' },
  receiptCard: {
    width: '100%', borderWidth: 2, borderColor: DT.colors.text, backgroundColor: DT.colors.surface,
    shadowColor: DT.colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  receiptRow: {
    flexDirection: 'row', justifyContent: 'space-between', padding: DT.spacing.md,
  },
  receiptLabel: { fontFamily: DT.typography.body, fontSize: 13, color: DT.colors.muted },
  receiptValue: { fontFamily: DT.typography.bodySemiBold, fontSize: 13, color: DT.colors.text },
  receiptDivider: { height: 2, backgroundColor: DT.colors.text },
  doneBtn: {
    width: '100%', height: 56, backgroundColor: DT.colors.secondary, borderWidth: 2, borderColor: DT.colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: DT.colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  doneBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: DT.colors.surface },
});
