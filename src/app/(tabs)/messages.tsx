import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Pin, Check, CheckCheck } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

const filters = ['All Chats', 'Unread', 'Active Errands', 'Archived'];

const mockMessages = [
  { 
    id: '1', 
    name: 'Chinedu O.', 
    lastMsg: 'I am at the market now, I found the tomatoes you requested.', 
    time: '12:45 PM', 
    unread: true, 
    errandTag: '🛒 Mile 12 Run',
    pinned: true,
    status: 'none' // 'none', 'sent', 'read'
  },
  { 
    id: '2', 
    name: 'Amina B.', 
    lastMsg: 'Your package has been delivered at the front desk.', 
    time: 'Yesterday', 
    unread: false, 
    errandTag: '📦 Dispatch',
    pinned: false,
    status: 'read'
  },
  { 
    id: '3', 
    name: 'Tunde S.', 
    lastMsg: 'On my way! ETA 15 mins.', 
    time: 'Mon', 
    unread: false, 
    errandTag: '🍔 Food Pickup',
    pinned: false,
    status: 'sent'
  },
];

export default function MessagesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Chats');
  
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Messages</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
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
          {mockMessages.map((msg) => (
            <TouchableOpacity
              key={msg.id}
              style={[
                styles.messageCard,
                msg.unread && styles.messageCardUnread
              ]}
              onPress={() => router.push(`/conversation/${msg.id}` as any)}
            >
              <View style={styles.cardHeaderRow}>
                {/* Avatar */}
                <View style={[styles.avatarWrap, msg.unread && styles.avatarWrapUnread]}>
                  <Image
                    source={{ uri: `https://i.pravatar.cc/150?u=${msg.name}` }}
                    style={styles.avatar}
                  />
                  {msg.unread && <View style={styles.avatarDot} />}
                </View>

                {/* Info Block */}
                <View style={styles.infoBlock}>
                  <View style={styles.nameTimeRow}>
                    <Text style={[styles.name, msg.unread && styles.nameBold]}>
                      {msg.name}
                    </Text>
                    <View style={styles.timeWrap}>
                      {msg.pinned && <Pin size={12} color={colors.accent} fill={colors.accent} style={{ marginRight: 4 }} />}
                      <Text style={[styles.time, msg.unread && styles.timeBold]}>{msg.time}</Text>
                    </View>
                  </View>
                  
                  {/* Context Tag */}
                  <View style={styles.errandTagWrap}>
                    <Text style={styles.errandTagText}>{msg.errandTag}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.previewRow}>
                <Text style={[styles.lastMsg, msg.unread && styles.lastMsgUnread]} numberOfLines={1}>
                  {msg.lastMsg}
                </Text>

                {/* Read Receipts Layout */}
                {!msg.unread && msg.status !== 'none' && (
                  <View style={styles.receiptWrap}>
                    {msg.status === 'read' ? (
                      <CheckCheck size={16} color={colors.primary} strokeWidth={3} />
                    ) : (
                      <Check size={16} color={colors.muted} strokeWidth={3} />
                    )}
                  </View>
                )}
              </View>

            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
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
});
