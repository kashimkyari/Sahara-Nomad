import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../constants/theme';

interface VerifiedBadgeProps {
  showLabel?: boolean;
  size?: number;
}

export const VerifiedBadge = ({ 
  showLabel = true, 
  size = 14 
}: VerifiedBadgeProps) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      <ShieldCheck 
        size={size} 
        color={colors.accent} 
        fill={colors.accent} 
        fillOpacity={0.1} 
      />
      {showLabel && (
        <Text style={[
          styles.label, 
          { color: colors.accent, fontFamily: typography.bodySemiBold }
        ]}>
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
    fontSize: 13,
    marginLeft: 4,
  },
});


