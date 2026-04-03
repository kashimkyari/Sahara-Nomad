import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, Paperclip, Send, CheckCheck } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';

export default function LiveSupportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hey there! How can we help you today? ⚡️', sender: 'support', time: '09:41', is_read: true },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const styles = getStyles(colors);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const newMessage = { 
      id: Date.now().toString(), 
      text: chatInput, 
      sender: 'user', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_read: false
    };
    setMessages([...messages, newMessage]);
    setChatInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mock response flow
    setTimeout(() => setIsTyping(true), 800);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Got it! A member of our team will be with you shortly to help. 🚀",
        sender: 'support',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_read: true
      }]);
    }, 2500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={3} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?u=support' }} 
              style={styles.headerAvatar} 
            />
            <View style={styles.onlineDotOverlay} />
          </View>
          <View>
            <Text style={styles.headerName}>SendAm Support</Text>
            <Text style={styles.headerStatus}>Always online</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollRef}
          style={styles.flex1} 
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <AnimatePresence>
            {messages.map((msg) => {
              const isMe = msg.sender === 'user';
              return (
                <View key={msg.id} style={[styles.bubbleWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
                  {!isMe && (
                    <View style={styles.smallAvatarBox}>
                      <Image source={{ uri: 'https://i.pravatar.cc/150?u=support' }} style={styles.smallAvatar} />
                    </View>
                  )}
                  <MotiView 
                    from={{ opacity: 0, scale: 0.9, translateY: 10 }}
                    animate={{ opacity: 1, scale: 1, translateY: 0 }}
                    style={[
                      styles.bubble, 
                      isMe ? styles.myBubble : styles.theirBubble
                    ]}
                  >
                    <Text style={[styles.bubbleText, isMe && styles.myBubbleText]}>
                      {msg.text}
                    </Text>
                    <View style={styles.bubbleFooter}>
                      <Text style={[styles.bubbleTime, isMe && styles.myBubbleTime]}>
                        {msg.time}
                      </Text>
                      {isMe && (
                        <CheckCheck 
                          size={14} 
                          color={msg.is_read ? colors.surface : 'rgba(255,255,255,0.4)'} 
                          strokeWidth={3} 
                          style={{ marginLeft: 4 }} 
                        />
                      )}
                    </View>
                  </MotiView>
                </View>
              );
            })}
          </AnimatePresence>

          {isTyping && (
            <MotiView 
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              style={[styles.bubbleWrapper, styles.theirWrapper]}
            >
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>Support is typing...</Text>
              </View>
            </MotiView>
          )}
        </ScrollView>

        <View style={styles.chatInputArea}>
          <TouchableOpacity style={styles.attachmentBtn}>
            <Paperclip size={22} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachmentBtn}>
            <Camera size={22} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.chatInput}
            placeholder="Type your message..."
            placeholderTextColor={colors.muted}
            value={chatInput}
            onChangeText={setChatInput}
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity 
            style={[styles.sendBtn, !chatInput.trim() && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!chatInput.trim()}
          >
            <Send size={20} color={colors.surface} strokeWidth={3} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md,
    paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.md,
    borderBottomWidth: 3, borderBottomColor: colors.text, backgroundColor: colors.background,
  },
  backBtn: {
    width: 44, height: 44, borderWidth: 3, borderColor: colors.text,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: DT.spacing.md },
  avatarContainer: { position: 'relative' },
  headerAvatar: { width: 44, height: 44, borderWidth: 2, borderColor: colors.text },
  onlineDotOverlay: {
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12,
    backgroundColor: colors.secondary, borderWidth: 2, borderColor: colors.text, zIndex: 1,
  },
  headerName: { fontFamily: DT.typography.heading, fontSize: 18, color: colors.text },
  headerStatus: { fontFamily: DT.typography.bodySemiBold, fontSize: 11, color: colors.muted },
  chatContent: { paddingHorizontal: DT.spacing.md, paddingTop: DT.spacing.lg, paddingBottom: 30, gap: 16 },
  bubbleWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  myWrapper: { justifyContent: 'flex-end' },
  theirWrapper: { justifyContent: 'flex-start' },
  smallAvatarBox: { width: 32, height: 32, borderWidth: 2, borderColor: colors.text },
  smallAvatar: { width: '100%', height: '100%' },
  bubble: {
    maxWidth: '78%', padding: DT.spacing.md, borderWidth: 3, borderColor: colors.text,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  myBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 0 },
  theirBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 0 },
  bubbleText: { fontFamily: DT.typography.body, fontSize: 15, lineHeight: 22, color: colors.text },
  myBubbleText: { color: colors.surface },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6 },
  bubbleTime: { fontFamily: DT.typography.bodySemiBold, fontSize: 10, color: colors.muted },
  myBubbleTime: { color: 'rgba(255,255,255,0.7)' },
  typingIndicator: {
    backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.text,
    paddingHorizontal: 12, paddingVertical: 8, marginLeft: 40,
  },
  typingText: { fontFamily: DT.typography.bodySemiBold, fontSize: 12, color: colors.muted },
  chatInputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: DT.spacing.md,
    borderTopWidth: 3, borderTopColor: colors.text, backgroundColor: colors.background,
  },
  attachmentBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  chatInput: {
    flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 3, borderColor: colors.text,
    backgroundColor: colors.surface, paddingHorizontal: DT.spacing.md, paddingVertical: 12,
    fontFamily: DT.typography.body, fontSize: 15, color: colors.text,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
  },
  sendBtn: {
    width: 48, height: 48, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
  },
  sendBtnDisabled: { backgroundColor: colors.muted },
});
