import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  TouchableOpacityProps,
  StyleSheet
} from 'react-native';
import { DesignTokens as theme } from '../../constants/design';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
}

export const Button = ({ 
  title, 
  variant = 'primary', 
  loading = false, 
  style, 
  ...props 
}: ButtonProps) => {

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary': return styles.primary;
      case 'secondary': return styles.secondary;
      case 'outline': return styles.outline;
      case 'ghost': return styles.ghost;
    }
  };

  const getTextVariantStyle = () => {
    switch (variant) {
      case 'primary': return styles.textPrimary;
      case 'secondary': return styles.textSecondary;
      case 'outline': return styles.textOutline;
      case 'ghost': return styles.textGhost;
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      disabled={loading || props.disabled}
      style={[styles.base, getVariantStyle(), style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : theme.colors.primary} />
      ) : (
        <Text style={[styles.textBase, getTextVariantStyle()]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  textBase: {
    fontFamily: theme.typography.heading,
    fontSize: 15,
    fontWeight: '600',
  },
  textPrimary: { color: theme.colors.background },
  textSecondary: { color: theme.colors.text },
  textOutline: { color: theme.colors.primary },
  textGhost: { color: theme.colors.primary },
});

