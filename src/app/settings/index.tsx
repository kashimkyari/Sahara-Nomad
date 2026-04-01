import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Bell, MapPin, Moon, Globe } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState(true);
  const [location, setLocation] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={DT.colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.group}>
          {/* Notifications toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: DT.colors.primary }]}>
                <Bell size={18} color={DT.colors.surface} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSub}>Waka updates & runner messages</Text>
              </View>
            </View>
            <Switch
              value={notifs}
              onValueChange={setNotifs}
              trackColor={{ false: DT.colors.muted, true: DT.colors.primary }}
              thumbColor={DT.colors.surface}
            />
          </View>

          <View style={styles.divider} />

          {/* Location toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: DT.colors.secondary }]}>
                <MapPin size={18} color={DT.colors.surface} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Location Services</Text>
                <Text style={styles.settingSub}>Used to find runners near you</Text>
              </View>
            </View>
            <Switch
              value={location}
              onValueChange={setLocation}
              trackColor={{ false: DT.colors.muted, true: DT.colors.secondary }}
              thumbColor={DT.colors.surface}
            />
          </View>

          <View style={styles.divider} />

          {/* Dark Mode toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: DT.colors.text }]}>
                <Moon size={18} color={DT.colors.surface} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingSub}>Coming soon</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: DT.colors.muted, true: DT.colors.text }}
              thumbColor={DT.colors.surface}
              disabled
            />
          </View>
        </View>

        {/* Account */}
        <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>ACCOUNT</Text>
        <View style={styles.group}>
          {[
            { label: 'Edit Profile', sub: 'Name, bio, photo', route: '/settings/edit-profile' },
            { label: 'Change Phone Number', sub: 'Requires OTP verification', route: '/settings/change-phone' },
            { label: 'Change Password', sub: '••••••••', route: '/settings/change-password' },
            { label: 'Become a Runner', sub: 'Earn by running errands', route: '/settings/become-runner' },
          ].map((item, i, arr) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.linkRow} onPress={() => router.push(item.route as any)}>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkTitle}>{item.label}</Text>
                  <Text style={styles.linkSub}>{item.sub}</Text>
                </View>
                <ChevronRight size={18} color={DT.colors.muted} />
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Language */}
        <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>LANGUAGE & REGION</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/settings/language' as any)}>
            <View style={[styles.settingIcon, { backgroundColor: DT.colors.accent, marginRight: DT.spacing.md }]}>
              <Globe size={18} color={DT.colors.text} strokeWidth={2.5} />
            </View>
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>Language</Text>
              <Text style={styles.linkSub}>English (Nigeria)</Text>
            </View>
            <ChevronRight size={18} color={DT.colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>DANGER ZONE</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.linkRow}>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkTitle, { color: DT.colors.error }]}>Delete Account</Text>
              <Text style={styles.linkSub}>Permanently removes all your data</Text>
            </View>
            <ChevronRight size={18} color={DT.colors.error} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Sendam v1.0.0 · Built with ❤️ in Lagos</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DT.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.md,
    borderBottomWidth: 2, borderBottomColor: DT.colors.text,
  },
  backBtn: {
    width: 40, height: 40, borderWidth: 2, borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 20, color: DT.colors.text },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: DT.typography.heading, fontSize: 11, color: DT.colors.muted,
    letterSpacing: 1.5, marginBottom: DT.spacing.md,
  },
  group: {
    borderWidth: 2, borderColor: DT.colors.text, backgroundColor: DT.colors.surface,
    shadowColor: DT.colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: DT.spacing.md },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md, flex: 1 },
  settingIcon: {
    width: 36, height: 36, borderWidth: 2, borderColor: DT.colors.text,
    alignItems: 'center', justifyContent: 'center',
  },
  settingTitle: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: DT.colors.text },
  settingSub: { fontFamily: DT.typography.body, fontSize: 11, color: DT.colors.muted, marginTop: 1 },
  divider: { height: 2, backgroundColor: DT.colors.text },
  linkRow: { flexDirection: 'row', alignItems: 'center', padding: DT.spacing.md },
  linkInfo: { flex: 1 },
  linkTitle: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: DT.colors.text },
  linkSub: { fontFamily: DT.typography.body, fontSize: 11, color: DT.colors.muted, marginTop: 1 },
  version: {
    fontFamily: DT.typography.body, fontSize: 12, color: DT.colors.muted,
    textAlign: 'center', marginTop: DT.spacing.xl,
  },
});
