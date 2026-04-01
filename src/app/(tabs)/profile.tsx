import { CreditCard, HelpCircle, LogOut, Settings, Shield } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/theme';

export default function ProfileScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const styles = getStyles(colors, typography, spacing, radius);

  const menuItems = [
    { icon: CreditCard, label: 'Payment Methods' },
    { icon: Shield, label: 'Trust & Safety' },
    { icon: HelpCircle, label: 'Support' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: 'https://i.pravatar.cc/150?u=tobi' }} style={styles.avatar} />
          </View>
          <View>
            <Text style={styles.name}>Tobi Adeola</Text>
            <Text style={styles.email}>tobi@example.com</Text>
          </View>
        </View>

        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <item.icon size={20} color={colors.primary} />
            <Text style={styles.menuItemText}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={20} color="#D92D20" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, typography: any, spacing: any, radius: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 100
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: typography.heading,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.lg,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontFamily: typography.heading,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  email: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.muted,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemText: {
    fontFamily: typography.bodyMedium,
    fontSize: 16,
    color: colors.text,
    marginLeft: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: 'auto',
  },
  logoutText: {
    fontFamily: typography.bodyMedium,
    fontSize: 16,
    color: '#D92D20',
    marginLeft: spacing.lg,
  },
});


