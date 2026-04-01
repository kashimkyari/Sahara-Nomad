/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */


import { useColorScheme, Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1F36',
    background: '#FFFFFF',
    tint: '#0A2540',
    icon: '#8792A2',
    tabIconDefault: '#8792A2',
    tabIconSelected: '#0A2540',
  },
  dark: {
    text: '#FFFFFF',
    background: '#1A1F36',
    tint: '#0A2540',
    icon: '#8792A2',
    tabIconDefault: '#8792A2',
    tabIconSelected: '#FFFFFF',
  },
} as const;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

import { DesignTokens } from './design';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';
  
  return {
    theme,
    isDark: theme === 'dark',
    colors: DesignTokens.colors[theme],
    typography: DesignTokens.typography,
    radius: DesignTokens.radius,
    spacing: DesignTokens.spacing,
  };
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

