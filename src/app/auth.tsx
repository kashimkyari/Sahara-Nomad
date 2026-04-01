import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTheme } from '../constants/theme';

export default function AuthScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius } = useTheme();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const styles = getStyles(colors, typography, spacing, radius);

  const handleContinue = () => {
    if (phone.length < 10) {
      setError('Invalid phone number format');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Simulate OTP send
    setTimeout(() => {
      setLoading(false);
      router.push('/(tabs)');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Enter your phone number
            </Text>
            <Text style={styles.subtitle}>
              We'll send a secure OTP via SMS or WhatsApp.
            </Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.prefixContainer}>
              <Text style={styles.prefixText}>+234</Text>
            </View>
            <View style={styles.flex1}>
              <Input
                placeholder="000 000 0000"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (error) setError('');
                }}
                error={error}
                containerStyle={styles.inputContainer}
                style={styles.inputInner}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.disclaimer}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
            <Button 
              title="Continue" 
              onPress={handleContinue}
              loading={loading}
              disabled={!phone}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, typography: any, spacing: any, radius: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  title: {
    fontFamily: typography.heading,
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 16,
    color: colors.muted,
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  prefixContainer: {
    height: 56,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRightWidth: 0,
    borderTopLeftRadius: radius.sm,
    borderBottomLeftRadius: radius.sm,
    justifyContent: 'center',
  },
  prefixText: {
    fontFamily: typography.body,
    fontSize: 16,
    color: colors.text,
  },
  inputContainer: {
    marginBottom: 0,
  },
  inputInner: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  disclaimer: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
});


