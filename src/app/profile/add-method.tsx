import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, CreditCard, Landmark, CheckCircle2 } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

type Tab = 'card' | 'bank';

export default function AddMethodScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('card');
  const [done, setDone] = useState(false);
  const styles = getStyles(colors);

  // Card fields
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Bank fields
  const [bankName, setBankName] = useState('');
  const [acctNum, setAcctNum] = useState('');
  const [acctName, setAcctName] = useState('');

  const formatCard = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();

  const formatExpiry = (val: string) => {
    const d = val.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const cardValid = cardNum.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length >= 3 && cardName.length > 2;
  const bankValid = bankName.length > 2 && acctNum.length === 10 && acctName.length > 2;
  const canSave = tab === 'card' ? cardValid : bankValid;

  if (done) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Method</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.successBox}>
          <CheckCircle2 size={64} color={colors.secondary} strokeWidth={1.5} />
          <Text style={styles.successTitle}>{tab === 'card' ? 'Card Added!' : 'Account Linked!'}</Text>
          <Text style={styles.successSub}>Your payment method has been saved and is ready to use.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Back to Payment</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Payment Method</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {(['card', 'bank'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            {t === 'card'
              ? <CreditCard size={16} color={tab === t ? colors.surface : colors.text} strokeWidth={2} />
              : <Landmark size={16} color={tab === t ? colors.surface : colors.text} strokeWidth={2} />}
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'card' ? 'Debit Card' : 'Bank Account'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {tab === 'card' ? (
            <>
              {/* Card preview */}
              <View style={styles.cardPreview}>
                <Text style={styles.cardPreviewLabel}>DEBIT CARD</Text>
                <Text style={styles.cardPreviewNum}>
                  {cardNum || '•••• •••• •••• ••••'}
                </Text>
                <View style={styles.cardPreviewBottom}>
                  <View>
                    <Text style={styles.cardPreviewSub}>CARDHOLDER</Text>
                    <Text style={styles.cardPreviewName}>{cardName || '—'}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardPreviewSub}>EXPIRES</Text>
                    <Text style={styles.cardPreviewName}>{expiry || '—'}</Text>
                  </View>
                </View>
              </View>

              <FieldGroup>
                <Field label="Card Number" value={cardNum}
                  onChange={(v) => setCardNum(formatCard(v))}
                  placeholder="1234 5678 9012 3456" keyboard="numeric" maxLen={19} colors={colors} />
                <Div colors={colors} />
                <FieldRow>
                  <Field label="Expiry" value={expiry}
                    onChange={(v) => setExpiry(formatExpiry(v))}
                    placeholder="MM/YY" keyboard="numeric" maxLen={5} flex colors={colors} />
                  <VDiv colors={colors} />
                  <Field label="CVV" value={cvv}
                    onChange={setCvv}
                    placeholder="•••" keyboard="numeric" maxLen={4} flex secureText colors={colors} />
                </FieldRow>
                <Div colors={colors} />
                <Field label="Name on Card" value={cardName}
                  onChange={setCardName}
                  placeholder="Full name as on card" autoCapitalize="words" colors={colors} />
              </FieldGroup>
            </>
          ) : (
            <>
              <FieldGroup>
                <Field label="Bank Name" value={bankName}
                  onChange={setBankName}
                  placeholder="e.g. Kuda Bank, GTBank" autoCapitalize="words" colors={colors} />
                <Div colors={colors} />
                <Field label="Account Number" value={acctNum}
                  onChange={(v) => setAcctNum(v.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit NUBAN number" keyboard="numeric" maxLen={10} colors={colors} />
                <Div colors={colors} />
                <Field label="Account Name" value={acctName}
                  onChange={setAcctName}
                  placeholder="Name on account" autoCapitalize="words" colors={colors} />
              </FieldGroup>
              <Text style={styles.hint}>
                We'll verify this account with your BVN before saving.
              </Text>
            </>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={() => canSave && setDone(true)}
            disabled={!canSave}
          >
            <Text style={styles.saveBtnText}>
              {tab === 'card' ? 'Save Card' : 'Link Account'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Micro-components ───────────────────────────────────────────────────────

const FieldGroup = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View style={{
      borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
      marginBottom: DT.spacing.md,
      shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
    }}>
      {children}
    </View>
  );
};

const FieldRow = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row' }}>{children}</View>
);

const Div = ({ colors }: { colors: any }) => <View style={{ height: 2, backgroundColor: colors.text }} />;
const VDiv = ({ colors }: { colors: any }) => <View style={{ width: 2, backgroundColor: colors.text }} />;

const Field = ({ label, value, onChange, placeholder, keyboard, maxLen, flex, secureText, autoCapitalize, colors }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  keyboard?: 'default' | 'numeric'; maxLen?: number; flex?: boolean; secureText?: boolean; autoCapitalize?: 'none' | 'words';
  colors: any;
}) => (
  <View style={{ flex: flex ? 1 : undefined, padding: DT.spacing.md }}>
    <Text style={{ fontFamily: DT.typography.heading, fontSize: 10, color: colors.muted, letterSpacing: 1.5, marginBottom: 4 }}>
      {label.toUpperCase()}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType={keyboard ?? 'default'}
      maxLength={maxLen}
      secureTextEntry={secureText}
      autoCapitalize={autoCapitalize ?? 'none'}
      style={{ fontFamily: DT.typography.body, fontSize: 15, color: colors.text, padding: 0, height: 32 }}
    />
  </View>
);

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
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
  tabRow: {
    flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: colors.text,
    backgroundColor: colors.background,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: DT.spacing.sm, paddingVertical: DT.spacing.md,
    borderRightWidth: 1, borderRightColor: colors.text,
  },
  tabBtnActive: { backgroundColor: colors.primary },
  tabText: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.text },
  tabTextActive: { color: colors.surface },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 40 },
  cardPreview: {
    backgroundColor: colors.text, padding: DT.spacing.lg, marginBottom: DT.spacing.lg,
    borderWidth: 2, borderColor: colors.text,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  cardPreviewLabel: {
    fontFamily: DT.typography.heading, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: DT.spacing.md,
  },
  cardPreviewNum: {
    fontFamily: DT.typography.heading, fontSize: 22, color: colors.surface, letterSpacing: 3, marginBottom: DT.spacing.lg,
  },
  cardPreviewBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardPreviewSub: { fontFamily: DT.typography.body, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
  cardPreviewName: { fontFamily: DT.typography.heading, fontSize: 13, color: colors.surface },
  hint: {
    fontFamily: DT.typography.body, fontSize: 12, color: colors.muted, marginBottom: DT.spacing.md, lineHeight: 18,
  },
  saveBtn: {
    height: 56, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  saveBtnDisabled: { backgroundColor: colors.muted, shadowOpacity: 0, elevation: 0 },
  saveBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: colors.surface },
  successBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: DT.spacing.lg, gap: DT.spacing.md,
  },
  successTitle: { fontFamily: DT.typography.heading, fontSize: 26, color: colors.text },
  successSub: { fontFamily: DT.typography.body, fontSize: 14, color: colors.muted, textAlign: 'center' },
  doneBtn: {
    width: '100%', height: 56, backgroundColor: colors.secondary, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  doneBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: colors.surface },
});
