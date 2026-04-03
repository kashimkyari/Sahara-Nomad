import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft,
  Search,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  MoreVertical,
  User
} from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { MotiView } from 'moti';

export default function AdminUsersScreen() {
  const { token, isSuperAdmin } = useAuth();
  const router = useRouter();
  const colors = DT.admin;
  const styles = getStyles(colors);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(API.ADMIN.USERS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Fetch users failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    if (!isSuperAdmin) {
        Alert.alert('Permission Denied', 'Only Super Admins can assign roles.');
        return;
    }

    const roles = ['user', 'support_admin', 'super_admin'];
    const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];

    Alert.alert(
        'Update Role',
        `Change role from ${currentRole} to ${nextRole}?`,
        [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Update', 
                onPress: async () => {
                    try {
                        const res = await fetch(API.ADMIN.UPDATE_ROLE(userId), {
                            method: 'POST',
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ role: nextRole })
                        });
                        if (res.ok) {
                            fetchUsers();
                        }
                    } catch (e) {
                        console.error('Update role failed:', e);
                    }
                }
            }
        ]
    );
  };

  const UserRow = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
        <View style={styles.userAvatar}>
            <User size={24} color={colors.text} />
        </View>
        <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.full_name}</Text>
            <Text style={styles.userEmail}>{item.email || item.phone_number}</Text>
            <View style={styles.roleRow}>
                <View style={[styles.roleBadge, { backgroundColor: item.role === 'super_admin' ? colors.accent : item.role === 'support_admin' ? colors.secondary : colors.surface }]}>
                    <Text style={[styles.roleText, { color: item.role === 'user' ? colors.text : colors.background }]}>{item.role.toUpperCase()}</Text>
                </View>
                {item.is_runner && (
                    <View style={styles.runnerBadge}>
                        <Text style={styles.runnerText}>RUNNER</Text>
                    </View>
                )}
            </View>
        </View>
        <TouchableOpacity 
            style={styles.moreBtn}
            onPress={() => handleUpdateRole(item.id, item.role)}
        >
            <ShieldAlert size={20} color={colors.primary} />
        </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ALL USERS</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserRow item={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
            loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : <Text style={styles.emptyText}>No users found</Text>
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
  userCard: {
    backgroundColor: colors.card,
    borderWidth: 3, borderColor: colors.text,
    padding: 16, marginBottom: 16,
    flexDirection: 'row', gap: 16, alignItems: 'center',
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
  },
  userAvatar: {
    width: 50, height: 50, backgroundColor: colors.surface,
    borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
  },
  userInfo: { flex: 1 },
  userName: { fontFamily: DT.typography.heading, fontSize: 16, color: colors.text },
  userEmail: { fontFamily: DT.typography.body, fontSize: 12, color: colors.muted, marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.text,
  },
  roleText: { fontFamily: DT.typography.heading, fontSize: 10 },
  runnerBadge: {
    backgroundColor: colors.text,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.secondary,
  },
  runnerText: { fontFamily: DT.typography.heading, fontSize: 10, color: colors.secondary },
  moreBtn: { padding: 8 },
  emptyText: { textAlign: 'center', marginTop: 40, fontFamily: DT.typography.body, color: colors.muted },
});
