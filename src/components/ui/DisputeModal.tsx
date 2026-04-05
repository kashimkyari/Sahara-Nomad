import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

interface DisputeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => Promise<void>;
}

const REASONS = [
  "Payment Issue",
  "Poor Behavior",
  "Item Mismatch",
  "Delay/No Show",
  "Damaged Goods",
  "Other"
];

const DisputeModal = ({ visible, onClose, onSubmit }: DisputeModalProps) => {
  const { colors } = useTheme();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !description) return;
    setLoading(true);
    try {
      await onSubmit(reason, description);
      onClose();
    } catch (error) {
      console.error("Dispute Submit Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <MotiView 
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>RAISE DISPUTE</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.label}>WHY ARE YOU DISPUTING?</Text>
            <View style={styles.reasonGrid}>
              {REASONS.map((r) => (
                <TouchableOpacity 
                  key={r}
                  style={[
                    styles.reasonChip, 
                    reason === r && styles.reasonChipActive
                  ]}
                  onPress={() => setReason(r)}
                >
                  <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: DT.spacing.md }]}>ADDITIONAL DETAILS</Text>
            <TextInput 
              style={styles.input}
              placeholder="Tell us what happened..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity 
              style={[styles.submitBtn, (!reason || !description) && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={!reason || !description || loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.submitBtnText}>SEND TO AUDIT</Text>
              )}
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: DT.spacing.md,
  },
  container: {
    backgroundColor: colors.surface,
    borderWidth: DT.border.width,
    borderColor: colors.text,
    ...DT.shadow.hard,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DT.spacing.md,
    backgroundColor: colors.error,
    borderBottomWidth: DT.border.width,
    borderColor: colors.text,
  },
  headerTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.surface,
  },
  body: {
    padding: DT.spacing.md,
  },
  label: {
    fontFamily: DT.typography.heading,
    fontSize: 11,
    marginBottom: 8,
    color: colors.text,
    letterSpacing: 1,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DT.spacing.xs,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: DT.border.width,
    borderColor: colors.text,
    backgroundColor: colors.background,
  },
  reasonChipActive: {
    backgroundColor: colors.text,
  },
  reasonText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.text,
  },
  reasonTextActive: {
    color: colors.surface,
  },
  input: {
    borderWidth: DT.border.width,
    borderColor: colors.text,
    padding: DT.spacing.md,
    fontFamily: DT.typography.body,
    fontSize: 14,
    backgroundColor: colors.background,
    textAlignVertical: 'top',
    minHeight: 120,
    color: colors.text,
  },
  submitBtn: {
    backgroundColor: colors.text,
    padding: DT.spacing.md,
    alignItems: 'center',
    marginTop: DT.spacing.lg,
    ...DT.shadow.hard,
  },
  submitBtnText: {
    color: colors.surface,
    fontFamily: DT.typography.heading,
    fontSize: 16,
  }
});

export default DisputeModal;
