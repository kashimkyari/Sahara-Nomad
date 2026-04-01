import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius } = useTheme();

  const styles = getStyles(colors, typography, spacing, radius);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <ShieldCheck size={48} color={colors.primary} />
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

const getStyles = (colors: any, typography: any, spacing: any, radius: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    backgroundColor: colors.surface,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: typography.heading,
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    lineHeight: 24,
  },
});


