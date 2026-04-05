import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Gift, Share2, Copy, CheckCircle2, Info } from 'lucide-react-native';
import { MotiView } from 'moti';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import API from '../constants/api';
import { DesignTokens as DT } from '../constants/design';
import { useTheme } from '../hooks/use-theme';

interface ReferralStats {
  friends_joined: number;
  total_earned: number;
  history: Array<{
    id: string;
    amount: number;
    created_at: string;
    status: string;
  }>;
}

const ReferralScreen = () => {
  const { colors } = useTheme();
  const { user, token, updateUser } = useAuth();
  const router = useRouter();
  
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const referralCode = user?.referral_code;

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API.API_URL}/auth/referrals/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Fetch Referral Stats Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${API.API_URL}/auth/referrals/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Update local user context so it reflects everywhere
        updateUser({ ...user!, referral_code: data.referral_code });
      }
    } catch (error) {
      console.error("Generate Code Error:", error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const onCopy = async () => {
    if (!referralCode) return;
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onShare = async () => {
    if (!referralCode) return;
    try {
      await Share.share({
        message: `Join me on Sahara Nomad! Use my code ${referralCode} to get ₦500 off your first errand. \n\nAccept invite: sendam://signup?ref=${referralCode}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header aligned with payment.tsx */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referrals & Rewards</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Reward Card */}
        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <View style={styles.giftIconBox}>
                <Gift size={32} color={colors.text} strokeWidth={2.5} />
            </View>
            <View>
                <Text style={styles.heroTitle}>GET ₦500</Text>
                <Text style={styles.heroSubtitle}>Invite friends & earn rewards</Text>
            </View>
          </View>
        </MotiView>

        {/* Stats Blocks matching profile stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBlock, { backgroundColor: colors.surface }]}>
            <Text style={styles.statValue}>{stats?.friends_joined || 0}</Text>
            <Text style={styles.statLabel}>FRIENDS JOINED</Text>
          </View>
          <View style={[styles.statBlock, { backgroundColor: colors.accent }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>₦{(stats?.total_earned || 0).toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>TOTAL EARNED</Text>
          </View>
        </View>

        {/* Referral Code Card */}
        <Text style={styles.sectionLabel}>YOUR REFERRAL CODE</Text>
        <View style={styles.codeCard}>
          {referralCode ? (
            <>
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{referralCode}</Text>
                <TouchableOpacity onPress={onCopy} style={styles.copyBtn}>
                  {copied ? (
                    <CheckCircle2 size={24} color={colors.secondary} strokeWidth={2.5} />
                  ) : (
                    <Copy size={24} color={colors.text} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={onShare} style={styles.shareButton}>
                <Share2 size={20} color={colors.surface} strokeWidth={2.5} />
                <Text style={styles.shareButtonText}>Invite your friends</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.noCodeContainer}>
              <Text style={styles.noCodeText}>You don't have a referral code yet.</Text>
              <TouchableOpacity 
                onPress={generateCode} 
                disabled={generating}
                style={[styles.shareButton, { marginTop: 12 }]}
              >
                {generating ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <>
                    <Gift size={20} color={colors.surface} strokeWidth={2.5} />
                    <Text style={styles.shareButtonText}>Generate My Code</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* How It Works List */}
        <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
        <View style={styles.infoCard}>
          {[
            "Share your code with friends",
            "They join and complete their first errand",
            "You both get ₦500 credited to your wallets"
          ].map((text, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={styles.numberCircle}>
                <Text style={styles.numberText}>{i + 1}</Text>
              </View>
              <Text style={styles.infoText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Reward History */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>REWARD HISTORY</Text>
        </View>
        
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: DT.spacing.xl }} />
        ) : stats?.history.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No rewards earned yet.</Text>
          </View>
        ) : (
          stats?.history.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txMain}>
                <Text style={styles.txLabel}>REFERRAL BONUS</Text>
                <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.txAmount}>+₦{tx.amount.toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: DT.spacing.lg, 
    paddingVertical: DT.spacing.md, 
    borderBottomWidth: 2, 
    borderBottomColor: colors.text 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderWidth: 2, 
    borderColor: colors.text, 
    backgroundColor: colors.surface, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.text },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 60 },
  
  heroCard: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.lg,
    marginBottom: DT.spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  giftIconBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 28,
    color: colors.surface,
  },
  heroSubtitle: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DT.spacing.xl,
    gap: DT.spacing.sm,
  },
  statBlock: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    paddingVertical: DT.spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statValue: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
    color: colors.text,
  },
  statLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 1,
    marginTop: 2,
  },

  sectionLabel: { 
    fontFamily: DT.typography.heading, 
    fontSize: 11, 
    color: colors.muted, 
    letterSpacing: 1.5, 
    marginBottom: DT.spacing.md 
  },
  codeCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.md,
    marginBottom: DT.spacing.xl,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DT.spacing.md,
    backgroundColor: colors.background,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  codeText: {
    fontFamily: DT.typography.heading,
    fontSize: 24,
    color: colors.text,
  },
  copyBtn: { padding: 4 },
  shareButton: {
    backgroundColor: colors.text,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  shareButtonText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.surface,
  },
  noCodeContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  noCodeText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.md,
    marginBottom: DT.spacing.xl,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.text,
  },
  infoText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },

  sectionHeader: { marginBottom: DT.spacing.md },
  emptyBox: { 
    padding: DT.spacing.xl, 
    borderWidth: 2, 
    borderColor: colors.text, 
    borderStyle: 'dashed', 
    alignItems: 'center' 
  },
  emptyText: { fontFamily: DT.typography.body, color: colors.muted },
  
  txRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: DT.spacing.md,
    borderBottomWidth: 1, 
    borderBottomColor: colors.text + '20',
  },
  txMain: { flex: 1 },
  txLabel: { fontFamily: DT.typography.bodySemiBold, fontSize: 13, color: colors.text },
  txDate: { fontFamily: DT.typography.body, fontSize: 11, color: colors.muted },
  txAmount: { fontFamily: DT.typography.heading, fontSize: 15, color: colors.secondary },

});

export default ReferralScreen;
