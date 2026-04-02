import { useRouter } from 'expo-router';
import { Bell, ChevronLeft, ChevronRight, Globe, LogOut, MapPin, Moon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignTokens as DT } from '../../constants/design';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/use-theme';

import { BrutalistAlert } from '../../components/ui/BrutalistAlert';
import API from '../../constants/api';

const NeobrutalistToggle = ({ value, onValueChange, activeColor, colors }: any) => {
  const thumbAnim = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(thumbAnim, {
      toValue: value ? 1 : 0,
      friction: 8,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[
        styles_toggle.track,
        {
          backgroundColor: value ? activeColor : colors.background,
          borderColor: colors.text
        }
      ]}
    >
      <Animated.View
        style={[
          styles_toggle.thumb,
          {
            backgroundColor: colors.surface,
            borderColor: colors.text,
            transform: [{ translateX }]
          }
        ]}
      />
    </TouchableOpacity>
  );
};

const styles_toggle = StyleSheet.create({
  track: {
    width: 50,
    height: 28,
    borderWidth: 2,
    borderRadius: 0,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  thumb: {
    width: 22,
    height: 20,
    borderWidth: 2,
    borderRadius: 0,
  },
});

export default function ProfileSettingsScreen() {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { user, token, signOut, refreshUser } = useAuth();
  const router = useRouter();

  const [notifs, setNotifs] = useState(user?.push_notifications_enabled ?? true);
  const [location, setLocation] = useState(user?.location_services_enabled ?? true);
  const [language, setLanguage] = useState(user?.language ?? 'en');
  const [region, setRegion] = useState(user?.region ?? 'NG');
  const [deletionStep, setDeletionStep] = useState(0); // 0: None, 1: Warning, 2: Confirm, 3: Final
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string, message: string, buttons: any[] }>({
    title: '',
    message: '',
    buttons: []
  });
  const [logoutStatus, setLogoutStatus] = useState('Signing Out...');

  const showAlert = (title: string, message: string, buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  useEffect(() => {
    if (user) {
      setNotifs(user.push_notifications_enabled);
      setLocation(user.location_services_enabled);
      setLanguage(user.language);
      setRegion(user.region);
    }
  }, [user]);

  const updatePreference = async (key: string, value: any) => {
    if (!token) return;

    // Optimistic update
    if (key === 'push_notifications_enabled') setNotifs(value);
    if (key === 'location_services_enabled') setLocation(value);
    if (key === 'language') setLanguage(value);
    if (key === 'region') setRegion(value);

    try {
      const response = await fetch(`${API.API_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [key]: value
        }),
      });

      if (!response.ok) throw new Error('Failed to update setting');

      await refreshUser();
    } catch (error) {
      // Revert on error
      if (key === 'push_notifications_enabled') setNotifs(!value);
      if (key === 'location_services_enabled') setLocation(!value);
      console.error(error);
    }
  };

  const handleAccountDeletion = async () => {
    if (!token) return;
    try {
      setIsDeleting(true);
      const response = await fetch(`${API.API_URL}/auth/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) throw new Error('Failed to delete account');

      showAlert('Account Deleted', 'Your account has been permanently removed.', [
        {
          text: 'OK',
          onPress: () => {
            signOut();
            router.replace('/onboarding');
          }
        }
      ]);
    } catch (error: any) {
      showAlert('Error', error.message);
    } finally {
      setIsDeleting(false);
      setDeletionStep(0);
    }
  };

  const handleLogout = () => {
    showAlert('Sign Out', 'Are you sure you want to sign out of SendAm?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive',
        loading: isLoggingOut,
        loadingText: logoutStatus,
        onPress: async () => {
          setIsLoggingOut(true);
          setLogoutStatus('REVOKING TOKENS...');
          try {
            await fetch(`${API.API_URL}/auth/logout`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (e) {
            console.log('Logout error', e);
          }
          await new Promise(resolve => setTimeout(resolve, 600));
          setLogoutStatus('CLEARING CACHE...');
          await new Promise(resolve => setTimeout(resolve, 600));
          setLogoutStatus('SECURELY LOGGING OUT...');
          await new Promise(resolve => setTimeout(resolve, 600));
          signOut();
          router.replace('/onboarding');
          setIsLoggingOut(false);
          setAlertVisible(false);
        } 
      }
    ]);
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.group}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.icon, { backgroundColor: colors.primary }]}><Bell size={18} color={colors.surface} strokeWidth={2.5} /></View>
              <View><Text style={styles.settingTitle}>Push Notifications</Text><Text style={styles.settingSub}>Waka updates & runner messages</Text></View>
            </View>
            <NeobrutalistToggle
              value={notifs}
              onValueChange={(val: boolean) => updatePreference('push_notifications_enabled', val)}
              activeColor={colors.primary}
              colors={colors}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MapPin size={18} color={colors.surface} strokeWidth={2.5} /></View>
              <View><Text style={styles.settingTitle}>Location Services</Text><Text style={styles.settingSub}>Used to find runners near you</Text></View>
            </View>
            <NeobrutalistToggle
              value={location}
              onValueChange={(val: boolean) => updatePreference('location_services_enabled', val)}
              activeColor={colors.secondary}
              colors={colors}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.icon, { backgroundColor: colors.text }]}><Moon size={18} color={colors.surface} strokeWidth={2.5} /></View>
              <View><Text style={styles.settingTitle}>Dark Mode</Text><Text style={styles.settingSub}>Neobrutalist dark experience</Text></View>
            </View>
            <NeobrutalistToggle
              value={isDarkMode}
              onValueChange={(val: boolean) => {
                toggleTheme();
                updatePreference('is_dark_mode', val);
              }}
              activeColor={colors.text}
              colors={colors}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>ACCOUNT</Text>
        <View style={styles.group}>
          {[
            { label: 'Edit Profile', sub: 'Name, bio, photo', route: '/profile/edit' },
            { label: 'Change Phone Number', sub: 'Requires OTP verification', route: '/profile/change-phone' },
            { label: 'Change Password', sub: '••••••••', route: '/profile/change-password' },
            { label: 'Become a Runner', sub: 'Earn by running errands', route: '/profile/become-runner' },
          ].map((item, i, arr) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.linkRow} onPress={() => router.push(item.route as any)}>
                <View style={styles.linkInfo}><Text style={styles.linkTitle}>{item.label}</Text><Text style={styles.linkSub}>{item.sub}</Text></View>
                <ChevronRight size={18} color={colors.muted} />
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>LANGUAGE & REGION</Text>
        <View style={styles.group}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => {
              showAlert('Select Language', 'Choose your preferred language', [
                { text: 'English', onPress: () => updatePreference('language', 'en') },
                { text: 'Hausa', onPress: () => updatePreference('language', 'ha') },
                { text: 'Yoruba', onPress: () => updatePreference('language', 'yo') },
                { text: 'Igbo', onPress: () => updatePreference('language', 'ig') },
                { text: 'Cancel', style: 'cancel' }
              ]);
            }}
          >
            <View style={[styles.icon, { backgroundColor: colors.accent, marginRight: DT.spacing.md }]}><Globe size={18} color={colors.text} strokeWidth={2.5} /></View>
            <View style={styles.linkInfo}><Text style={styles.linkTitle}>Language</Text><Text style={styles.linkSub}>
              {language === 'en' ? 'English' : language === 'ha' ? 'Hausa' : language === 'yo' ? 'Yoruba' : 'Igbo'} (Nigeria)
            </Text></View>
            <ChevronRight size={18} color={colors.muted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => {
              showAlert('Select Region', 'Choose your primary region', [
                { text: 'Nigeria (NG)', onPress: () => updatePreference('region', 'NG') },
                { text: 'Ghana (GH)', onPress: () => updatePreference('region', 'GH') },
                { text: 'Kenya (KE)', onPress: () => updatePreference('region', 'KE') },
                { text: 'Cancel', style: 'cancel' }
              ]);
            }}
          >
            <View style={styles.linkInfo}><Text style={styles.linkTitle}>Region</Text><Text style={styles.linkSub}>{region === 'NG' ? 'Nigeria' : region === 'GH' ? 'Ghana' : 'Kenya'}</Text></View>
            <ChevronRight size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>DANGER ZONE</Text>
        <View style={styles.group}>
          {deletionStep === 0 ? (
            <TouchableOpacity style={styles.linkRow} onPress={() => setDeletionStep(1)}>
              <View style={styles.linkInfo}>
                <Text style={[styles.linkTitle, { color: colors.error }]}>Delete Account</Text>
                <Text style={styles.linkSub}>Permanently removes all your data</Text>
              </View>
              <ChevronRight size={18} color={colors.error} />
            </TouchableOpacity>
          ) : (
            <View style={{ padding: DT.spacing.md }}>
              {deletionStep === 1 && (
                <View>
                  <Text style={[styles.linkTitle, { color: colors.error, fontSize: 16 }]}>Wait! Are you sure?</Text>
                  <Text style={[styles.linkSub, { marginTop: 4, fontSize: 13 }]}>
                    Deleting your account will permanently remove your profile, errand history, and wallet balance. This action cannot be undone.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: DT.spacing.sm, marginTop: DT.spacing.md }}>
                    <TouchableOpacity style={[styles.deleteBtnSecondary, { flex: 1 }]} onPress={() => setDeletionStep(0)}>
                      <Text style={styles.deleteBtnText}>GO BACK</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.deleteBtnPrimary, { flex: 1.5 }]} onPress={() => setDeletionStep(2)}>
                      <Text style={[styles.deleteBtnText, { color: colors.surface }]}>I UNDERSTAND</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {deletionStep === 2 && (
                <View>
                  <Text style={[styles.linkTitle, { color: colors.error, fontSize: 16 }]}>Final Confirmation</Text>
                  <Text style={[styles.linkSub, { marginTop: 4, fontSize: 13 }]}>
                    All your active wakas will be cancelled. If you are a runner, your profile will be deactivated.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: DT.spacing.sm, marginTop: DT.spacing.md }}>
                    <TouchableOpacity style={[styles.deleteBtnSecondary, { flex: 1 }]} onPress={() => setDeletionStep(1)}>
                      <Text style={styles.deleteBtnText}>PREVIOUS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.deleteBtnPrimary, { flex: 1.5, borderColor: colors.error, backgroundColor: colors.error }]} onPress={() => setDeletionStep(3)}>
                      <Text style={[styles.deleteBtnText, { color: colors.surface }]}>CONFIRM ERASE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {deletionStep === 3 && (
                <View>
                  <Text style={[styles.linkTitle, { color: colors.error, fontSize: 16 }]}>Irreversible Action</Text>
                  <Text style={[styles.linkSub, { marginTop: 4, fontSize: 13 }]}>
                    This is the last step. Click the button below to permanently erase your data from SendAm.
                  </Text>
                  <View style={{ gap: DT.spacing.sm, marginTop: DT.spacing.md }}>
                    <TouchableOpacity
                      style={[styles.deleteBtnPrimary, { backgroundColor: colors.text, borderColor: colors.text }]}
                      onPress={handleAccountDeletion}
                      disabled={isDeleting}
                    >
                      <Text style={[styles.deleteBtnText, { color: colors.surface }]}>
                        {isDeleting ? 'ERASING...' : 'PERMANENTLY DELETE ACCOUNT'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.deleteBtnSecondary]} onPress={() => setDeletionStep(0)} disabled={isDeleting}>
                      <Text style={styles.deleteBtnText}>CANCEL</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.surface} strokeWidth={2.5} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Sendam v1.0.0 · Built with ❤️ in Lagos</Text>
      </ScrollView>

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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.md, borderBottomWidth: 2, borderBottomColor: colors.text },
  backBtn: { width: 40, height: 40, borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 20, color: colors.text },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 40 },
  sectionLabel: { fontFamily: DT.typography.heading, fontSize: 11, color: colors.muted, letterSpacing: 1.5, marginBottom: DT.spacing.md },
  group: { borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface, shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: DT.spacing.md },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md, flex: 1 },
  icon: { width: 36, height: 36, borderWidth: 2, borderColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.text },
  settingSub: { fontFamily: DT.typography.body, fontSize: 11, color: colors.muted, marginTop: 1 },
  divider: { height: 2, backgroundColor: colors.text },
  linkRow: { flexDirection: 'row', alignItems: 'center', padding: DT.spacing.md },
  linkInfo: { flex: 1 },
  linkTitle: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.text },
  linkSub: { fontFamily: DT.typography.body, fontSize: 11, color: colors.muted, marginTop: 1 },
  version: { fontFamily: DT.typography.body, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: DT.spacing.lg },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DT.spacing.xl,
    padding: DT.spacing.md,
    gap: DT.spacing.sm,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.error,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  logoutText: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.surface,
  },
  deleteBtnPrimary: {
    padding: DT.spacing.sm,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnSecondary: {
    padding: DT.spacing.sm,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.text,
  },
});
