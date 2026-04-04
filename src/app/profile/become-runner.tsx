import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bike, CheckCircle2, ShieldCheck, MapPin, Zap, Smartphone, Camera } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { BrutalistAlert } from '../../components/ui/BrutalistAlert';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef } from 'react';

const steps = [
  { icon: ShieldCheck, title: 'BVN Verification', desc: 'We verify your Bank Verification Number to confirm your identity. Takes 2 minutes.' },
  { icon: MapPin, title: 'Address Check', desc: 'Confirm your home area. This helps us match you with nearby wakas.' },
  { icon: Bike, title: 'Pickup Capability', desc: 'Tell us your mode of transport — bike, keke, or on foot for short runs.' },
  { icon: Zap, title: 'Hourly Rate', desc: 'Set your preferred hourly rate for running errands.' },
  { icon: CheckCircle2, title: 'Go Live!', desc: 'Once verified, your profile goes live and buyers can find and hire you.' },
];

export default function BecomeRunnerScreen() {
  const { colors } = useTheme();
  const { token, refreshUser } = useAuth();
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bvnPhase, setBvnPhase] = useState(0);
  const [verificationMethod, setVerificationMethod] = useState<'otp' | 'liveness' | ''>('');
  const [otp, setOtp] = useState('');
  const [bvn, setBvn] = useState('');
  const [address, setAddress] = useState('');
  const [transport, setTransport] = useState('');
  const [hourlyRate, setHourlyRate] = useState('1500');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

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

  const styles = getStyles(colors);
  const transports = ['Motorcycle', 'Keke Napep', 'Car', 'On Foot'];

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'We need location access to verify your primary area.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (addressResult) {
        const fullAddress = `${addressResult.name || ''} ${addressResult.street || ''}, ${addressResult.city || ''} ${addressResult.region || ''}`.trim().replace(/^,/, '');
        setAddress(fullAddress);
      }
    } catch (e: any) {
      showAlert('Location Error', e.message || 'Could not fetch your location.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleTakeSelfie = async () => {
    if (!cameraPermission || !cameraPermission.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        showAlert('Permission Denied', 'Camera access is required for liveness verification.');
        return;
      }
    }
    // We handle the capture via handleCapture within the CameraView now
  };

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
        });
        if (photo) {
          setSelfieUri(photo.uri);
        }
      } catch (e: any) {
        showAlert('Capture Error', 'Could not capture photo. Please try again.');
      }
    }
  };

  const sendOtp = async () => {
    setIsSubmitting(true);
    // Mocking OTP send — in production, call backend /verification/send-bvn-otp
    setTimeout(() => {
      setIsSubmitting(false);
      setBvnPhase(2);
    }, 1500);
  };

  if (!started) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Become a Runner</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🏃</Text>
            <Text style={styles.heroTitle}>Earn on Your{'\n'}Own Schedule</Text>
            <Text style={styles.heroSub}>
              Turn idle hours into income. Run errands across markets in your neighbourhood — set your own pace, keep 100% of your runner fee.
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { value: '₦45k', label: 'Avg monthly' },
              { value: '2hrs', label: 'Onboarding' },
              { value: '100%', label: 'Your fee kept' },
            ].map((s, i, arr) => (
              <View key={s.label} style={[styles.statBox, i < arr.length - 1 && styles.statBorder]}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Steps overview */}
          <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          {steps.map((s, i) => (
            <View key={s.title} style={styles.stepCard}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <s.icon size={20} color={colors.primary} strokeWidth={2.5} />
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.startBtn} onPress={() => setStarted(true)}>
            <Text style={styles.startBtnText}>Start Application →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Application flow
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backBtn} onPress={() => {
                if (currentStep === 0 && bvnPhase > 0) setBvnPhase(p => p - 1);
                else if (currentStep > 0) setCurrentStep(c => c - 1);
                else setStarted(false);
              }}>
                <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Step {currentStep + 1} of {steps.length}</Text>
              <View style={{ width: 40 }} />
            </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((currentStep + 1) / steps.length) * 100}%` as any }]} />
      </View>

        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={styles.stepContent}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep < 3 && (
            <>
              <View style={styles.stepIconCircle}>
                {React.createElement(steps[currentStep].icon, { size: 32, color: colors.surface, strokeWidth: 2.5 })}
              </View>
              <Text style={styles.bigStepTitle}>{steps[currentStep].title}</Text>
              <Text style={styles.bigStepDesc}>{steps[currentStep].desc}</Text>

              {currentStep === 0 && bvnPhase === 0 && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>ENTER 11-DIGIT BVN</Text>
                  <TextInput
                    style={[styles.bvnInput, { color: colors.text }]}
                    keyboardType="number-pad"
                    maxLength={11}
                    placeholder="00000000000"
                    placeholderTextColor={colors.muted}
                    value={bvn}
                    onChangeText={setBvn}
                  />
                  <View style={styles.bvnInfoBox}>
                    <ShieldCheck size={16} color={colors.text} />
                    <Text style={styles.bvnInfoText}>Encrypted & matched via NIBSS.</Text>
                  </View>
                </View>
              )}

              {currentStep === 0 && bvnPhase === 1 && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>VERIFICATION METHOD</Text>
                  <TouchableOpacity 
                    style={[styles.methodCard, verificationMethod === 'otp' && styles.methodCardActive]}
                    onPress={() => setVerificationMethod('otp')}
                  >
                    <Smartphone size={24} color={colors.text} />
                    <Text style={[styles.methodTitle, verificationMethod === 'otp' && styles.methodTitleActive]}>OTP to linked phone</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.methodCard, verificationMethod === 'liveness' && styles.methodCardActive]}
                    onPress={() => setVerificationMethod('liveness')}
                  >
                    <Camera size={24} color={colors.text} />
                    <Text style={[styles.methodTitle, verificationMethod === 'liveness' && styles.methodTitleActive]}>Liveness Check (Selfie)</Text>
                  </TouchableOpacity>
                </View>
              )}

              {currentStep === 0 && bvnPhase === 2 && verificationMethod === 'otp' && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>ENTER 6-DIGIT OTP</Text>
                  <TextInput
                    style={[styles.bvnInput, { color: colors.text }]}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="000000"
                    placeholderTextColor={colors.muted}
                    value={otp}
                    onChangeText={setOtp}
                  />
                </View>
              )}

                  {currentStep === 0 && bvnPhase === 2 && verificationMethod === 'liveness' && (
                    <View style={styles.livenessBox}>
                      <Text style={styles.livenessInstruction}>Position your face within the frame</Text>
                      {selfieUri ? (
                    <View style={styles.livenessOutline}>
                      <Image source={{ uri: selfieUri }} style={styles.selfiePreview} contentFit="cover" />
                      <CheckCircle2 size={32} color={colors.secondary} style={styles.checkIcon} />
                    </View>
                  ) : (
                    <View style={styles.livenessOutline}>
                      {cameraPermission?.granted ? (
                        <TouchableOpacity 
                          style={styles.cameraPreviewContainer} 
                          onPress={handleCapture}
                          activeOpacity={0.9}
                        >
                          <CameraView
                            ref={cameraRef}
                            style={styles.cameraPreview}
                            facing="front"
                          />
                          <View style={styles.captureOverlay}>
                            <Camera size={28} color={colors.surface} />
                            <Text style={styles.captureBtnText}>TAP TO SCAN</Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.cameraPlaceholder} onPress={handleTakeSelfie}>
                          <Camera size={48} color={colors.text} opacity={0.5} />
                          <Text style={styles.cameraPlaceholderText}>Tap to Enable Camera</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  <Text style={styles.bvnInfoText}>
                    {selfieUri ? 'Selfie captured successfully!' : 'Tap to take a quick selfie scan.'}
                  </Text>
                  {selfieUri && (
                    <TouchableOpacity onPress={() => setSelfieUri(null)}>
                      <Text style={{ color: colors.primary, fontFamily: DT.typography.heading }}>Retake</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {currentStep === 1 && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>YOUR PRIMARY AREA</Text>
                  <TextInput
                    style={[styles.bvnInput, { color: colors.text, fontSize: 18, letterSpacing: 1 }]}
                    placeholder="e.g. 15 Awolowo Road, Ikoyi"
                    placeholderTextColor={colors.muted}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={2}
                  />
                  <TouchableOpacity 
                    style={[styles.gpsBtn, isGettingLocation && { opacity: 0.7 }]} 
                    onPress={handleGetLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <ActivityIndicator color={colors.surface} />
                    ) : (
                      <>
                        <MapPin size={20} color={colors.surface} />
                        <Text style={styles.gpsBtnText}>Use Current Location</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {currentStep === 2 && (
                <View style={styles.transportGrid}>
                  {transports.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.transportChip, transport === t && styles.transportChipActive]}
                      onPress={() => setTransport(t)}
                    >
                      <Text style={[styles.transportText, transport === t && styles.transportTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {currentStep === 3 && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>SET YOUR HOURLY RATE (₦)</Text>
                  <View style={styles.rateInputRow}>
                    <Text style={styles.rateSymbol}>₦</Text>
                    <TextInput
                      style={[styles.bvnInput, { color: colors.text, flex: 1, letterSpacing: 0, fontSize: 32 }]}
                      keyboardType="number-pad"
                      placeholder="1500"
                      placeholderTextColor={colors.muted}
                      value={hourlyRate}
                      onChangeText={setHourlyRate}
                    />
                    <Text style={styles.rateUnit}>/hr</Text>
                  </View>
                  <Text style={styles.rateHint}>
                    Most runners charge between ₦1,000 and ₦3,000 per hour.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.nextBtn, 
                  (
                    (currentStep === 0 && bvnPhase === 0 && bvn.length !== 11) || 
                    (currentStep === 0 && bvnPhase === 1 && !verificationMethod) || 
                    (currentStep === 0 && bvnPhase === 2 && verificationMethod === 'otp' && otp.length !== 6) || 
                    (currentStep === 0 && bvnPhase === 2 && verificationMethod === 'liveness' && !selfieUri) ||
                    (currentStep === 1 && address.length < 5) ||
                    (currentStep === 2 && !transport) ||
                    (currentStep === 3 && (isNaN(Number(hourlyRate)) || Number(hourlyRate) < 500))
                  ) && styles.nextBtnDisabled
                ]}
                onPress={async () => {
                  if (currentStep === 0) {
                    if (bvnPhase === 0) setBvnPhase(1);
                    else if (bvnPhase === 1) {
                      if (verificationMethod === 'otp') sendOtp();
                      else setBvnPhase(2);
                    }
                    else if (bvnPhase === 2) setCurrentStep(c => c + 1);
                  } else if (currentStep < 3) {
                    setCurrentStep(c => c + 1);
                  } else {
                    // Final step — submit to backend
                    setIsSubmitting(true);
                    try {
                      const res = await fetch(`${API.API_URL}/runner-applications/apply`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          bvn,
                          home_address: address,
                          transport_mode: transport,
                          hourly_rate: Number(hourlyRate),
                          verification_method: verificationMethod || 'otp',
                        }),
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.detail || `Error ${res.status}`);
                      }
                      setCurrentStep(4); // Show success screen
                    } catch (e: any) {
                      showAlert('Submission Failed', e.message || 'Please try again.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }
                }}
                disabled={
                  (currentStep === 0 && bvnPhase === 0 && bvn.length !== 11) || 
                  (currentStep === 0 && bvnPhase === 1 && !verificationMethod) || 
                  (currentStep === 0 && bvnPhase === 2 && verificationMethod === 'otp' && otp.length !== 6) || 
                  (currentStep === 0 && bvnPhase === 2 && verificationMethod === 'liveness' && !selfieUri) ||
                  (currentStep === 1 && address.length < 5) ||
                  (currentStep === 2 && !transport) ||
                  (currentStep === 3 && (isNaN(Number(hourlyRate)) || Number(hourlyRate) < 500))
                }
              >
                <Text style={styles.nextBtnText}>
                  {isSubmitting
                    ? <ActivityIndicator color={colors.surface} />
                    : currentStep === 3
                      ? 'Submit Application'
                      : currentStep === 0 && bvnPhase === 2 && verificationMethod === 'liveness'
                        ? 'Verify Identity'
                        : 'Continue'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {currentStep === 4 && (
            <View style={styles.successBox}>
              <View style={styles.successCircle}>
                <CheckCircle2 size={64} color={colors.surface} strokeWidth={3} />
              </View>
              <Text style={styles.successTitle}>Application Submitted!</Text>
              <Text style={styles.successSub}>
                We'll verify your details within 24 hours.{'\n'}
                You'll get a notification when you're approved.
              </Text>
              <TouchableOpacity 
                style={[styles.nextBtn, { width: '100%', marginTop: 20 }]} 
                onPress={() => {
                  refreshUser();
                  router.back();
                }}
              >
                <Text style={styles.nextBtnText}>Back to Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
          </View>
        </TouchableWithoutFeedback>
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
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.md,
    borderBottomWidth: 2, borderBottomColor: colors.text,
  },
  backBtn: {
    width: 40, height: 40, borderWidth: 2, borderColor: colors.text,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.text },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 40 },
  hero: {
    alignItems: 'center', borderWidth: 2, borderColor: colors.text,
    backgroundColor: colors.primary, padding: DT.spacing.xl, marginBottom: DT.spacing.lg,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  heroEmoji: { fontSize: 56, marginBottom: DT.spacing.md },
  heroTitle: { fontFamily: DT.typography.heading, fontSize: 28, color: colors.surface, textAlign: 'center', marginBottom: DT.spacing.md },
  heroSub: { fontFamily: DT.typography.body, fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
  statsRow: {
    flexDirection: 'row', borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
    marginBottom: DT.spacing.lg,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: DT.spacing.md },
  statBorder: { borderRightWidth: 2, borderRightColor: colors.text },
  statValue: { fontFamily: DT.typography.heading, fontSize: 20, color: colors.text },
  statLabel: { fontFamily: DT.typography.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  sectionLabel: {
    fontFamily: DT.typography.heading, fontSize: 11, color: colors.muted, letterSpacing: 1.5, marginBottom: DT.spacing.md,
  },
  stepCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: DT.spacing.md,
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
    padding: DT.spacing.md, marginBottom: DT.spacing.sm,
  },
  stepNum: {
    width: 24, height: 24, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumText: { fontFamily: DT.typography.heading, fontSize: 12, color: colors.text },
  stepInfo: { flex: 1 },
  stepTitle: { fontFamily: DT.typography.heading, fontSize: 14, color: colors.text },
  stepDesc: { fontFamily: DT.typography.body, fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 18 },
  startBtn: {
    height: 56, backgroundColor: colors.secondary, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center', marginTop: DT.spacing.lg,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  startBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: colors.surface },
  progressTrack: { height: 4, backgroundColor: colors.background, borderBottomWidth: 2, borderBottomColor: colors.text },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  stepContent: { flex: 1, paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.xl, gap: DT.spacing.md },
  stepIconCircle: {
    width: 72, height: 72, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  bigStepTitle: { fontFamily: DT.typography.heading, fontSize: 24, color: colors.text },
  bigStepDesc: { fontFamily: DT.typography.body, fontSize: 15, color: colors.muted, lineHeight: 24 },
  
  inputWrapper: { marginTop: DT.spacing.md },
  inputLabel: { fontFamily: DT.typography.heading, fontSize: 13, color: colors.text, marginBottom: 8, letterSpacing: 1 },
  bvnInput: {
    height: 64, borderWidth: 3, borderColor: colors.text, backgroundColor: colors.surface,
    paddingHorizontal: DT.spacing.md, fontFamily: DT.typography.heading, fontSize: 24, letterSpacing: 4,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  bvnInfoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.background,
    borderWidth: 2, borderColor: colors.text, borderStyle: 'dashed', padding: DT.spacing.sm, marginTop: DT.spacing.md,
  },
  bvnInfoText: { fontFamily: DT.typography.bodySemiBold, fontSize: 12, color: colors.text },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, paddingVertical: DT.spacing.md,
    borderWidth: 2, borderColor: colors.text, marginTop: DT.spacing.md,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  gpsBtnText: {
    fontFamily: DT.typography.heading, fontSize: 16, color: colors.surface,
  },

  transportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: DT.spacing.sm, marginTop: 12 },
  transportChip: {
    paddingHorizontal: DT.spacing.md, paddingVertical: DT.spacing.sm,
    borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface,
  },
  transportChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  transportText: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.text },
  transportTextActive: { color: colors.surface },
  nextBtn: {
    height: 56, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  nextBtnDisabled: { backgroundColor: colors.muted, shadowOpacity: 0, elevation: 0 },
  nextBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: colors.surface },
  successBox: { alignItems: 'center', gap: DT.spacing.lg, paddingTop: DT.spacing.xl, paddingHorizontal: DT.spacing.md },
  successCircle: { 
    width: 120, height: 120, borderRadius: 60, backgroundColor: colors.secondary, 
    alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.text,
    shadowColor: colors.text, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0,
  },
  successTitle: { fontFamily: DT.typography.heading, fontSize: 26, color: colors.text, textAlign: 'center' },
  successSub: { fontFamily: DT.typography.body, fontSize: 16, color: colors.muted, textAlign: 'center', lineHeight: 24 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md,
    backgroundColor: colors.surface, padding: DT.spacing.lg,
    borderWidth: 3, borderColor: colors.text, marginBottom: DT.spacing.sm,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  methodCardActive: {
    backgroundColor: colors.primary, shadowOffset: { width: 0, height: 0 }, elevation: 0, transform: [{ translateX: 4 }, { translateY: 4 }],
  },
  methodTitle: { fontFamily: DT.typography.heading, fontSize: 16, color: colors.text },
  methodTitleActive: { color: colors.surface },
  livenessBox: { alignItems: 'center', gap: DT.spacing.md, marginTop: DT.spacing.sm },
  livenessInstruction: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  livenessOutline: {
    width: 220, height: 280, borderWidth: 4, borderColor: colors.text, borderStyle: 'dotted',
    borderRadius: 110, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  successEmoji: { fontSize: 80 },
  selfiePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
  },
  cameraPreviewContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
    overflow: 'hidden',
    position: 'relative',
  },
  cameraPreview: {
    flex: 1,
  },
  captureOverlay: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 2,
    borderColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  captureBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.surface,
    letterSpacing: 1,
  },
  cameraPlaceholder: {
    alignItems: 'center',
    gap: 12,
  },
  cameraPlaceholderText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.muted,
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DT.spacing.sm,
  },
  rateSymbol: {
    fontFamily: DT.typography.heading,
    fontSize: 24,
    color: colors.text,
  },
  rateUnit: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
    color: colors.muted,
  },
  rateHint: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 8,
  },
  checkIcon: { position: 'absolute', bottom: -10, right: 20, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 2, borderColor: colors.text, zIndex: 10 },
});
