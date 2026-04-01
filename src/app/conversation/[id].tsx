import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Send, Paperclip, Image as ImageIcon } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';

type Message = {
  id: string;
  text: string;
  from: 'me' | 'them';
  time: string;
};

const mockConversations: Record<string, { name: string; img: string; messages: Message[] }> = {
  '1': {
    name: 'Chinedu O.',
    img: 'https://i.pravatar.cc/150?u=chinedu',
    messages: [
      { id: 'm1', text: 'Hello! I accepted your errand. Heading to Mile 12 now.', from: 'them', time: '12:30' },
      { id: 'm2', text: 'Great! Please get the freshest tomatoes — avoid the back stalls.', from: 'me', time: '12:31' },
      { id: 'm3', text: 'No problem. I know exactly where to go. Will send you photos once I get there.', from: 'them', time: '12:33' },
      { id: 'm4', text: 'I am at the market now, I found the best ones!', from: 'them', time: '12:45' },
      { id: 'm5', text: 'Perfect! How long before you get to me?', from: 'me', time: '12:46' },
      { id: 'm6', text: 'About 45 minutes depending on traffic from Ketu.', from: 'them', time: '12:48' },
    ],
  },
  '2': {
    name: 'Amina B.',
    img: 'https://i.pravatar.cc/150?u=amina',
    messages: [
      { id: 'm1', text: 'Your package has been delivered. Please confirm!', from: 'them', time: 'Yesterday' },
      { id: 'm2', text: 'Confirmed! Thank you so much Amina, you were fast 🙏', from: 'me', time: 'Yesterday' },
    ],
  },
  '3': {
    name: 'Tunde S.',
    img: 'https://i.pravatar.cc/150?u=tunde',
    messages: [
      { id: 'm1', text: 'On my way! ETA 15 mins.', from: 'them', time: 'Mon' },
      { id: 'm2', text: 'Ok, I am downstairs waiting.', from: 'me', time: 'Mon' },
    ],
  },
};

export default function ConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const convo = mockConversations[id as string] ?? mockConversations['1'];
  const [messages, setMessages] = useState<Message[]>(convo.messages);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(prev => [
      ...prev,
      { id: `m${Date.now()}`, text: message.trim(), from: 'me', time: 'Now' },
    ]);
    setMessage('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={DT.colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Image source={{ uri: convo.img }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{convo.name}</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.flex1}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.bubbleWrapper,
                msg.from === 'me' ? styles.myWrapper : styles.theirWrapper,
              ]}
            >
              {msg.from === 'them' && (
                <Image source={{ uri: convo.img }} style={styles.bubbleAvatar} />
              )}
              <View style={[styles.bubble, msg.from === 'me' ? styles.myBubble : styles.theirBubble]}>
                <Text style={[styles.bubbleText, msg.from === 'me' && styles.myBubbleText]}>
                  {msg.text}
                </Text>
                <Text style={[styles.bubbleTime, msg.from === 'me' && styles.myBubbleTime]}>
                  {msg.time}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={DT.colors.muted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Send
              size={20}
              color={message.trim() ? DT.colors.surface : DT.colors.muted}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DT.colors.background },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: DT.colors.text,
    backgroundColor: DT.colors.background,
    gap: DT.spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: DT.colors.text,
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: DT.colors.text,
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: {
    width: 7,
    height: 7,
    backgroundColor: DT.colors.secondary,
    borderRadius: 0,
  },
  onlineText: {
    fontFamily: DT.typography.body,
    fontSize: 11,
    color: DT.colors.secondary,
  },
  messagesContent: {
    paddingHorizontal: DT.spacing.md,
    paddingVertical: DT.spacing.md,
    gap: DT.spacing.sm,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: DT.spacing.sm,
    gap: DT.spacing.sm,
  },
  myWrapper: { justifyContent: 'flex-end' },
  theirWrapper: { justifyContent: 'flex-start' },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: DT.colors.text,
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '75%',
    borderWidth: 2,
    borderColor: DT.colors.text,
    padding: DT.spacing.sm,
    shadowColor: DT.colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  myBubble: { backgroundColor: DT.colors.primary },
  theirBubble: { backgroundColor: DT.colors.surface },
  bubbleText: {
    fontFamily: DT.typography.body,
    fontSize: 14,
    color: DT.colors.text,
    lineHeight: 20,
  },
  myBubbleText: { color: DT.colors.surface },
  bubbleTime: {
    fontFamily: DT.typography.body,
    fontSize: 10,
    color: DT.colors.muted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myBubbleTime: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    borderTopWidth: 2,
    borderTopColor: DT.colors.text,
    backgroundColor: DT.colors.background,
    gap: DT.spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 2,
    borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface,
    paddingHorizontal: DT.spacing.md,
    paddingVertical: DT.spacing.sm,
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: DT.colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: DT.colors.primary,
    borderWidth: 2,
    borderColor: DT.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DT.colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
});
