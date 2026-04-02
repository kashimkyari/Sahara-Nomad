import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/use-theme';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Eye, EyeOff } from 'lucide-react-native';
import { DesignTokens as DT } from '../constants/design';

type Tab = 'login' | 'signup';

export default function AuthScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const handleSubmit = () => {
    if (phone.length < 10) {
      setPhoneError('Ah ah, check that number again.');
      return;
    }
    setPhoneError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1500);
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>SENDAM</Text>
            <Text style={styles.subtitle}>The errand network built for naija.</Text>
          </View>

          {/* Segmented Control */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, tab === 'login' && styles.tabActive]}
              onPress={() => setTab('login')}
            >
              <Text style={[styles.tabLabel, tab === 'login' && styles.tabLabelActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'signup' && styles.tabActive]}
              onPress={() => setTab('signup')}
            >
              <Text style={[styles.tabLabel, tab === 'signup' && styles.tabLabelActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {tab === 'signup' && (
              <Input
                label="Full Name"
                placeholder="e.g. Chidi Amaechi"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}

            {/* Phone Field with +234 prefix */}
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>+234</Text>
              </View>
              <View style={styles.phoneInputWrapper}>
                <Input
                  placeholder="000 000 0000"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    if (phoneError) setPhoneError('');
                  }}
                  error={phoneError}
                  containerStyle={styles.phoneInputContainer}
                  style={styles.phoneInput}
                />
              </View>
            </View>

            {/* Password */}
            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.showToggle}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              }
            />
          </View>
        </ScrollView>

        {/* Sticky Submit */}
        <View style={styles.footer}>
          <Button
            title="Enter Market"
            onPress={handleSubmit}
            loading={loading}
            disabled={!phone}
          />
          <Text style={styles.disclaimer}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: { flex: 1 },
  scrollContent: {
    paddingHorizontal: DT.spacing.lg,
    paddingBottom: DT.spacing.lg,
    flexGrow: 1,
  },
  header: {
    paddingTop: DT.spacing.lg,
    marginBottom: DT.spacing.lg,
  },
  appName: {
    fontFamily: DT.typography.heading,
    fontSize: 36,
    color: colors.primary,
    letterSpacing: -1,
    textShadowColor: colors.text,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.muted,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.text,
    marginBottom: DT.spacing.lg,
    backgroundColor: colors.surface,
  },
  tab: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 15,
    color: colors.text,
  },
  tabLabelActive: {
    color: colors.surface,
  },
  form: {},
  inputLabel: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: DT.spacing.md,
  },
  prefix: {
    height: 48,
    paddingHorizontal: DT.spacing.md,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.text,
    borderRightWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 15,
    color: colors.surface,
  },
  phoneInputWrapper: {
    flex: 1,
  },
  phoneInputContainer: {
    marginBottom: 0,
  },
  phoneInput: {
    borderLeftWidth: 0,
  },
  showToggle: {
    fontFamily: DT.typography.body,
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: DT.spacing.lg,
    paddingBottom: DT.spacing.lg,
    paddingTop: DT.spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.text,
    backgroundColor: colors.background,
    gap: 10,
  },
  disclaimer: {
    fontFamily: DT.typography.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
});
