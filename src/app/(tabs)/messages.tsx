import React from 'react';
import { View, Text, SafeAreaView, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DesignTokens as theme } from '../../constants/design';

export default function MessagesScreen() {
  const messages = [
    { id: '1', name: 'Chinedu O.', lastMsg: 'I am at the market now, I found the...', time: '12:45' },
    { id: '2', name: 'Amina B.', lastMsg: 'Your package has been delivered.', time: 'Yesterday' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Messages</Text>
        {messages.map((msg) => (
          <TouchableOpacity key={msg.id} style={styles.messageRow}>
            <View style={styles.avatarContainer}>
               <Image source={{ uri: `https://i.pravatar.cc/150?u=${msg.id}` }} style={styles.avatar} />
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.name}>{msg.name}</Text>
                <Text style={styles.time}>{msg.time}</Text>
              </View>
              <Text style={styles.lastMsg} numberOfLines={1}>{msg.lastMsg}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
    marginBottom: theme.spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
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
    fontFamily: theme.typography.heading,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  time: {
    fontFamily: theme.typography.body,
    fontSize: 12,
    color: theme.colors.muted,
  },
  lastMsg: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.muted,
  },
});

