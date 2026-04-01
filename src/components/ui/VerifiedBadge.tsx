import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { DesignTokens as theme } from '../../constants/design';

interface VerifiedBadgeProps {
  showLabel?: boolean;
  size?: number;
}

export const VerifiedBadge = ({ 
  showLabel = true, 
  size = 14 
}: VerifiedBadgeProps) => {
  return (
    <View style={styles.container}>
      <ShieldCheck size={size} color={theme.colors.accent} fill={theme.colors.accent} fillOpacity={0.1} />
      {showLabel && (
        <Text style={styles.label}>
          Verified
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: theme.colors.accent,
    fontFamily: theme.typography.bodyMedium,
    fontSize: 13,
    marginLeft: 4,
  },
});

