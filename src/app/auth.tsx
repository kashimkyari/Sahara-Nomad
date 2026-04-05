import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DesignTokens as DT } from '../constants/design';
import { useTheme } from '../hooks/use-theme';
import { useAuth } from '../context/AuthContext';
import API from '../constants/api';
import { BrutalistAlert } from '../components/ui/BrutalistAlert';

type Tab = 'login' | 'signup';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isOtpView, setIsOtpView] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  const phoneRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const otpRef = useRef<any>(null);

  // Handle Deeplinking for referrals
  useEffect(() => {
    const handleUrl = (url: string) => {
      const parsed = Linking.parse(url);
      if (parsed.queryParams?.ref) {
        setReferralCode(parsed.queryParams.ref as string);
        setTab('signup');
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => subscription.remove();
  }, []);

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string, message: string, buttons: any[] }>({
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title: string, message: string, buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const sanitizePhone = (input: string) => {
    const digits = input.replace(/\D/g, ''); // Remove all non-digits
    if (digits.startsWith('234')) {
      return digits.slice(3).replace(/^0+/, '');
    }
    return digits.replace(/^0+/, '');
  };

  const handleSubmit = async () => {
    if (phone.length < 10) {
      setPhoneError('Ah ah, check that number again.');
      return;
    }
    setPhoneError('');
    setIsOtpView(false); 
    setLoading(true);

    const fullPhone = `+234${sanitizePhone(phone)}`;

    try {
      if (tab === 'signup') {
        const response = await fetch(API.AUTH.SIGNUP, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: name,
            phone_number: fullPhone,
            password: password,
            referral_code: referralCode || undefined
          }),
        });
        
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || 'Signup failed');
        }
      }

      // Login/Token call
      const loginResponse = await fetch(API.AUTH.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: fullPhone,
          password: password,
        }),
      });

        if (!loginResponse.ok) {
          const err = await loginResponse.json();
          throw new Error(err.detail || 'Login failed');
        }
        
        const res = await loginResponse.json();
        if (res.status === 'otp_sent') {
          setIsOtpView(true);
        } else if (res.access_token && res.refresh_token) {
          await signIn(res.access_token, res.refresh_token);
        }
    } catch (error: any) {
      setPhoneError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setPhoneError('');
    const fullPhone = `+234${sanitizePhone(phone)}`;

    try {
      const response = await fetch(`${API.API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: fullPhone,
          otp_code: otpCode,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'OTP verification failed');
      }

      const { access_token, refresh_token } = await response.json();
      await signIn(access_token, refresh_token);
    } catch (error: any) {
      setPhoneError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setPhoneError('');
    const fullPhone = `+234${sanitizePhone(phone)}`;

    try {
      const response = await fetch(`${API.API_URL}/auth/request-otp?phone_number=${encodeURIComponent(fullPhone)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to resend OTP');
      }
      showAlert('Success', 'New code sent! Check your messages (Dev: 123456)');
    } catch (error: any) {
      setPhoneError(error.message);
    } finally {
      setLoading(false);
    }
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
            <View style={styles.subtitleBlock}>
              <Text style={styles.subtitle}>THE ERRAND NETWORK</Text>
            </View>
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
            {isOtpView ? (
              <View>
                <Text style={styles.otpMessage}>
                  Enter the 6-digit code sent to {phone}
                </Text>
                <Input
                  label="OTP Code"
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  error={phoneError}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  ref={otpRef}
                  onSubmitEditing={handleVerifyOtp}
                  returnKeyType="done"
                />
                <TouchableOpacity 
                  onPress={() => setIsOtpView(false)}
                  style={styles.backToAuth}
                >
                  <Text style={styles.backToAuthText}>Wrong number? Go back</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleResendOtp}
                  disabled={loading}
                  style={styles.resendBtn}
                >
                  <Text style={styles.resendText}>Didn't get a code? Resend</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {tab === 'signup' && (
                  <>
                    <Input
                      label="Full Name"
                      placeholder="e.g. Chidi Amaechi"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      textContentType="name"
                      autoComplete="name"
                      onSubmitEditing={() => phoneRef.current?.focus()}
                      returnKeyType="next"
                    />
                    <Input
                      label="Referral Code (Optional)"
                      placeholder="e.g. A1B2C3D4"
                      value={referralCode}
                      onChangeText={setReferralCode}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      placeholderTextColor={colors.muted}
                    />
                  </>
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
                      textContentType="telephoneNumber"
                      autoComplete="tel"
                      ref={phoneRef}
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      returnKeyType="next"
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
                  ref={passwordRef}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="go"
                  rightElement={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Text style={styles.showToggle}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  }
                />
              </>
            )}
          </View>
        </ScrollView>

        {/* Sticky Submit */}
        <View style={styles.footer}>
          <Button
            title={isOtpView ? "Verify OTP" : "Enter Market"}
            onPress={isOtpView ? handleVerifyOtp : handleSubmit}
            loading={loading}
            disabled={isOtpView ? otpCode.length < 6 : !phone}
          />
          <View style={styles.disclaimerRow}>
            <Text style={styles.disclaimerText}>By continuing you agree to our </Text>
            <TouchableOpacity onPress={() => router.push('/terms' as any)}>
              <Text style={styles.disclaimerLink}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.disclaimerText}> & </Text>
            <TouchableOpacity onPress={() => router.push('/privacy' as any)}>
              <Text style={styles.disclaimerLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <BrutalistAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
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
    paddingTop: DT.spacing.xl,
    marginBottom: DT.spacing.xl,
  },
  appName: {
    fontFamily: DT.typography.heading,
    fontSize: 56,
    color: colors.text,
    letterSpacing: -2,
    lineHeight: 60,
    textShadowColor: colors.primary,
    textShadowOffset: { width: -4, height: 4 },
    textShadowRadius: 0,
  },
  subtitleBlock: {
    backgroundColor: colors.text,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    transform: [{ rotate: '-1deg' }],
  },
  subtitle: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.surface,
    letterSpacing: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 16,
  },
  tab: {
    flex: 1,
    height: 56,
    borderWidth: 3,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  tabActive: {
    backgroundColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ translateX: 4 }, { translateY: 4 }],
  },
  tabLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
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
    borderWidth: 3,
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
  disclaimerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  disclaimerText: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.muted,
  },
  disclaimerLink: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.text,
    textDecorationLine: 'underline',
  },
  otpMessage: {
    fontFamily: DT.typography.body,
    fontSize: 14,
    color: colors.text,
    marginBottom: DT.spacing.lg,
    lineHeight: 20,
  },
  backToAuth: {
    marginTop: DT.spacing.md,
    alignItems: 'center',
  },
  backToAuthText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 14,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  resendBtn: {
    marginTop: DT.spacing.lg,
    alignItems: 'center',
    padding: 10,
  },
  resendText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 14,
    color: colors.primary,
  },
});
