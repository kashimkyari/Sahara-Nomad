import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Pin, Check, CheckCheck } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { ActivityIndicator } from 'react-native';
import { useBrutalistRefresh } from '../../components/ui/BrutalistRefreshControl';

const filters = ['All Chats', 'Unread', 'Active Errands', 'Archived'];


export default function MessagesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Chats');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const styles = getStyles(colors);

  useEffect(() => {
    fetchConversations();
  }, [token]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(API.MESSAGES.CONVERSATIONS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      const data = await res.json();
      setConversations(data);
    } catch (e) {
      console.error('Error fetching conversations:', e);
    } finally {
      setLoading(false);
    }
  };
  const filteredConversations = conversations.filter((c) => {
    const matchQuery = c.other_user?.full_name.toLowerCase().includes(query.toLowerCase()) || 
                       c.last_message_text?.toLowerCase().includes(query.toLowerCase());
    
    if (activeFilter === 'Unread') return matchQuery && c.unread_count > 0;
    if (activeFilter === 'Active Errands') return matchQuery && c.waka_id;
    return matchQuery;
  });

  const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unread_count || 0), 0);

  const { refreshControl, refreshBanner, onScroll } = useBrutalistRefresh({
    onRefresh: fetchConversations,
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Messages</Text>
          {totalUnread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.flex1}>
        {refreshBanner}
        <ScrollView 
        style={styles.flex1} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={refreshControl}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <View style={styles.searchIcon}>
              <Search size={20} color={colors.surface} strokeWidth={3} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>

        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((f) => {
            const isActive = activeFilter === f;
            return (
              <TouchableOpacity 
                key={f} 
                style={[
                  styles.filterChip, 
                  isActive && { backgroundColor: colors.text, borderColor: colors.text }
                ]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[
                  styles.filterChipText, 
                  isActive && { color: colors.surface }
                ]}>
                  {f}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Message Cards List */}
        <View style={styles.messagesContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : filteredConversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>No conversations found.</Text>
            </View>
          ) : (
            filteredConversations.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={[
                  styles.messageCard,
                  conv.unread_count > 0 && styles.messageCardUnread
                ]}
                onPress={() => router.push(`/conversation/${conv.id}` as any)}
              >
                <View style={styles.cardHeaderRow}>
                  {/* Avatar */}
                  <View style={[styles.avatarWrap, conv.unread_count > 0 && styles.avatarWrapUnread]}>
                    <Image
                      source={{ uri: conv.other_user?.avatar_url || `https://i.pravatar.cc/150?u=${conv.other_user?.id}` }}
                      style={styles.avatar}
                    />
                    {conv.unread_count > 0 && <View style={styles.avatarDot} />}
                  </View>
  
                  {/* Info Block */}
                  <View style={styles.infoBlock}>
                    <View style={styles.nameTimeRow}>
                      <Text style={[styles.name, conv.unread_count > 0 && styles.nameBold]}>
                        {conv.other_user?.full_name}
                      </Text>
                      <View style={styles.timeWrap}>
                        {conv.is_pinned && <Pin size={12} color={colors.accent} fill={colors.accent} style={{ marginRight: 4 }} />}
                        <Text style={[styles.time, conv.unread_count > 0 && styles.timeBold]}>
                          {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Context Tag */}
                    {conv.waka_title && (
                      <View style={styles.errandTagWrap}>
                        <Text style={styles.errandTagText}>{conv.waka_emoji} {conv.waka_title}</Text>
                      </View>
                    )}
                  </View>
                </View>
  
                <View style={styles.previewRow}>
                  <Text style={[styles.lastMsg, conv.unread_count > 0 && styles.lastMsgUnread]} numberOfLines={1}>
                    {conv.last_message_text || 'No messages yet'}
                  </Text>
  
                  {/* Read Receipts Layout */}
                  {conv.last_message_status === 'read' && (
                    <View style={styles.receiptWrap}>
                      <CheckCheck size={16} color={colors.primary} strokeWidth={3} />
                    </View>
                  )}
                  {conv.last_message_status === 'sent' && (
                    <View style={styles.receiptWrap}>
                      <Check size={16} color={colors.muted} strokeWidth={3} />
                    </View>
                  )}
                </View>
  
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: DT.spacing.lg,
    paddingTop: DT.spacing.lg,
    paddingBottom: DT.spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: DT.typography.heading,
    fontSize: 28,
    color: colors.text,
  },
  badge: {
    width: 24,
    height: 24,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.surface,
  },
  searchContainer: {
    paddingHorizontal: DT.spacing.lg,
    marginBottom: DT.spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  searchIcon: {
    width: 48,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: DT.spacing.md,
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.text,
  },
  filterScroll: {
    paddingHorizontal: DT.spacing.lg,
    paddingBottom: DT.spacing.lg,
    gap: DT.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.muted,
  },
  filterChipText: {
    fontFamily: DT.typography.heading,
    fontSize: 13,
    color: colors.text,
  },
  messagesContainer: {
    paddingHorizontal: DT.spacing.lg,
    gap: DT.spacing.lg,
  },
  messageCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.md,
  },
  messageCardUnread: {
    borderWidth: 3,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DT.spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: DT.spacing.md,
  },
  avatarWrapUnread: {
    marginRight: DT.spacing.md + 2, // compensate for thicker border difference if needed
  },
  avatar: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderColor: colors.text,
  },
  avatarDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
    borderRadius: 0,
  },
  infoBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  nameTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontFamily: DT.typography.body,
    fontSize: 16,
    color: colors.text,
  },
  nameBold: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.muted,
  },
  timeBold: {
    fontFamily: DT.typography.bodySemiBold,
    color: colors.primary,
  },
  errandTagWrap: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.text,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  errandTagText: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.text,
    letterSpacing: 0.5,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: DT.spacing.sm,
    borderWidth: 2,
    borderColor: colors.text,
    marginTop: 4,
  },
  lastMsg: {
    flex: 1,
    fontFamily: DT.typography.body,
    fontSize: 14,
    color: colors.muted,
  },
  lastMsgUnread: {
    fontFamily: DT.typography.bodySemiBold,
    color: colors.text,
  },
  receiptWrap: {
    marginLeft: DT.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.muted,
  },
});
