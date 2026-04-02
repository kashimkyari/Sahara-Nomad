import {
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  useFonts as usePlusJakartaSans,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

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
    <AuthProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="new-errand" />
          <Stack.Screen name="waka/[id]" />
          <Stack.Screen name="runner/[id]" />
          <Stack.Screen name="conversation/[id]" />
          <Stack.Screen name="profile" />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
