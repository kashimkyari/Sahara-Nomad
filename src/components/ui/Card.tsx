import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../constants/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'white' | 'surface' | 'primary';
}

export const Card = ({ 
  children, 
  variant = 'white', 
  style, 
  ...props 
}: CardProps) => {
  const { colors, radius, spacing } = useTheme();
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'white': return {
        backgroundColor: colors.background,
        borderColor: colors.border,
      };
      case 'surface': return {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      };
      case 'primary': return {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      };
    }
  };

  return (
    <View 
      style={[
        styles.base, 
        { borderRadius: radius.sm, padding: spacing.md },
        getVariantStyle(), 
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
});


