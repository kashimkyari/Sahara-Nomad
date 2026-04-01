import { CreditCard, HelpCircle, LogOut, Settings, Shield, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignTokens as DT } from '../../constants/design';

const menuItems = [
  { icon: CreditCard, label: 'Payment Methods' },
  { icon: Shield, label: 'Trust & Safety' },
  { icon: HelpCircle, label: 'Support' },
  { icon: Settings, label: 'Settings' },
];

export default function ProfileScreen() {
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
          ].map((stat) => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem}>
              <item.icon size={20} color={DT.colors.text} strokeWidth={2} />
              <Text style={styles.menuItemText}>{item.label}</Text>
              <ChevronRight size={16} color={DT.colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={20} color={DT.colors.error} strokeWidth={2} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DT.colors.background,
  },
  header: {
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: DT.colors.text,
  },
  title: {
    fontFamily: DT.typography.heading,
    fontSize: 24,
    color: DT.colors.text,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: DT.spacing.lg,
    padding: DT.spacing.md,
    backgroundColor: DT.colors.surface,
    borderWidth: 2,
    borderColor: DT.colors.text,
    shadowColor: DT.colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderColor: DT.colors.text,
    overflow: 'hidden',
    marginRight: DT.spacing.md,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: DT.colors.text,
  },
  email: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: DT.colors.muted,
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: DT.colors.accent,
    borderWidth: 2,
    borderColor: DT.colors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    fontFamily: DT.typography.heading,
    fontSize: 13,
    color: DT.colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: DT.spacing.lg,
    marginBottom: DT.spacing.lg,
    borderWidth: 2,
    borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: DT.spacing.md,
    borderRightWidth: 2,
    borderRightColor: DT.colors.text,
  },
  statValue: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
    color: DT.colors.text,
  },
  statLabel: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: DT.colors.muted,
    marginTop: 2,
  },
  menu: {
    marginHorizontal: DT.spacing.lg,
    borderWidth: 2,
    borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface,
    marginBottom: DT.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DT.spacing.md,
    paddingHorizontal: DT.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: DT.colors.text,
    gap: DT.spacing.md,
  },
  menuItemText: {
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: DT.colors.text,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: DT.spacing.lg,
    padding: DT.spacing.md,
    gap: DT.spacing.md,
    borderWidth: 2,
    borderColor: DT.colors.error,
    backgroundColor: DT.colors.surface,
    marginBottom: DT.spacing.xl,
  },
  logoutText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 15,
    color: DT.colors.error,
  },
});
