import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Settings, Shield, CreditCard, HelpCircle, LogOut } from 'lucide-react-native';
import { DesignTokens as theme } from '../../constants/design';

export default function ProfileScreen() {
  const menuItems = [
    { icon: CreditCard, label: 'Payment Methods' },
    { icon: Shield, label: 'Trust & Safety' },
    { icon: HelpCircle, label: 'Support' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <item.icon size={20} color={theme.colors.primary} />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.heading,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.lg,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontFamily: theme.typography.heading,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  email: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.muted,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemText: {
    fontFamily: theme.typography.bodyMedium,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginTop: 'auto',
  },
  logoutText: {
    fontFamily: theme.typography.bodyMedium,
    fontSize: 16,
    color: '#D92D20',
    marginLeft: theme.spacing.lg,
  },
});

