import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { ShieldCheck } from 'lucide-react-native';
import { DesignTokens as theme } from '../constants/design';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <ShieldCheck size={48} color={theme.colors.primary} />
          </View>
          
          <Text style={styles.title}>
            100% Verified{"\n"}Runners
          </Text>
          
          <Text style={styles.subtitle}>
            Every Sahara Nomad runner passes strict BVN and physical address checks.
          </Text>
        </View>

        <View>
          <Button 
            title="Get Started" 
            onPress={() => router.push('/auth')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    backgroundColor: theme.colors.surface,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontFamily: theme.typography.heading,
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: theme.typography.body,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    lineHeight: 24,
  },
});

