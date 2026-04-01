import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/theme';

export default function MessagesScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const styles = getStyles(colors, typography, spacing, radius);

  const messages = [
    { id: '1', name: 'Chinedu O.', lastMsg: 'I am at the market now, I found the...', time: '12:45' },
    { id: '2', name: 'Amina B.', lastMsg: 'Your package has been delivered.', time: 'Yesterday' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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

const getStyles = (colors: any, typography: any, spacing: any, radius: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: typography.heading,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
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
    fontFamily: typography.heading,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  time: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.muted,
  },
  lastMsg: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.muted,
  },
});


