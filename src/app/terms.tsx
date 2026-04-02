import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../hooks/use-theme';
import { DesignTokens as DT } from '../constants/design';

export default function TermsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TERMS OF SERVICE</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.legalBox}>
          <Text style={[styles.legalHeading, { marginTop: 0 }]}>1. ACCEPTANCE</Text>
          <Text style={styles.legalBody}>
            By using Sendam, you agree to let locals run your streets. 
            These terms are legally binding. If you don't agree, do not use the market.
          </Text>
          
          <Text style={styles.legalHeading}>2. RUNNER CONDUCT</Text>
          <Text style={styles.legalBody}>
            Runners are independent contractors. Sendam acts solely as a matching 
            network between buyers and local runners. Ensure you verify goods upon delivery.
          </Text>

          <Text style={styles.legalHeading}>3. DISPUTES</Text>
          <Text style={styles.legalBody}>
            All disputes are subject to arbitration in Lagos, Nigeria. The platform 
            reserves the right to mediate or ban bad actors at our sole discretion.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.md,
    borderBottomWidth: 3, borderBottomColor: colors.text,
    gap: DT.spacing.md, backgroundColor: colors.surface,
  },
  backBtn: {
    width: 44, height: 44, borderWidth: 3, borderColor: colors.text,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 24, color: colors.text },
  scroll: { padding: DT.spacing.lg, paddingBottom: 60 },
  legalBox: {
    backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.text,
    padding: DT.spacing.lg, shadowColor: colors.text, shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 6,
  },
  legalHeading: { fontFamily: DT.typography.heading, fontSize: 20, color: colors.text, marginBottom: 8, marginTop: 24 },
  legalBody: { fontFamily: DT.typography.body, fontSize: 16, color: colors.text, lineHeight: 26 },
});
