import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DesignTokens as DT } from '../../constants/design';

const messages = [
  { id: '1', name: 'Chinedu O.', lastMsg: 'I am at the market now, I found the...', time: '12:45', unread: true },
  { id: '2', name: 'Amina B.', lastMsg: 'Your package has been delivered.', time: 'Yesterday', unread: false },
  { id: '3', name: 'Tunde S.', lastMsg: 'On my way! ETA 15 mins.', time: 'Mon', unread: false },
];

export default function MessagesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>1</Text>
        </View>
      </View>
      {messages.map((msg) => (
        <TouchableOpacity
          key={msg.id}
          style={styles.messageRow}
          onPress={() => router.push(`/conversation/${msg.id}`)}
        >
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: `https://i.pravatar.cc/150?u=${msg.name}` }}
              style={styles.avatar}
            />
            {msg.unread && <View style={styles.unreadDot} />}
          </View>
          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <Text style={[styles.name, msg.unread && styles.nameBold]}>
                {msg.name}
              </Text>
              <Text style={styles.time}>{msg.time}</Text>
            </View>
            <Text style={styles.lastMsg} numberOfLines={1}>
              {msg.lastMsg}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DT.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: DT.colors.text,
    gap: 10,
  },
  title: {
    fontFamily: DT.typography.heading,
    fontSize: 24,
    color: DT.colors.text,
  },
  badge: {
    width: 22,
    height: 22,
    backgroundColor: DT.colors.primary,
    borderWidth: 2,
    borderColor: DT.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: DT.typography.heading,
    fontSize: 11,
    color: DT.colors.surface,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DT.spacing.md,
    paddingHorizontal: DT.spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: DT.colors.text,
    backgroundColor: DT.colors.background,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: DT.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: DT.colors.text,
  },
  unreadDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    backgroundColor: DT.colors.primary,
    borderWidth: 2,
    borderColor: DT.colors.background,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: DT.colors.text,
  },
  nameBold: {
    fontFamily: DT.typography.bodySemiBold,
  },
  time: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: DT.colors.muted,
  },
  lastMsg: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: DT.colors.muted,
  },
});
