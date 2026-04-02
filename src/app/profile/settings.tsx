import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight, Bell, MapPin, Moon, Globe, LogOut } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';

import API from '../../constants/api';

export default function ProfileSettingsScreen() {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { user, token, signOut, refreshUser } = useAuth();
  const router = useRouter();

  const [notifs, setNotifs] = useState(user?.push_notifications_enabled ?? true);
  const [location, setLocation] = useState(user?.location_services_enabled ?? true);
  const [language, setLanguage] = useState(user?.language ?? 'en');
  const [region, setRegion] = useState(user?.region ?? 'NG');

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
            <Switch 
              value={notifs} 
              onValueChange={(val) => updatePreference('push_notifications_enabled', val)} 
              trackColor={{ false: colors.muted, true: colors.primary }} 
              thumbColor={colors.surface} 
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MapPin size={18} color={colors.surface} strokeWidth={2.5} /></View>
              <View><Text style={styles.settingTitle}>Location Services</Text><Text style={styles.settingSub}>Used to find runners near you</Text></View>
            </View>
            <Switch 
              value={location} 
              onValueChange={(val) => updatePreference('location_services_enabled', val)} 
              trackColor={{ false: colors.muted, true: colors.secondary }} 
              thumbColor={colors.surface} 
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.icon, { backgroundColor: colors.text }]}><Moon size={18} color={colors.surface} strokeWidth={2.5} /></View>
              <View><Text style={styles.settingTitle}>Dark Mode</Text><Text style={styles.settingSub}>Neobrutalist dark experience</Text></View>
            </View>
            <Switch 
              value={isDarkMode} 
              onValueChange={(val) => {
                toggleTheme();
                updatePreference('is_dark_mode', val);
              }} 
              trackColor={{ false: colors.muted, true: colors.text }} 
              thumbColor={colors.surface} 
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
              Alert.alert('Select Language', 'Choose your preferred language', [
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
              Alert.alert('Select Region', 'Choose your primary region', [
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
          <TouchableOpacity style={styles.linkRow}>
            <View style={styles.linkInfo}><Text style={[styles.linkTitle, { color: colors.error }]}>Delete Account</Text><Text style={styles.linkSub}>Permanently removes all your data</Text></View>
            <ChevronRight size={18} color={colors.error} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut size={20} color={colors.surface} strokeWidth={2.5} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Sendam v1.0.0 · Built with ❤️ in Lagos</Text>
      </ScrollView>
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
});
