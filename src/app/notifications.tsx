import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, BellOff, CheckCircle2, AlertTriangle, Info } from 'lucide-react-native';
import { DesignTokens as DT } from '../constants/design';
import { useTheme } from '../hooks/use-theme';
import { useAuth } from '../context/AuthContext';
import API from '../constants/api';
import { useBrutalistRefresh } from '../components/ui/BrutalistRefreshControl';
import { MotiView } from 'moti';

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: string;
  unread: boolean;
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token } = useAuth();
  const styles = getStyles(colors);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(API.NOTIFICATIONS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const { refreshControl, refreshBanner, onScroll, refreshing } = useBrutalistRefresh({
    onRefresh: fetchNotifications,
  });

  const markAsRead = async (id: string) => {
    try {
      await fetch(API.NOTIFICATIONS.READ(id), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  };

  const clearAll = async () => {
    try {
      await fetch(API.NOTIFICATIONS.CLEAR_ALL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
    } catch (e) {
      console.error('Error clearing notifications:', e);
    }
  };

  const getTypeIcon = (type: string, color: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} color={color} strokeWidth={2.5} />;
      case 'warning': return <AlertTriangle size={18} color={color} strokeWidth={2.5} />;
      case 'info':
      default: return <Info size={18} color={color} strokeWidth={2.5} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alerts</Text>
        <TouchableOpacity style={styles.clearBtn} onPress={clearAll} disabled={notifications.length === 0}>
          <BellOff size={18} color={notifications.length > 0 ? colors.error : colors.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.flex1}>
        {refreshBanner}
        <MotiView
          animate={{ translateY: refreshing ? 75 : 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          style={styles.flex1}
        >
          <ScrollView 
            contentContainerStyle={styles.scroll} 
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={64} color={colors.muted} strokeWidth={1} />
                <Text style={styles.emptyTitle}>No alerts yet</Text>
                <Text style={styles.emptyBody}>We'll notify you when something important happens.</Text>
              </View>
            ) : (
              notifications.map((note) => (
                <TouchableOpacity 
                  key={note.id} 
                  style={[styles.noteRow, note.unread && styles.noteRowUnread]}
                  onPress={() => {
                    if (note.unread) markAsRead(note.id);
                    // Standard routing
                    router.push(`/notification/${note.id}` as any);
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: note.unread ? colors.primary : colors.surface }]}>
                    {getTypeIcon(note.type, note.unread ? colors.surface : colors.text)}
                  </View>
                  <View style={styles.noteContent}>
                    <View style={styles.noteHeader}>
                      <Text style={styles.noteTitle}>{note.title}</Text>
                      <Text style={styles.noteTime}>{note.time}</Text>
                    </View>
                    <Text style={styles.noteBody} numberOfLines={2}>{note.body}</Text>
                  </View>
                  {note.unread && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1, paddingTop: 10 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.md,
    borderBottomWidth: 2, borderBottomColor: colors.text,
  },
  backBtn: {
    width: 40, height: 40, borderWidth: 2, borderColor: colors.text,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 20, color: colors.text },
  clearBtn: { padding: 8 },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 40 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.text, marginTop: 16 },
  emptyBody: { fontFamily: DT.typography.body, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  noteRow: {
    flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.text,
    padding: DT.spacing.md, marginBottom: DT.spacing.md,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  noteRowUnread: { borderColor: colors.primary },
  iconBox: {
    width: 40, height: 40, borderWidth: 2, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
  },
  noteContent: { flex: 1 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  noteTitle: { fontFamily: DT.typography.heading, fontSize: 14, color: colors.text, flex: 1, marginRight: 8 },
  noteTime: { fontFamily: DT.typography.body, fontSize: 11, color: colors.muted },
  noteBody: { fontFamily: DT.typography.body, fontSize: 13, color: colors.muted, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, backgroundColor: colors.primary, borderRadius: 0, borderWidth: 1, borderColor: colors.text, marginLeft: 8 },
});
