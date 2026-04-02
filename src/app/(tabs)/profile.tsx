import { 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  Settings, 
  Shield, 
  ChevronRight, 
  Edit3, 
  CheckCircle2, 
  Wallet,
  Plus
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import { DesignTokens as DT } from '../../constants/design';
import API from '../../constants/api';
import { BrutalistAlert } from '../../components/ui/BrutalistAlert';
import { useState } from 'react';

const menuItems = [
  { icon: CreditCard, label: 'Payment Methods', route: '/profile/payment' },
  { icon: Shield, label: 'Trust & Safety', route: '/profile/safety' },
  { icon: HelpCircle, label: 'Support', route: '/profile/support' },
  { icon: Settings, label: 'Settings', route: '/profile/settings' },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, token, signOut } = useAuth();
  const router = useRouter();

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{title: string, message: string, buttons: any[]}>({
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title: string, message: string, buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const handleLogout = () => {
    showAlert('Sign Out', 'Are you sure you want to sign out of Sahara Nomad?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive',
        onPress: () => {
          signOut();
          router.replace('/');
        } 
      }
    ]);
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Details Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
            <View style={styles.avatarBox}>
              <Image
                source={user?.avatar_url 
                  ? { 
                      uri: `${API.API_URL}${user.avatar_url}`,
                      headers: { Authorization: `Bearer ${token}` }
                    } 
                  : { uri: 'https://i.pravatar.cc/150?u=chidi' }
                }
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            </View>
              {/* Loyalty Badge */}
              {user?.loyalty_badge && (
                <View style={styles.loyaltyBadge}>
                  <Text style={styles.loyaltyText}>🏆 {user.loyalty_badge}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.editBtn} 
              onPress={() => router.push('/profile/edit' as any)}
            >
              <Edit3 size={16} color={colors.text} strokeWidth={2.5} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user?.full_name || 'Anonymous User'}</Text>
              {user?.is_verified && (
                <View style={styles.verificationBadge}>
                  <CheckCircle2 size={12} color={colors.surface} strokeWidth={3} />
                  <Text style={styles.verificationText}>Verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.email}>{user?.email || user?.phone_number || 'No email'}</Text>
          </View>
        </View>

        {/* Prominent Wallet Banner */}
        <View style={styles.walletBanner}>
          <View style={styles.walletInfo}>
            <View style={styles.walletHeaderRow}>
              <Wallet size={16} color={colors.text} />
              <Text style={styles.walletLabel}>NAIRA WALLET</Text>
            </View>
            <Text style={styles.walletBalance}>
              ₦{(user?.wallet_balance || 0).toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity style={styles.addFundsBtn}>
            <Plus size={20} color={colors.surface} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Individual Chunky Stats */}
        <View style={styles.statsContainer}>
          {[
            { label: 'ERRANDS', value: user?.errands_count?.toString() || '0' },
            { label: 'SPENT', value: `₦${(user?.spent_total || 0).toLocaleString()}` },
            { label: 'RATING', value: `${Number(user?.stats_rating ?? 2.5).toFixed(1)}★` },
          ].map((stat, i) => (
            <View key={stat.label} style={[
              styles.statBlock,
              i === 1 && { backgroundColor: colors.accent },
              i === 2 && { backgroundColor: colors.secondary }
            ]}>
              <Text style={[styles.statValue, (i === 1 || i === 2) && { color: i === 1 ? colors.text : colors.surface }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, (i === 1 || i === 2) && { color: i === 1 ? colors.text : colors.surface }]}>{stat.label}</Text>
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

        {/* Recent Reviews (If Runner) */}
        {user?.runner_profile?.reviews && user.runner_profile.reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.reviewsTitle}>Recent Reviews</Text>
            {user.runner_profile.reviews.map((review: any) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.reviewer_name || 'Verified User'}</Text>
                  <Text style={styles.reviewRating}>{review.rating}★</Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.surface} strokeWidth={2.5} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: DT.spacing.lg,
    paddingTop: DT.spacing.lg,
    paddingBottom: DT.spacing.md,
  },
  title: {
    fontFamily: DT.typography.heading,
    fontSize: 28,
    color: colors.text,
  },
  profileCard: {
    marginHorizontal: DT.spacing.lg,
    marginTop: DT.spacing.sm,
    marginBottom: DT.spacing.lg,
    padding: DT.spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DT.spacing.md,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderWidth: 3,
    borderColor: colors.text,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  avatar: { width: '100%', height: '100%' },
  loyaltyBadge: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: 6,
    paddingVertical: 2,
    width: 100,
    alignItems: 'center',
  },
  loyaltyText: {
    fontFamily: DT.typography.heading,
    fontSize: 8,
    color: colors.text,
    letterSpacing: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.background,
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  editBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 13,
    color: colors.text,
  },
  profileInfo: {
    marginTop: DT.spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DT.spacing.sm,
    marginBottom: 4,
  },
  name: { 
    fontFamily: DT.typography.heading, 
    fontSize: 22, 
    color: colors.text 
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  verificationText: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  email: { 
    fontFamily: DT.typography.body, 
    fontSize: 14, 
    color: colors.muted 
  },
  walletBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    marginHorizontal: DT.spacing.lg,
    marginBottom: DT.spacing.lg,
    padding: DT.spacing.lg,
    borderWidth: 3,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  walletInfo: {},
  walletHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  walletLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.text,
    letterSpacing: 1.5,
  },
  walletBalance: {
    fontFamily: DT.typography.heading,
    fontSize: 28,
    color: colors.surface,
  },
  addFundsBtn: {
    width: 48,
    height: 48,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: DT.spacing.lg,
    marginBottom: DT.spacing.xl,
    gap: DT.spacing.sm,
  },
  statBlock: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.text,
    alignItems: 'center',
    paddingVertical: DT.spacing.lg,
    paddingHorizontal: 8,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statValue: { 
    fontFamily: DT.typography.heading, 
    fontSize: 18, 
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: { 
    fontFamily: DT.typography.bodySemiBold, 
    fontSize: 10, 
    color: colors.muted,
    letterSpacing: 1,
  },
  menu: {
    marginHorizontal: DT.spacing.lg,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    marginBottom: DT.spacing.xl,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
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
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: DT.spacing.lg,
    padding: DT.spacing.md,
    gap: DT.spacing.sm,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.error,
    marginBottom: DT.spacing.xl,
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
  reviewsSection: {
    marginHorizontal: DT.spacing.lg,
    marginBottom: DT.spacing.xl,
  },
  reviewsTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
    marginBottom: DT.spacing.md,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.md,
    marginBottom: DT.spacing.sm,
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewerName: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.text,
  },
  reviewRating: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.secondary,
  },
  reviewComment: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
  reviewDate: {
    fontFamily: DT.typography.body,
    fontSize: 10,
    color: colors.muted,
  },
});
