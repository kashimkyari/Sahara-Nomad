import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { DesignTokens as theme } from '../../constants/design';

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
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'white': return styles.white;
      case 'surface': return styles.surface;
      case 'primary': return styles.primary;
    }
  };

  return (
    <View 
      style={[styles.base, getVariantStyle(), style]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
  },
  white: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
  },
  surface: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
});

