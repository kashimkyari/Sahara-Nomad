import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  TouchableOpacityProps,
  StyleSheet
} from 'react-native';
import { useTheme } from '../../constants/theme';

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
  const { colors, spacing, radius, typography } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary': return {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        borderWidth: 1,
      };
      case 'secondary': return {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
      };
      case 'outline': return {
        backgroundColor: 'transparent',
        borderColor: colors.primary,
        borderWidth: 1,
      };
      case 'ghost': return {
        backgroundColor: 'transparent',
      };
    }
  };

  const getTextVariantStyle = () => {
    switch (variant) {
      case 'primary': return { color: colors.background };
      case 'secondary': return { color: colors.text };
      case 'outline': return { color: colors.primary };
      case 'ghost': return { color: colors.primary };
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      disabled={loading || props.disabled}
      style={[
        styles.base, 
        { borderRadius: radius.sm, paddingHorizontal: spacing.md },
        getVariantStyle(), 
        style
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : colors.primary} />
      ) : (
        <Text style={[
          styles.textBase, 
          { fontFamily: typography.heading },
          getTextVariantStyle()
        ]}>
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
  },
  textBase: {
    fontSize: 15,
    fontWeight: '600',
  },
});


