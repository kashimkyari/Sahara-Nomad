import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, CheckCheck, ChevronLeft, Package, Paperclip, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

type Message = {
  id: string;
  text: string;
  from: 'me' | 'them';
  time: string;
  status?: 'sent' | 'read';
};

const mockConversations: Record<string, { name: string; img: string; errandContext: string; price: string; messages: Message[] }> = {
  '1': {
    name: 'Chinedu O.',
    img: 'https://i.pravatar.cc/150?u=chinedu',
    errandContext: '🛒 Mile 12 Tomato Sourcing',
    price: '₦2,500',
    messages: [
      { id: 'm1', text: 'Hello! I accepted your errand. Heading to Mile 12 now.', from: 'them', time: '12:30 PM' },
      { id: 'm2', text: 'Great! Please get the freshest tomatoes — avoid the back stalls.', from: 'me', time: '12:31 PM', status: 'read' },
      { id: 'm3', text: 'No problem. I know exactly where to go. Will send you photos once I get there.', from: 'them', time: '12:33 PM' },
      { id: 'm4', text: 'I am at the market now, I found the best ones!', from: 'them', time: '12:45 PM' },
    ],
  },
  '2': {
    name: 'Amina B.',
    img: 'https://i.pravatar.cc/150?u=amina',
    errandContext: '📦 Dispatch package to Lekki',
    price: '₦4,000',
    messages: [
      { id: 'm1', text: 'Your package has been delivered. Please confirm!', from: 'them', time: 'Yesterday' },
      { id: 'm2', text: 'Confirmed! Thank you so much Amina, you were fast 🙏', from: 'me', time: 'Yesterday', status: 'read' },
    ],
  },
  '3': {
    name: 'Tunde S.',
    img: 'https://i.pravatar.cc/150?u=tunde',
    errandContext: '🍔 Food Pickup (Chicken Republic)',
    price: '₦1,500',
    messages: [
      { id: 'm1', text: 'On my way! ETA 15 mins.', from: 'them', time: 'Mon' },
      { id: 'm2', text: 'Ok, I am downstairs waiting.', from: 'me', time: 'Mon', status: 'sent' },
    ],
  },
};

export default function ConversationScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const styles = getStyles(colors);

  const convo = mockConversations[id as string] ?? mockConversations['1'];
  const [messages, setMessages] = useState<Message[]>(convo.messages);

  useEffect(() => {
    // Simulate user typing after we enter for 'Chinedu'
    if (id === '1') {
      setTimeout(() => setIsTyping(true), 2000);
    }
  }, [id]);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(prev => [
      ...prev,
      { id: `m${Date.now()}`, text: message.trim(), from: 'me', time: 'Just now', status: 'sent' },
    ]);
    setMessage('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Heavy Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={3} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: DT.spacing.md }}
          onPress={() => router.push(`/runner/${id}` as any)}
        >
          <Image source={{ uri: convo.img }} style={styles.headerAvatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{convo.name}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online now</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Errand Context Banner */}
      <View style={styles.errandBannerWrapper}>
        <View style={styles.errandBanner}>
          <View style={styles.errandBannerLeft}>
            <Package size={20} color={colors.text} strokeWidth={2} />
            <View>
              <Text style={styles.errandContextText} numberOfLines={1}>{convo.errandContext}</Text>
              <Text style={styles.errandContextPrice}>{convo.price}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.errandActionBtn}
            onPress={() => router.push(`/waka/${id}` as any)}
          >
            <Text style={styles.errandActionText}>VIEW</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={0}
      >
        {/* Chat History */}
        <ScrollView
          ref={scrollRef}
          style={styles.flex1}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) => {
            const isMe = msg.from === 'me';
            return (
              <View
                key={msg.id}
                style={[styles.bubbleWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}
              >
                {!isMe && (
                  <View style={styles.theirAvatarBox}>
                    <Image source={{ uri: convo.img }} style={styles.theirAvatar} />
                  </View>
                )}

                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.bubbleText, isMe && styles.myBubbleText]}>
                    {msg.text}
                  </Text>
                  <View style={styles.bubbleFooter}>
                    <Text style={[styles.bubbleTime, isMe && styles.myBubbleTime]}>
                      {msg.time}
                    </Text>
                    {isMe && msg.status === 'read' && (
                      <CheckCheck size={14} color={colors.surface} strokeWidth={3} style={{ marginLeft: 4 }} />
                    )}
                    {isMe && msg.status === 'sent' && (
                      <CheckCheck size={14} color={'rgba(255,255,255,0.5)'} strokeWidth={3} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.bubbleWrapper, styles.theirWrapper, { marginTop: 8 }]}>
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>{convo.name.split(' ')[0]} is typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Block */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachmentBtn}>
            <Paperclip size={22} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachmentBtn}>
            <Camera size={22} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor={colors.muted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
          >
            <Send
              size={20}
              color={colors.surface}
              strokeWidth={3}
              style={{ marginLeft: 2 }} // visual centering for send icon
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  flex1: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 3,
    borderBottomColor: colors.text,
    gap: DT.spacing.md,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: colors.text,
  },
  headerInfo: {
    flex: 1
  },
  headerName: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2
  },
  onlineDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.secondary,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  onlineText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 11,
    color: colors.muted,
  },
  errandBannerWrapper: {
    paddingHorizontal: DT.spacing.lg,
    paddingTop: DT.spacing.md,
    paddingBottom: DT.spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  errandBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.sm,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  errandBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DT.spacing.sm,
  },
  errandContextText: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.text,
  },
  errandContextPrice: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  errandActionBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: DT.spacing.md,
  },
  errandActionText: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.surface,
  },
  messagesContent: {
    paddingHorizontal: DT.spacing.md,
    paddingTop: DT.spacing.lg,
    paddingBottom: DT.spacing.xl,
    gap: 16,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: DT.spacing.sm,
  },
  myWrapper: {
    justifyContent: 'flex-end'
  },
  theirWrapper: {
    justifyContent: 'flex-start'
  },
  theirAvatarBox: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.background,
  },
  theirAvatar: {
    width: '100%',
    height: '100%'
  },
  bubble: {
    maxWidth: '78%',
    borderWidth: 3,
    borderColor: colors.text,
    padding: DT.spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 0,
  },
  theirBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 0,
  },
  bubbleText: {
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  myBubbleText: {
    color: colors.surface
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  bubbleTime: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 10,
    color: colors.muted,
  },
  myBubbleTime: {
    color: 'rgba(255,255,255,0.7)'
  },
  typingIndicator: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 40, // align with their bubble ignoring avatar
  },
  typingText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.muted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: DT.spacing.md,
    paddingTop: DT.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 6 : DT.spacing.md, // SafeArea avoidance if needed, assuming bottom edges handled but manual padding is safer
    borderTopWidth: 3,
    borderTopColor: colors.text,
    backgroundColor: colors.background,
    gap: DT.spacing.sm,
  },
  attachmentBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: DT.spacing.md,
    paddingVertical: 12,
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  sendBtn: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  sendBtnDisabled: {
    backgroundColor: colors.muted,
  },
});
