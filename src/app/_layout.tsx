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

  // Build a custom theme so React Navigation passes our design tokens to the
  // native layer (primary/text tints). Card is NOT overridden so the native
  // tab bar background is fully transparent (handled by NativeTabs blurEffect).
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const customTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: palette.primary,       // active tab icon tint
      text: palette.text,             // inactive tab icon tint
      background: palette.background, // page background
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


