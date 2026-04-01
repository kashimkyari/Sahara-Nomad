import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft, ChevronDown, MapPin, Package, CreditCard } from 'lucide-react-native';
import { DesignTokens as theme } from '../constants/design';

export default function NewErrandScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [items, setItems] = useState('');
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');

  const markets = ['Balogun Market', 'Yaba Market', 'Computer Village', 'Oja Oba'];

  const ProgressHeader = () => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressSegment, step >= 1 && styles.progressActive]} />
      <View style={[styles.progressSegment, styles.progressMiddle, step >= 2 && styles.progressActive]} />
      <View style={[styles.progressSegment, step >= 3 && styles.progressActive]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
          <ChevronLeft size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Errand</Text>
        <View style={{ width: 24 }} />
      </View>

      <ProgressHeader />

      <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.flex1}>
            <Text style={styles.stepTitle}>What do you need sourced?</Text>
            
            <Text style={styles.inputLabel}>Where are we buying from?</Text>
            <TouchableOpacity style={styles.dropdownPicker}>
              <Text style={styles.inputText}>{pickup || 'Select a market'}</Text>
              <ChevronDown size={20} color={theme.colors.muted} />
            </TouchableOpacity>

            <View style={styles.marginBottomLg}>
               <Text style={styles.inputLabel}>Item Details</Text>
               <TextInput
                 multiline
                 numberOfLines={4}
                 placeholder="List items and maximum prices..."
                 placeholderTextColor={theme.colors.muted}
                 style={styles.textArea}
                 value={items}
                 onChangeText={setItems}
               />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.flex1}>
            <Text style={styles.stepTitle}>Where is it going?</Text>
            <Input 
              label="Delivery Address" 
              placeholder="e.g. 10 Ajose Adeogun St, Victoria Island"
              value={delivery}
              onChangeText={setDelivery}
            />
            
            <View style={styles.locationPreview}>
              <MapPin size={24} color={theme.colors.primary} />
              <View style={styles.locationPreviewTextContainer}>
                 <Text style={styles.locationPreviewTitle}>Victoria Island, Lagos</Text>
                 <Text style={styles.locationPreviewSubtitle}>Estimated delivery: 2-3 hours</Text>
              </View>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.flex1}>
            <Text style={styles.stepTitle}>Confirm & Pay Escrow</Text>
            
            <View style={styles.receiptContainer}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLineItem}>Errand Fee</Text>
                  <Text style={styles.receiptLineItemBold}>₦3,500</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLineItem}>Market Cost (Est.)</Text>
                  <Text style={styles.receiptLineItemBold}>₦15,000</Text>
                </View>
                <View style={styles.receiptDivider} />
                <View style={[styles.receiptRow, { marginBottom: 0 }]}>
                  <Text style={styles.receiptTotal}>Total Deposit</Text>
                  <Text style={styles.receiptTotal}>₦18,500</Text>
                </View>
            </View>

            <View style={styles.escrowNotice}>
               <CreditCard size={20} color={theme.colors.accent} />
               <Text style={styles.escrowNoticeText}>
                 Your deposit is held in escrow and only released when you confirm delivery.
               </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title={step === 3 ? "Pay & Post Errand" : "Continue"} 
          onPress={() => step < 3 ? setStep(step + 1) : router.push('/(tabs)')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    fontFamily: theme.typography.heading,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  progressContainer: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  progressSegment: {
    flex: 1,
  },
  progressMiddle: {
    marginHorizontal: 2,
  },
  progressActive: {
    backgroundColor: theme.colors.accent,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  stepTitle: {
    fontFamily: theme.typography.heading,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontFamily: theme.typography.bodyMedium,
    color: theme.colors.text,
    fontSize: 13,
    marginBottom: 6,
  },
  dropdownPicker: {
    height: 56,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  inputText: {
    fontFamily: theme.typography.body,
    fontSize: 16,
    color: theme.colors.text,
  },
  marginBottomLg: {
    marginBottom: theme.spacing.lg,
  },
  textArea: {
    height: 120,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    fontFamily: theme.typography.body,
    fontSize: 16,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
  locationPreview: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPreviewTextContainer: {
    marginLeft: theme.spacing.md,
  },
  locationPreviewTitle: {
    fontFamily: theme.typography.bodyMedium,
    color: theme.colors.text,
    fontSize: 14,
  },
  locationPreviewSubtitle: {
    fontFamily: theme.typography.body,
    color: theme.colors.muted,
    fontSize: 12,
  },
  receiptContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  receiptLineItem: {
    fontFamily: theme.typography.body,
    color: theme.colors.text,
  },
  receiptLineItemBold: {
    fontFamily: theme.typography.bodyMedium,
    color: theme.colors.text,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  receiptTotal: {
    fontFamily: theme.typography.heading,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  escrowNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.sm,
    backgroundColor: '#F6F9FC',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  escrowNoticeText: {
    fontFamily: theme.typography.body,
    fontSize: 12,
    color: theme.colors.muted,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});

