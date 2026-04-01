import { Platform } from 'react-native';
import { DesignTokens } from './design';

export const Colors = {
  primary: DesignTokens.colors.primary,
  secondary: DesignTokens.colors.secondary,
  background: DesignTokens.colors.background,
  surface: DesignTokens.colors.surface,
  text: DesignTokens.colors.text,
  muted: DesignTokens.colors.muted,
  accent: DesignTokens.colors.accent,
  error: DesignTokens.colors.error,
};

export function useTheme() {
  return {
    colors: DesignTokens.colors,
    typography: DesignTokens.typography,
    radius: DesignTokens.radius,
    spacing: DesignTokens.spacing,
    shadow: DesignTokens.shadow,
    border: DesignTokens.border,
  };
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
