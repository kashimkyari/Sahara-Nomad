import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { colors, typography, spacing, isDark } = useTheme();
  const [progress] = useState(new Animated.Value(0));

  const styles = getStyles(colors, typography, spacing);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start(() => {
      router.push('/onboarding');
    });
  }, [progress, router]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.content}>
        <Text style={styles.title}>
          Sahara Nomad
        </Text>
        <Text style={styles.subtitle}>
          Verified Local Deliveries
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <Animated.View 
          style={[styles.progressBar, { width }]} 
          key={isDark ? 'dark' : 'light'} // Force re-render on theme change for progress bar if animation is still running
        />
      </View>
    </View>
  );
}

const getStyles = (colors: any, typography: any, spacing: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.heading,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    color: colors.muted,
    marginTop: 8,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
  },
});



