import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { 
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_700Bold 
} from '@expo-google-fonts/space-grotesk';
import { 
  useFonts as useWorkSans,
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold 
} from '@expo-google-fonts/work-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { DesignTokens } from '../constants/design';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = DesignTokens.colors[isDark ? 'dark' : 'light'];
  
  const [spaceGroteskLoaded] = useSpaceGrotesk({
    SpaceGrotesk_700Bold,
  });

  const [workSansLoaded] = useWorkSans({
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
  });

  useEffect(() => {
    if (spaceGroteskLoaded && workSansLoaded) {
      SplashScreen.hideAsync();
    }
  }, [spaceGroteskLoaded, workSansLoaded]);

  if (!spaceGroteskLoaded || !workSansLoaded) {
    return null;
  }

  // Build a custom theme that overlays our design tokens onto React Navigation's
  // base theme. This ensures the native iOS tab bar picks up the correct:
  //   - `colors.primary`  → active icon tint
  //   - `colors.text`     → inactive icon tint  
  //   - `colors.card`     → tab bar background (overrides the default which would be opaque white/black)
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const customTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: palette.primary,       // active tab icon tint
      text: palette.text,              // inactive tab icon tint (used by native tab bar)
      card: palette.background,        // tab bar background
      border: palette.border,          // tab bar top border
      background: palette.background,
      notification: palette.accent,
    },
  };

  return (
    <ThemeProvider value={customTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}


