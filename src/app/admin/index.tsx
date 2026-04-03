import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Users, 
  UserCheck, 
  LifeBuoy, 
  ShieldCheck, 
  ChevronLeft,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { MotiView } from 'moti';

export default function AdminDashboard() {
  const { user, token, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const colors = DT.admin;
  const styles = getStyles(colors);

  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRunners: 0,
    activeTickets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/(tabs)');
      return;
    }
    fetchDashboardData();
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch basic counts from admin endpoints
      const [usersRes, appsRes] = await Promise.all([
        fetch(API.ADMIN.USERS, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API.ADMIN.RUNNER_APPS('pending'), { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (usersRes.ok && appsRes.ok) {
        const users = await usersRes.json();
        const apps = await appsRes.json();
        setStats({
          totalUsers: users.length,
          pendingRunners: apps.length,
          activeTickets: 0 // TODO: Fetch from support API
        });
      }
    } catch (e) {
      console.error('Fetch dashboard data failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const AdminCard = ({ title, value, icon: Icon, color, onPress }: any) => (
    <TouchableOpacity style={[styles.statCard, { backgroundColor: color }]} onPress={onPress}>
      <View style={styles.statIconWrap}>
        <Icon size={24} color={colors.text} strokeWidth={2.5} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <View style={styles.statArrow}>
        <ArrowRight size={18} color={colors.text} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSubtitle}>ADMIN CONSOLE</Text>
          <Text style={styles.headerTitle}>DASHBOARD</Text>
        </View>
        <View style={styles.badge}>
            <ShieldCheck size={16} color={colors.accent} />
            <Text style={styles.badgeText}>{isSuperAdmin ? 'SUPER' : 'SUPPORT'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
             <ActivityIndicator color={colors.primary} style={{ marginTop: 100 }} />
        ) : (
          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <View style={styles.statsGrid}>
              <AdminCard 
                title="Total Users" 
                value={stats.totalUsers} 
                icon={Users} 
                color={colors.primary} 
                onPress={() => router.push('/admin/users')}
              />
              <AdminCard 
                title="Pending Runners" 
                value={stats.pendingRunners} 
                icon={UserCheck} 
                color={colors.secondary} 
                onPress={() => router.push('/admin/runner-apps')}
              />
              <AdminCard 
                title="Support Tickets" 
                value={stats.activeTickets} 
                icon={LifeBuoy} 
                color={colors.accent} 
                onPress={() => router.push('/admin/support')}
              />
            </View>

            <View style={styles.sectionHeader}>
                <Activity size={18} color={colors.secondary} />
                <Text style={styles.sectionLabel}>SYSTEM STATUS</Text>
            </View>

            <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>API Service</Text>
                    <View style={styles.statusPill}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.statusPillText}>OPERATIONAL</Text>
                    </View>
                </View>
                <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Push Notifications</Text>
                    <View style={styles.statusPill}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.statusPillText}>ACTIVE</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/admin/users')}>
                <Text style={styles.actionBtnText}>MANAGE ALL USERS</Text>
                <ArrowRight size={20} color={colors.surface} />
            </TouchableOpacity>

          </MotiView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.lg,
    borderBottomWidth: 4, borderBottomColor: colors.text,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 44, height: 44, borderWidth: 3, borderColor: colors.text,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
  },
  headerSubtitle: { fontFamily: DT.typography.heading, fontSize: 12, color: colors.secondary, letterSpacing: 2 },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 24, color: colors.text },
  badge: {
      marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.text, paddingHorizontal: 8, paddingVertical: 4,
      borderWidth: 2, borderColor: colors.accent,
  },
  badgeText: { fontFamily: DT.typography.heading, fontSize: 10, color: colors.accent },
  
  scroll: { padding: DT.spacing.lg, paddingBottom: 60 },
  statsGrid: { gap: 16, marginBottom: 32 },
  statCard: {
    padding: 20, borderWidth: 3, borderColor: colors.text,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    shadowColor: colors.text, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6,
  },
  statIconWrap: {
    width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontFamily: DT.typography.heading, fontSize: 28, color: colors.text },
  statTitle: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.text, opacity: 0.8 },
  statArrow: { marginLeft: 'auto' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionLabel: { fontFamily: DT.typography.heading, fontSize: 14, color: colors.muted, letterSpacing: 1.5 },

  statusCard: {
    backgroundColor: colors.card, borderWidth: 3, borderColor: colors.text,
    padding: 16, gap: 12, marginBottom: 24,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.text },
  statusPill: { 
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.text, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.secondary,
  },
  statusPillText: { fontFamily: DT.typography.heading, fontSize: 10, color: colors.secondary },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary },

  actionBtn: {
      height: 64, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.text,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
      shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  actionBtnText: { fontFamily: DT.typography.heading, fontSize: 16, color: colors.surface },
});
