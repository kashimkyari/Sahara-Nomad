import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DesignTokens as theme } from '../constants/design';

export default function SplashScreen() {
  const router = useRouter();
  const [progress] = useState(new Animated.Value(0));

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
      <StatusBar style="dark" />
      
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
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.typography.heading,
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    fontFamily: theme.typography.bodyMedium,
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 8,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
});


