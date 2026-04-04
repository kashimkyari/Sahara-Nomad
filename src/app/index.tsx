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
    }).start();
  }, []);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>SENDAM</Text>
        </View>
        <Text style={styles.tagline}>ANYWHERE,</Text>
        <Text style={styles.tagline}>ANYHOW,</Text>
        <Text style={[styles.tagline, { color: colors.primary }]}>WE MOVE.</Text>
      </Animated.View>

      <View style={styles.footerLoader}>
        <Text style={styles.loadingText}>BOOTING CORE...</Text>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.background, padding: 32, justifyContent: 'space-between',
  },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'flex-start',
  },
  logoBox: {
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.text,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 48,
    shadowColor: colors.text, shadowOffset: { width: 8, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8,
    transform: [{ rotate: '-4deg' }],
  },
  logoText: {
    fontFamily: DT.typography.heading, fontSize: 48, color: colors.text, letterSpacing: 4,
  },
  tagline: {
    fontFamily: DT.typography.heading, fontSize: 44, color: colors.text, lineHeight: 48, marginBottom: -4,
  },
  footerLoader: {
    marginBottom: 40,
  },
  loadingText: {
    fontFamily: DT.typography.heading, fontSize: 16, color: colors.muted, marginBottom: 12, letterSpacing: 2,
  },
  barTrack: {
    width: '100%', height: 16, backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.text,
  },
  barFill: {
    height: '100%', backgroundColor: colors.text,
  },
});
