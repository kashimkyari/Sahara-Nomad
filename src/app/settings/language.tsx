import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';

const languages = [
  { code: 'en-NG', label: 'English (Nigeria)', flag: '🇳🇬' },
  { code: 'yo', label: 'Yorùbá', flag: '🗣️' },
  { code: 'ha', label: 'Hausa', flag: '🗣️' },
  { code: 'ig', label: 'Igbo', flag: '🗣️' },
  { code: 'pcm', label: 'Nigerian Pidgin', flag: '🇳🇬' },
];

const regions = [
  { code: 'lagos', label: 'Lagos' },
  { code: 'abuja', label: 'Abuja (FCT)' },
  { code: 'ph', label: 'Port Harcourt' },
  { code: 'ibadan', label: 'Ibadan' },
  { code: 'kano', label: 'Kano' },
  { code: 'enugu', label: 'Enugu' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState('en-NG');
  const [selectedRegion, setSelectedRegion] = useState('lagos');

  const handleSave = () => router.back();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={DT.colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language & Region</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>DISPLAY LANGUAGE</Text>
        <View style={styles.group}>
          {languages.map((lang, i, arr) => (
            <View key={lang.code}>
              <TouchableOpacity
                style={styles.langRow}
                onPress={() => setSelectedLang(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langLabel, selectedLang === lang.code && styles.langLabelActive]}>
                  {lang.label}
                </Text>
                {selectedLang === lang.code && (
                  <View style={styles.checkBox}>
                    <Check size={14} color={DT.colors.surface} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            🚧 Yoruba, Hausa, Igbo, and Pidgin translations are in progress. Currently only English is fully supported.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>YOUR REGION</Text>
        <Text style={styles.regionHint}>Used to show relevant markets and runners in your area</Text>
        <View style={styles.regionGrid}>
          {regions.map((r) => (
            <TouchableOpacity
              key={r.code}
              style={[styles.regionChip, selectedRegion === r.code && styles.regionChipActive]}
              onPress={() => setSelectedRegion(r.code)}
            >
              <Text style={[styles.regionText, selectedRegion === r.code && styles.regionTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.applyBtn} onPress={handleSave}>
          <Text style={styles.applyBtnText}>Apply Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DT.colors.background },
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
  saveBtn: {
    backgroundColor: DT.colors.primary, borderWidth: 2, borderColor: DT.colors.text,
    paddingHorizontal: DT.spacing.md, paddingVertical: 6,
    shadowColor: DT.colors.text, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  saveBtnText: { fontFamily: DT.typography.heading, fontSize: 13, color: DT.colors.surface },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: DT.typography.heading, fontSize: 11, color: DT.colors.muted,
    letterSpacing: 1.5, marginBottom: DT.spacing.md,
  },
  group: {
    borderWidth: 2, borderColor: DT.colors.text, backgroundColor: DT.colors.surface,
    shadowColor: DT.colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  langRow: {
    flexDirection: 'row', alignItems: 'center', padding: DT.spacing.md, gap: DT.spacing.md,
  },
  langFlag: { fontSize: 22, width: 28 },
  langLabel: { flex: 1, fontFamily: DT.typography.body, fontSize: 15, color: DT.colors.text },
  langLabelActive: { fontFamily: DT.typography.bodySemiBold, color: DT.colors.primary },
  checkBox: {
    width: 24, height: 24, backgroundColor: DT.colors.primary, borderWidth: 2,
    borderColor: DT.colors.text, alignItems: 'center', justifyContent: 'center',
  },
  divider: { height: 2, backgroundColor: DT.colors.text },
  noteBox: {
    marginTop: DT.spacing.md, borderWidth: 2, borderColor: DT.colors.accent,
    backgroundColor: '#FFFBEB', padding: DT.spacing.md,
  },
  noteText: {
    fontFamily: DT.typography.body, fontSize: 13, color: DT.colors.text, lineHeight: 20,
  },
  regionHint: {
    fontFamily: DT.typography.body, fontSize: 12, color: DT.colors.muted,
    marginBottom: DT.spacing.md, marginTop: -8,
  },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: DT.spacing.sm, marginBottom: DT.spacing.xl },
  regionChip: {
    paddingHorizontal: DT.spacing.md, paddingVertical: DT.spacing.sm,
    borderWidth: 2, borderColor: DT.colors.text, backgroundColor: DT.colors.surface,
    shadowColor: DT.colors.text, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  regionChipActive: { backgroundColor: DT.colors.primary },
  regionText: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: DT.colors.text },
  regionTextActive: { color: DT.colors.surface },
  applyBtn: {
    height: 56, backgroundColor: DT.colors.secondary, borderWidth: 2, borderColor: DT.colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: DT.colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  applyBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: DT.colors.surface },
});
