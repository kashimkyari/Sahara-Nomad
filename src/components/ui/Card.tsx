import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'surface' | 'active' | 'plain';
  style?: object;
}

export function Card({ children, variant = 'surface', style }: CardProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View
      style={[
        styles.base,
        variant === 'active' ? styles.active : variant === 'plain' ? styles.plain : styles.surface,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  base: {
    borderWidth: 2,
    borderColor: colors.text,
    borderRadius: 0,
    padding: DT.spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  surface: {
    backgroundColor: colors.surface,
  },
  active: {
    backgroundColor: colors.secondary,
  },
  plain: {
    backgroundColor: colors.background,
    shadowOpacity: 0,
    elevation: 0,
  },
});
