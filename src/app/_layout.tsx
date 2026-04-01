import { Stack } from 'expo-router';
import {
  useFonts,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  useFonts as usePlusJakartaSans,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { DesignTokens } from '../constants/design';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [outfitLoaded] = useFonts({ Outfit_700Bold });
  const [jakartaLoaded] = usePlusJakartaSans({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  useEffect(() => {
    if (outfitLoaded && jakartaLoaded) {
      SplashScreen.hideAsync();
    }
  }, [outfitLoaded, jakartaLoaded]);

  if (!outfitLoaded || !jakartaLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="new-errand" />
    </Stack>
  );
}
