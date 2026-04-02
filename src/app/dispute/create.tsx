import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

const REASONS = [
  'Runner did not show up',
  'Items were damaged/missing',
  'Incorrect price charged',
  'Poor service quality',
  'Other'
];

export default function CreateDisputeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { txnId } = useLocalSearchParams<{ txnId: string }>();
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const styles = getStyles(colors);

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Ehn?', 'Please select a reason for the dispute.');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={64} color={colors.surface} strokeWidth={2.5} />
          </View>
          <Text style={styles.successTitle}>Dispute Received</Text>
          <Text style={styles.successBody}>
            We've received your dispute for Transaction #{txnId || 'TXN123'}. Our team will review it and get back to you within 24 hours.
          </Text>
          <TouchableOpacity style={styles.finishBtn} onPress={() => router.replace('/profile')}>
            <Text style={styles.finishBtnText}>Done</Text>
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
        <Text style={styles.headerTitle}>Raise Dispute</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <AlertTriangle size={20} color={colors.text} />
          <Text style={styles.bannerText}>Disputes are reviewed by our trust team. Please provide as much detail as possible.</Text>
        </View>

        <Text style={styles.sectionLabel}>SELECT REASON</Text>
        <View style={styles.reasonsGroup}>
          {REASONS.map((r) => (
            <TouchableOpacity 
              key={r} 
              style={[styles.reasonRow, selectedReason === r && styles.reasonRowSelected]} 
              onPress={() => setSelectedReason(r)}
            >
              <Text style={[styles.reasonText, selectedReason === r && styles.reasonTextSelected]}>{r}</Text>
              <View style={[styles.radio, selectedReason === r && styles.radioSelected]}>
                {selectedReason === r && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>ADDITIONAL DETAILS</Text>
        <TextInput
          style={styles.input}
          placeholder="Tell us exactly what happened..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Submit Dispute</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerNote}>
          By submitting, you agree to our dispute resolution policy. Funds will be held until the issue is resolved.
        </Text>
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
  banner: {
    flexDirection: 'row', gap: 10, backgroundColor: colors.accent,
    borderWidth: 2, borderColor: colors.text, padding: DT.spacing.md,
    marginBottom: DT.spacing.lg,
  },
  bannerText: { fontFamily: DT.typography.body, fontSize: 13, color: colors.text, flex: 1 },
  sectionLabel: { fontFamily: DT.typography.heading, fontSize: 12, color: colors.muted, letterSpacing: 1.5, marginBottom: DT.spacing.md },
  reasonsGroup: {
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: DT.spacing.md, borderBottomWidth: 2, borderBottomColor: colors.text,
  },
  reasonRowSelected: { backgroundColor: colors.background },
  reasonText: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.text },
  reasonTextSelected: { color: colors.primary },
  radio: {
    width: 20, height: 20, borderRadius: 0, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
  },
  radioSelected: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, backgroundColor: colors.primary },
  input: {
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
    padding: DT.spacing.md, fontFamily: DT.typography.body, fontSize: 15,
    color: colors.text, minHeight: 120,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  submitBtn: {
    height: 56, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center', marginTop: DT.spacing.xl,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  submitBtnText: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.surface },
  footerNote: {
    fontFamily: DT.typography.body, fontSize: 11, color: colors.muted,
    textAlign: 'center', marginTop: DT.spacing.lg, lineHeight: 16,
  },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: DT.spacing.xl },
  successIcon: {
    width: 100, height: 100, backgroundColor: colors.secondary, borderWidth: 3, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center', marginBottom: DT.spacing.xl,
    shadowColor: colors.text, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8,
  },
  successTitle: { fontFamily: DT.typography.heading, fontSize: 28, color: colors.text, marginBottom: DT.spacing.md },
  successBody: { fontFamily: DT.typography.body, fontSize: 16, color: colors.muted, textAlign: 'center', marginBottom: DT.spacing.xl, lineHeight: 24 },
  finishBtn: {
    width: '100%', height: 56, backgroundColor: colors.text, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  finishBtnText: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.surface },
});
