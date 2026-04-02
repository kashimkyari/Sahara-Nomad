import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BrutalistAlert } from '../../../components/ui/BrutalistAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, CreditCard, Trash2, CheckCircle2 } from 'lucide-react-native';
import { DesignTokens as DT } from '../../../constants/design';
import { useTheme } from '../../../hooks/use-theme';

const cardData: Record<string, { label: string; number: string; type: string; bank: string; active: boolean; expires: string }> = {
  '1': { label: 'Kuda Bank', number: '•••• •••• •••• 4521', type: 'Bank Transfer', bank: 'Kuda MFB', active: true, expires: 'N/A' },
  '2': { label: 'GTBank Mastercard', number: '•••• •••• •••• 9873', type: 'Mastercard', bank: 'GTBank', active: false, expires: '08/27' },
};

export default function CardDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const card = cardData[id as string] ?? cardData['1'];
  const [isDefault, setIsDefault] = useState(card.active);

  // Alert State
  const [alertVisible, setAlertVisible] = React.useState(false);
  const [alertConfig, setAlertConfig] = React.useState<{ title: string, message: string, buttons: any[] }>({
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title: string, message: string, buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const styles = getStyles(colors);
  const isBank = card.type === 'Bank Transfer';

  const handleSetDefault = () => setIsDefault(true);

  const handleDelete = () => {
    showAlert(
      'Remove Payment Method',
      `Remove ${card.label} from your account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isBank ? 'Bank Account' : 'Debit Card'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Card visual */}
        <View style={[styles.cardDisplay, { backgroundColor: isDefault ? colors.primary : colors.text }]}>
          <View style={styles.cardDisplayTop}>
            <Text style={styles.cardDisplayBank}>{card.bank}</Text>
            {isDefault && (
              <View style={styles.defaultPill}>
                <Text style={styles.defaultPillText}>DEFAULT</Text>
              </View>
            )}
          </View>
          <CreditCard size={32} color="rgba(255,255,255,0.3)" strokeWidth={1} style={{ marginVertical: DT.spacing.md }} />
          <Text style={styles.cardDisplayNum}>{card.number}</Text>
          <View style={styles.cardDisplayBottom}>
            <View>
              <Text style={styles.cardDisplaySubLabel}>TYPE</Text>
              <Text style={styles.cardDisplaySub}>{card.type}</Text>
            </View>
            {!isBank && (
              <View>
                <Text style={styles.cardDisplaySubLabel}>EXPIRES</Text>
                <Text style={styles.cardDisplaySub}>{card.expires}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        {!isDefault && (
          <TouchableOpacity style={styles.setDefaultBtn} onPress={handleSetDefault}>
            <CheckCircle2 size={20} color={colors.text} strokeWidth={2.5} />
            <Text style={styles.setDefaultText}>Set as Default</Text>
          </TouchableOpacity>
        )}

        {isDefault && (
          <View style={styles.defaultNote}>
            <CheckCircle2 size={16} color={colors.secondary} strokeWidth={2.5} />
            <Text style={styles.defaultNoteText}>This is your default payment method</Text>
          </View>
        )}

        {/* Info rows */}
        <View style={styles.infoCard}>
          {[
            { label: 'Label', value: card.label },
            { label: 'Account/Card', value: card.number },
            { label: 'Type', value: card.type },
            { label: 'Bank', value: card.bank },
          ].map((row, i, arr) => (
            <View key={row.label}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Trash2 size={18} color={colors.error} strokeWidth={2.5} />
          <Text style={styles.deleteText}>Remove {isBank ? 'Account' : 'Card'}</Text>
        </TouchableOpacity>
      </View>

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
  content: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, gap: DT.spacing.md },
  cardDisplay: {
    padding: DT.spacing.lg, borderWidth: 2, borderColor: colors.text,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  cardDisplayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDisplayBank: { fontFamily: DT.typography.heading, fontSize: 16, color: colors.surface },
  defaultPill: {
    backgroundColor: colors.accent, borderWidth: 1, borderColor: colors.surface,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  defaultPillText: { fontFamily: DT.typography.heading, fontSize: 9, color: colors.text, letterSpacing: 1.5 },
  cardDisplayNum: { fontFamily: DT.typography.heading, fontSize: 20, color: colors.surface, letterSpacing: 4, marginBottom: DT.spacing.md },
  cardDisplayBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardDisplaySubLabel: { fontFamily: DT.typography.body, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
  cardDisplaySub: { fontFamily: DT.typography.heading, fontSize: 12, color: colors.surface },
  setDefaultBtn: {
    flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md, height: 52,
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.accent, paddingHorizontal: DT.spacing.md,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  setDefaultText: { fontFamily: DT.typography.heading, fontSize: 15, color: colors.text },
  defaultNote: { flexDirection: 'row', alignItems: 'center', gap: DT.spacing.sm, paddingVertical: 4 },
  defaultNoteText: { fontFamily: DT.typography.body, fontSize: 13, color: colors.secondary },
  infoCard: {
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: DT.spacing.md },
  infoLabel: { fontFamily: DT.typography.body, fontSize: 13, color: colors.muted },
  infoValue: { fontFamily: DT.typography.bodySemiBold, fontSize: 13, color: colors.text },
  divider: { height: 2, backgroundColor: colors.text },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md, height: 48,
    borderWidth: 2, borderColor: colors.error, backgroundColor: colors.surface,
    paddingHorizontal: DT.spacing.md,
  },
  deleteText: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.error },
});
