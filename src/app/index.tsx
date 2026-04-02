import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/use-theme';
import { DesignTokens as DT } from '../constants/design';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const progress = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        router.replace('/onboarding');
      }
    });
  }, []);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Text style={styles.logo}>SENDAM</Text>
        <Text style={styles.tagline}>Anywhere, anyhow, we move.</Text>
      </Animated.View>

      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidth }]} />
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  logo: {
    fontFamily: DT.typography.heading,
    fontSize: 56,
    color: colors.primary,
    letterSpacing: -1,
    textShadowColor: colors.text,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  tagline: {
    fontFamily: DT.typography.body,
    fontSize: 16,
    color: colors.text,
    marginTop: 10,
    letterSpacing: 0.3,
  },
  barTrack: {
    width: 200,
    height: 8,
    backgroundColor: colors.text,
    borderRadius: 0,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 0,
  },
});
