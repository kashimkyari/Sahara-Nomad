import { CreditCard, HelpCircle, LogOut, Settings, Shield, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/use-theme';
import { DesignTokens as DT } from '../../constants/design';

const menuItems = [
  { icon: CreditCard, label: 'Payment Methods', route: '/profile/payment' },
  { icon: Shield, label: 'Trust & Safety', route: '/profile/safety' },
  { icon: HelpCircle, label: 'Support', route: '/profile/support' },
  { icon: Settings, label: 'Settings', route: '/profile/settings' },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?u=chidi' }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>Chidi Amaechi</Text>
            <Text style={styles.email}>chidi@example.com</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ 4.9</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Errands', value: '24' },
            { label: 'Spent', value: '₦182k' },
            { label: 'Runners', value: '8' },
          ].map((stat, i, arr) => (
            <View key={stat.label} style={[styles.statBox, i < arr.length - 1 && styles.statBoxBorder]}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item, i, arr) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push(item.route as any)}
              >
                <item.icon size={20} color={colors.text} strokeWidth={2} />
                <Text style={styles.menuItemText}>{item.label}</Text>
                <ChevronRight size={16} color={colors.muted} />
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.menuDivider} />}
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={20} color={colors.error} strokeWidth={2} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  title: {
    fontFamily: DT.typography.heading,
    fontSize: 24,
    color: colors.text,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: DT.spacing.lg,
    padding: DT.spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderColor: colors.text,
    overflow: 'hidden',
    marginRight: DT.spacing.md,
  },
  avatar: { width: '100%', height: '100%' },
  profileInfo: { flex: 1 },
  name: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.text },
  email: { fontFamily: DT.typography.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  ratingBadge: {
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: { fontFamily: DT.typography.heading, fontSize: 13, color: colors.text },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: DT.spacing.lg,
    marginBottom: DT.spacing.lg,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: DT.spacing.md,
  },
  statBoxBorder: {
    borderRightWidth: 2,
    borderRightColor: colors.text,
  },
  statValue: { fontFamily: DT.typography.heading, fontSize: 20, color: colors.text },
  statLabel: { fontFamily: DT.typography.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  menu: {
    marginHorizontal: DT.spacing.lg,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    marginBottom: DT.spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DT.spacing.md,
    paddingHorizontal: DT.spacing.md,
    gap: DT.spacing.md,
  },
  menuDivider: { height: 2, backgroundColor: colors.text },
  menuItemText: {
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: DT.spacing.lg,
    padding: DT.spacing.md,
    gap: DT.spacing.md,
    borderWidth: 2,
    borderColor: colors.error,
    backgroundColor: colors.surface,
    marginBottom: DT.spacing.xl,
  },
  logoutText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 15,
    color: colors.error,
  },
});
