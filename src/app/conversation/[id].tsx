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
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { ActivityIndicator } from 'react-native';


export default function ConversationScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id: convoId } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<any>(null);
  
  const scrollRef = useRef<ScrollView>(null);
  const ws = useRef<WebSocket | null>(null);
  const styles = getStyles(colors);

  useEffect(() => {
    fetchHistory();
    if (token) connectWebSocket(token);
    return () => {
      ws.current?.close();
    };
  }, [convoId, token]);

  const fetchHistory = async () => {
    try {
      // First get conversations list to find this specific one (optional if we had a GET /conversations/{id})
      const convsRes = await fetch(API.MESSAGES.CONVERSATIONS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const convs = await convsRes.json();
      const currentConv = convs.find((c: any) => c.id === convoId);
      if (currentConv) setConversation(currentConv);

      const res = await fetch(API.MESSAGES.HISTORY(convoId!), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error('Error fetching history:', e);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = (authToken: string) => {
    if (!convoId) return;
    
    // In a real app, you might want to reconnect on error
    ws.current = new WebSocket(API.MESSAGES.WS(convoId, authToken));
    
    ws.current.onmessage = (e) => {
      const newMsg = JSON.parse(e.data);
      setMessages(prev => {
        // Avoid duplicates if HTTP send already added it
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    ws.current.onerror = (e) => {
      console.error('WS Error:', e);
    };
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const content = message.trim();
    setMessage('');

    try {
      // Use HTTP for sending to ensure easy DB persistence and broadcast logic on backend
      const res = await fetch(API.MESSAGES.SEND, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation_id: convoId,
          content_text: content,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to send message');
      
      const sentMsg = await res.json();
      // Optimistically add or let WS handle it? 
      // Let's add it if not already there (though WS is usually fast)
      setMessages(prev => {
        if (prev.find(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error('Send error:', e);
      // Fallback: restore message to input or show error
    }
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
          onPress={() => router.push(`/runner/${conversation?.other_user?.id}` as any)}
        >
          <Image 
            source={{ uri: conversation?.other_user?.avatar_url || `https://i.pravatar.cc/150?u=${conversation?.other_user?.id}` }} 
            style={styles.headerAvatar} 
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{conversation?.other_user?.full_name || 'Loading...'}</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: conversation?.other_user?.is_online ? colors.secondary : colors.muted }]} />
              <Text style={styles.onlineText}>{conversation?.other_user?.is_online ? 'Online now' : 'Offline'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Errand Context Banner */}
      {conversation?.waka_title && (
        <View style={styles.errandBannerWrapper}>
          <View style={styles.errandBanner}>
            <View style={styles.errandBannerLeft}>
              <Package size={20} color={colors.text} strokeWidth={2} />
              <View>
                <Text style={styles.errandContextText} numberOfLines={1}>{conversation.waka_emoji} {conversation.waka_title}</Text>
                <Text style={styles.errandContextPrice}>View Errands Details</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.errandActionBtn}
              onPress={() => router.push(`/waka/${conversation.waka_id}` as any)}
            >
              <Text style={styles.errandActionText}>VIEW</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <View
                  key={msg.id}
                  style={[styles.bubbleWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}
                >
                  {!isMe && (
                    <View style={styles.theirAvatarBox}>
                      <Image 
                        source={{ uri: conversation?.other_user?.avatar_url || `https://i.pravatar.cc/150?u=${msg.sender_id}` }} 
                        style={styles.theirAvatar} 
                      />
                    </View>
                  )}

                  <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.bubbleText, isMe && styles.myBubbleText]}>
                      {msg.content_text}
                    </Text>
                    <View style={styles.bubbleFooter}>
                      <Text style={[styles.bubbleTime, isMe && styles.myBubbleTime]}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      {isMe && msg.is_read && (
                        <CheckCheck size={14} color={colors.surface} strokeWidth={3} style={{ marginLeft: 4 }} />
                      )}
                      {isMe && !msg.is_read && (
                        <CheckCheck size={14} color={'rgba(255,255,255,0.5)'} strokeWidth={3} style={{ marginLeft: 4 }} />
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {isTyping && (
            <View style={[styles.bubbleWrapper, styles.theirWrapper, { marginTop: 8 }]}>
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>{conversation?.other_user?.full_name?.split(' ')[0]} is typing...</Text>
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
