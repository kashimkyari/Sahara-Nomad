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

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
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

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

