import React, { useState } from 'react';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DesignTokens as theme } from '../constants/design';

export default function AuthScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex1: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.heading,
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: theme.typography.body,
    fontSize: 16,
    color: theme.colors.muted,
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  prefixContainer: {
    height: 56,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRightWidth: 0,
    borderTopLeftRadius: theme.radius.sm,
    borderBottomLeftRadius: theme.radius.sm,
    justifyContent: 'center',
  },
  prefixText: {
    fontFamily: theme.typography.body,
    fontSize: 16,
    color: theme.colors.text,
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
    paddingTop: theme.spacing.lg,
  },
  disclaimer: {
    fontFamily: theme.typography.body,
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
});

