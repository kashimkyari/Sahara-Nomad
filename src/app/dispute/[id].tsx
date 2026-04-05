import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, AlertTriangle, Send, Camera, Info } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API } from '../../constants/api';
import { DT } from '../../constants/design';

export default function DisputeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please select a reason for the dispute.');
      return;
    }
    if (details.trim().length < 20) {
      Alert.alert('More Details', 'Please provide at least 20 characters describing the issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API.API_URL}/waka/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          waka_id: id,
          reason: `${reason}: ${details}`,
        }),
      });

      if (res.ok) {
        Alert.alert('Dispute Raised', 'Our trust & safety team has been notified. We will review this within 24 hours.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to raise dispute');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasons = [
    'Missing Items',
    'Damaged Items',
    'Incorrect Items',
    'Runner Unresponsive',
    'Unfair Pricing',
    'Incomplete Errand',
    'Other',
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={DT.colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RAISE DISPUTE</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.warningBox}>
            <AlertTriangle size={24} color={DT.colors.light.text} />
            <Text style={styles.warningText}>
              Raising a dispute will freeze fund release for this errand until reviewed by support.
            </Text>
          </View>

          <Text style={styles.label}>SELECT REASON</Text>
          <View style={styles.reasonsGrid}>
            {reasons.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
                onPress={() => setReason(r)}
              >
                <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>DESCRIBE THE ISSUE</Text>
          <TextInput
            style={styles.detailsInput}
            placeholder="Provide specific details about what went wrong..."
            placeholderTextColor={DT.colors.light.border}
            multiline
            numberOfLines={6}
            value={details}
            onChangeText={setDetails}
            textAlignVertical="top"
          />

          <View style={styles.infoBox}>
            <Info size={16} color={DT.colors.light.text} />
            <Text style={styles.infoText}>
              You can also attach screenshots of your chat in the following step or send them to support@sendam.app
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={DT.colors.light.surface} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>SUBMIT DISPUTE</Text>
                <Send size={20} color={DT.colors.light.surface} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DT.colors.light.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: DT.colors.light.surface,
    borderBottomWidth: 4,
    borderBottomColor: DT.colors.light.text,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: DT.colors.light.text,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DT.colors.light.surface,
  },
  headerTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
    color: DT.colors.light.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: DT.colors.light.warning,
    borderWidth: 3,
    borderColor: DT.colors.light.text,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: DT.colors.light.text,
  },
  label: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: DT.colors.light.text,
    marginBottom: 12,
    marginTop: 8,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: DT.colors.light.text,
    backgroundColor: DT.colors.light.surface,
  },
  reasonChipActive: {
    backgroundColor: DT.colors.light.text,
  },
  reasonText: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: DT.colors.light.text,
  },
  reasonTextActive: {
    color: DT.colors.light.surface,
  },
  detailsInput: {
    borderWidth: 3,
    borderColor: DT.colors.light.text,
    padding: 16,
    fontFamily: DT.typography.body,
    fontSize: 16,
    minHeight: 150,
    backgroundColor: DT.colors.light.surface,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: DT.colors.light.border + '44',
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: DT.colors.light.text,
    fontStyle: 'italic',
  },
  submitBtn: {
    height: 60,
    backgroundColor: DT.colors.light.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: DT.colors.light.text,
    shadowColor: DT.colors.light.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: DT.colors.light.surface,
  },
});
