import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft,
  CheckCircle,
  XCircle,
  MapPin,
  Truck,
  Fingerprint
} from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { MotiView } from 'moti';

export default function AdminRunnerAppsScreen() {
  const { token, isAdmin } = useAuth();
  const router = useRouter();
  const colors = DT.admin;
  const styles = getStyles(colors);

  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApps();
  }, [token]);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await fetch(API.ADMIN.RUNNER_APPS('pending'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApps(data);
      }
    } catch (e) {
      console.error('Fetch apps failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (appId: string, approved: boolean) => {
    Alert.alert(
        approved ? 'Approve Application' : 'Reject Application',
        `Are you sure you want to ${approved ? 'approve' : 'reject'} this runner?`,
        [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: approved ? 'Approve' : 'Reject', 
                style: approved ? 'default' : 'destructive',
                onPress: async () => {
                    try {
                        const res = await fetch(API.ADMIN.APP_REVIEW(appId) + `?approved=${approved}`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.ok) {
                            fetchApps();
                        }
                    } catch (e) {
                        console.error('Review app failed:', e);
                    }
                }
            }
        ]
    );
  };

  const AppCard = ({ item }: { item: any }) => (
    <View style={styles.appCard}>
        <View style={styles.appHeader}>
            <Text style={styles.appName}>{item.full_name}</Text>
            <Text style={styles.appDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.detailRow}>
            <MapPin size={16} color={colors.secondary} />
            <Text style={styles.detailText}>{item.home_address}</Text>
        </View>
        <View style={styles.detailRow}>
            <Truck size={16} color={colors.secondary} />
            <Text style={styles.detailText}>{item.transport_mode.toUpperCase()}</Text>
        </View>
        <View style={styles.detailRow}>
            <Fingerprint size={16} color={colors.secondary} />
            <Text style={styles.detailText}>{item.verification_method.toUpperCase()} - {item.bvn || 'N/A'}</Text>
        </View>

        <View style={styles.actions}>
            <TouchableOpacity 
                style={[styles.reviewBtn, { backgroundColor: colors.error }]} 
                onPress={() => handleReview(item.id, false)}
            >
                <XCircle size={20} color={colors.surface} />
                <Text style={styles.reviewBtnText}>REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.reviewBtn, { backgroundColor: colors.secondary }]} 
                onPress={() => handleReview(item.id, true)}
            >
                <CheckCircle size={20} color={colors.background} />
                <Text style={[styles.reviewBtnText, { color: colors.background }]}>APPROVE</Text>
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RUNNER APPS</Text>
      </View>

      <FlatList
        data={apps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AppCard item={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
            loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : <Text style={styles.emptyText}>No pending applications</Text>
        }
      />
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
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 24, color: colors.text },
  
  list: { padding: DT.spacing.lg, paddingBottom: 60 },
  appCard: {
    backgroundColor: colors.card,
    borderWidth: 3, borderColor: colors.text,
    padding: 16, marginBottom: 20,
    shadowColor: colors.text, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0,
  },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 8 },
  appName: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.text },
  appDate: { fontFamily: DT.typography.body, fontSize: 12, color: colors.muted },
  
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  detailText: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.text },
  
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  reviewBtn: {
    flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: '#000',
  },
  reviewBtnText: { fontFamily: DT.typography.heading, fontSize: 14, color: colors.surface },
  emptyText: { textAlign: 'center', marginTop: 40, fontFamily: DT.typography.body, color: colors.muted },
});
