import { Platform } from 'react-native';
import { DesignTokens } from './design';

export { DesignTokens };
export const Colors = DesignTokens.colors;

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

// Legacy compat for old components still using named spacing keys
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
} as const;

export const MaxContentWidth = 800;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

// Legacy color-scheme helpers (stub for components that still call useColorScheme)
export function useThemeColor(
  props: { light?: string; dark?: string },
  _colorName?: string,
): string {
  return props.light ?? DesignTokens.colors.text;
}

// ThemeColor type alias
export type ThemeColor = string;

// Fonts stub
export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
});
