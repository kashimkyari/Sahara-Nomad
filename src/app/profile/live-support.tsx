import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Camera, Paperclip, Send, CheckCheck } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Modal, Pressable } from 'react-native';
import { FileText, ExternalLink, Play, Pause, Music, Trash2 } from 'lucide-react-native';
import { useAudioPlayerStatus } from 'expo-audio';
import AudioModule from 'expo-audio/build/AudioModule';
import { BrutalistAlert } from '../../components/ui/BrutalistAlert';

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id?: string;
  content_text: string;
  attachment_url?: string;
  attachment_metadata?: {
    duration?: number;
    [key: string]: any;
  };
  is_deleted: boolean;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// --- Small Audio Player Component ---
const AudioPlayer = (props: any) => {
  const [hasStarted, setHasStarted] = useState(false);
  const player = useMemo(() => {
    if (!hasStarted) return null;
    return new (AudioModule as any).AudioPlayer({ uri: props.uri }, 100, true);
  }, [hasStarted, props.uri]);

  if (!hasStarted || !player) {
    return (
      <View style={[props.styles.audioContainer, props.isMe ? props.styles.myAudio : props.styles.theirAudio]}>
        <TouchableOpacity style={props.styles.audioIconBox} onPress={() => setHasStarted(true)}>
          <Play size={20} color={props.colors.text} fill={props.colors.text} strokeWidth={3} />
        </TouchableOpacity>
        <View style={{ flex: 1, gap: 8 }}>
          <View style={props.styles.waveformRow}>
            {/* Static Waveform */}
            {Array.from({ length: 40 }).map((_, i) => (
              <View 
                key={i} 
                style={[props.styles.waveformBar, { height: 12 + Math.random() * 20, backgroundColor: 'rgba(0,0,0,0.1)', borderWidth: 1.5, borderColor: props.colors.text }]} 
              />
            ))}
          </View>
          <Text style={props.styles.audioTimeText}>
            {props.initialDuration ? `${Math.floor(props.initialDuration / 60)}:${(props.initialDuration % 60).toString().padStart(2, '0')}` : '0:00'}
          </Text>
        </View>
      </View>
    );
  }

  return <ActiveAudioPlayer {...props} player={player} />;
};

const ActiveAudioPlayer = ({ player, uri, isMe, colors, styles, initialDuration, onLongPress }: any) => {
  const { playing, duration, currentTime, isBuffering } = useAudioPlayerStatus(player);
  const [audioDuration, setAudioDuration] = useState(initialDuration || 0);

  useEffect(() => {
    if (duration > 0) setAudioDuration(duration);
  }, [duration]);

  useEffect(() => {
    return () => {
      if (player) {
        if (typeof player.release === 'function') {
          player.release();
        } else if (typeof player.remove === 'function') {
          player.remove();
        }
      }
    };
  }, [player]);

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;
  
  const bars = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    height: 12 + Math.random() * 26
  })), []);

  const togglePlayback = () => {
    if (playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={[styles.audioContainer, isMe ? styles.myAudio : styles.theirAudio]}>
      <TouchableOpacity 
        style={styles.audioIconBox} 
        onPress={togglePlayback}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {isBuffering ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : playing ? (
          <Pause size={20} color={colors.text} fill={colors.text} strokeWidth={3} />
        ) : (
          <Play size={20} color={colors.text} fill={colors.text} strokeWidth={3} />
        )}
      </TouchableOpacity>

      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.waveformRow}>
          {bars.map((bar, i) => {
            const isFilled = (i / bars.length) * 100 <= progress;
            return (
              <MotiView 
                key={bar.id} 
                animate={{
                  backgroundColor: isFilled ? (isMe ? colors.surface : colors.primary) : 'rgba(0,0,0,0.1)',
                }}
                transition={{ type: 'timing', duration: 150 }}
                style={[
                  styles.waveformBar, 
                  { 
                    height: bar.height,
                    borderColor: colors.text,
                    borderWidth: 1.5,
                  }
                ]} 
              />
            );
          })}
        </View>
        <Text style={[styles.audioTimeText, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
          {formatTime(currentTime)} / {formatTime(audioDuration)}
        </Text>
      </View>
      <Music size={14} color={isMe ? 'rgba(255,255,255,0.7)' : colors.muted} />
    </View>
  );
};

export default function LiveSupportScreen() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [ticketId, setTicketId] = useState<string | null>(params.ticketId as string || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDeleteAlertVisible, setIsDeleteAlertVisible] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const ws = useRef<WebSocket | null>(null);
  const styles = getStyles(colors);

  // Initialize or fetch ticket
  useEffect(() => {
    const initSupport = async () => {
      if (!ticketId && token) {
        try {
          const response = await fetch(API.SUPPORT.INIT, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subject: 'Live Support Session' })
          });
          if (response.ok) {
            const ticket = await response.json();
            setTicketId(ticket.id);
            fetchHistory(ticket.id);
          }
        } catch (e) {
          console.error('Failed to init support ticket', e);
        }
      } else if (ticketId && token) {
        fetchHistory(ticketId);
      }
    };

    initSupport();
  }, [token]);

  // Handle WebSocket connection - only if an agent has responded or ticket is active
  useEffect(() => {
    const hasAgentMessage = messages.some(m => m.sender_id !== user?.id);
    
    if (ticketId && token && hasAgentMessage) {
      const wsUrl = API.SUPPORT.WS(ticketId, token);
      setIsConnecting(true);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnecting(false);
        setIsLive(true);
      };

      ws.current.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        setMessages((prev) => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender_id !== user?.id) {
          setIsTyping(false);
        }
      };

      ws.current.onerror = () => {
        setIsConnecting(false);
        setIsLive(false);
      };

      ws.current.onclose = () => {
        setIsConnecting(false);
        setIsLive(false);
      };

      return () => {
        ws.current?.close();
      };
    }
  }, [ticketId, token, messages.length > 0]);

  const fetchHistory = async (id: string) => {
    try {
      const response = await fetch(API.SUPPORT.MESSAGES(id), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (e) {
      console.error('Failed to fetch messages', e);
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete || !token) return;
    
    try {
      const response = await fetch(API.SUPPORT.DELETE_MESSAGE(messageToDelete), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const updatedMsg = await response.json();
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.error('Failed to delete message', e);
    } finally {
      setIsDeleteAlertVisible(false);
      setMessageToDelete(null);
    }
  };

  const onLongPressMessage = (msg: SupportMessage) => {
    if (msg.sender_id === user?.id && !msg.is_deleted) {
      setMessageToDelete(msg.id);
      setIsDeleteAlertVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const sendMessage = async (contentText?: string, attachmentUrl?: string, attachmentMetadata?: any) => {
    const text = (contentText || chatInput || '').trim();
    if (!text && !attachmentUrl) return;
    
    // Always use REST for sending as it's more reliable and triggers broadcast
    await sendViaRest(text, attachmentUrl, attachmentMetadata);
  };

  const sendViaRest = async (contentText?: string, attachmentUrl?: string, attachmentMetadata?: any) => {
    // If ticketId is missing, try to initialize first
    let currentTicketId = ticketId;
    if (!currentTicketId) {
      try {
        const response = await fetch(API.SUPPORT.INIT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ subject: 'Live Support Session' })
        });
        if (response.ok) {
          const ticket = await response.json();
          currentTicketId = ticket.id;
          setTicketId(ticket.id);
        } else {
          return;
        }
      } catch (e) {
        return;
      }
    }

    const text = contentText || chatInput;
    setChatInput(''); 
    
    try {
      const response = await fetch(API.SUPPORT.SEND, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ticket_id: currentTicketId, 
          content_text: text,
          attachment_url: attachmentUrl,
          attachment_metadata: attachmentMetadata
        })
      });
      
      if (!response.ok) {
        setChatInput(text);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        const newMsg = await response.json();
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      setChatInput(text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadMedia(result.assets[0].uri);
    }
  };

  const uploadMedia = async (uri: string, attachmentMetadata?: any) => {
    setIsUploading(true);
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const ext = match ? match[1].toLowerCase() : '';
    
    let type = 'application/octet-stream';
    if (ext.match(/(jpg|jpeg|png|gif|webp)/)) type = `image/${ext}`;
    if (ext.match(/(mp3|wav|m4a|aac|ogg)/)) type = `audio/${ext}`;

    formData.append('file', { uri, name: filename, type } as any);

    try {
      const response = await fetch(API.MEDIA.UPLOAD, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        await sendMessage('', data.url, attachmentMetadata);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {
      console.error('Upload Error', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsUploading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        let metadata: any = {};
        
        if (uri.match(/\.(mp3|wav|m4a|aac|ogg|opus)(\?.*)?$/i)) {
          try {
            // Attempt to extract duration before upload
            const tempPlayer = new (AudioModule as any).AudioPlayer({ uri }, 500, false);
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (tempPlayer.duration > 0) metadata.duration = tempPlayer.duration;
            if (typeof tempPlayer.release === 'function') tempPlayer.release();
          } catch (e) {
            console.warn('Could not extract duration metadata', e);
          }
        }
        
        uploadMedia(uri, metadata);
      }
    } catch (err) {
      console.error('Pick Document Error', err);
    }
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
            <Text style={[styles.headerStatus, isLive && { color: colors.secondary }]}>
              {!ticketId ? 'Initializing...' : isConnecting ? 'Connecting...' : isLive ? 'Live Support Online' : 'Waiting for Agent'}
            </Text>
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
              const isMe = msg.sender_id === user?.id;
              return (
                <View key={msg.id} style={[styles.bubbleWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
                  {!isMe && (
                    <View style={styles.smallAvatarBox}>
                      <Image source={{ uri: 'https://i.pravatar.cc/150?u=support' }} style={styles.smallAvatar} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    {msg.is_deleted ? (
                      <MotiView 
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ 
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          backgroundColor: 'rgba(0,0,0,0.03)',
                          borderWidth: 1,
                          borderColor: 'rgba(0,0,0,0.1)',
                          borderStyle: 'dashed',
                          borderRadius: 8,
                          marginVertical: 4
                        }}
                      >
                        <Text style={[
                          { 
                            fontFamily: DT.typography.bodySemiBold, 
                            fontSize: 12, 
                            fontStyle: 'italic', 
                            color: colors.muted,
                            opacity: 0.6
                          }
                        ]}>
                          This message has been deleted
                        </Text>
                        <Text style={[
                          { 
                            fontFamily: DT.typography.bodySemiBold, 
                            fontSize: 9, 
                            color: colors.muted,
                            opacity: 0.4,
                            marginTop: 2,
                            textAlign: isMe ? 'right' : 'left'
                          }
                        ]}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </MotiView>
                    ) : (
                      <>
                        {msg.attachment_url && (
                          <MotiView 
                            from={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={[
                              isMe ? styles.myWrapper : styles.theirWrapper,
                              { 
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                marginBottom: msg.content_text ? 8 : 0 
                              }
                            ]}
                          >
                            <TouchableOpacity 
                              onLongPress={() => onLongPressMessage(msg)}
                              activeOpacity={0.8}
                            >
                              {msg.attachment_url.toLowerCase().includes('image') || msg.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) ? (
                                <TouchableOpacity 
                                  onPress={() => setSelectedImage(msg.attachment_url || null)}
                                  onLongPress={() => onLongPressMessage(msg)}
                                  activeOpacity={0.8}
                                >
                                  <Image source={{ uri: msg.attachment_url }} style={styles.bubbleImage} />
                                </TouchableOpacity>
                              ) : msg.attachment_url.match(/\.(mp3|wav|m4a|aac|ogg|opus)(\?.*)?$/i) ? (
                                <AudioPlayer 
                                  uri={msg.attachment_url} 
                                  isMe={isMe} 
                                  colors={colors} 
                                  styles={styles} 
                                  initialDuration={msg.attachment_metadata?.duration}
                                  onLongPress={() => onLongPressMessage(msg)}
                                />
                              ) : (
                                <TouchableOpacity 
                                  style={styles.fileLink} 
                                  onPress={() => {/* In real app, open in browser or download */}}
                                  onLongPress={() => onLongPressMessage(msg)}
                                >
                                  <FileText size={20} color={colors.text} />
                                  <Text style={styles.fileText}>View Attachment</Text>
                                  <ExternalLink size={14} color={colors.muted} />
                                </TouchableOpacity>
                              )}
                            </TouchableOpacity>
                            {!msg.content_text && (
                              <View style={[styles.bubbleFooter, { marginTop: 4 }]}>
                                <Text style={styles.bubbleTime}>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                {isMe && (
                                  <CheckCheck 
                                    size={14} 
                                    color={msg.is_read ? colors.secondary : colors.muted} 
                                    strokeWidth={3} 
                                    style={{ marginLeft: 4 }} 
                                  />
                                )}
                              </View>
                            )}
                          </MotiView>
                        )}

                        {msg.content_text ? (
                          <MotiView 
                            from={{ opacity: 0, scale: 0.9, translateY: 5 }}
                            animate={{ opacity: 1, scale: 1, translateY: 0 }}
                            style={[
                              styles.bubble, 
                              isMe ? styles.myBubble : styles.theirBubble,
                              { alignSelf: isMe ? 'flex-end' : 'flex-start' }
                            ]}
                          >
                            <TouchableOpacity 
                              onLongPress={() => onLongPressMessage(msg)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.bubbleText, isMe && styles.myBubbleText]}>
                                {msg.content_text}
                              </Text>
                            </TouchableOpacity>
                            <View style={styles.bubbleFooter}>
                              <Text style={[styles.bubbleTime, isMe && styles.myBubbleTime]}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        ) : null}
                      </>
                    )}
                  </View>
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
          <TouchableOpacity style={styles.attachmentBtn} onPress={pickDocument} disabled={isUploading}>
            <Paperclip size={22} color={isUploading ? colors.muted : colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachmentBtn} onPress={pickImage} disabled={isUploading}>
            <Camera size={22} color={isUploading ? colors.muted : colors.text} strokeWidth={2.5} />
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
            onPress={() => sendMessage()}
            disabled={!chatInput.trim()}
          >
            <Send size={20} color={colors.surface} strokeWidth={3} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!selectedImage} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSelectedImage(null)} activeOpacity={1}>
          <MotiView 
            from={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={styles.modalContent}
          >
            <Image source={{ uri: selectedImage || '' }} style={styles.fullImage} resizeMode="contain" />
          </MotiView>
        </TouchableOpacity>
      </Modal>

      <BrutalistAlert
        visible={isDeleteAlertVisible}
        title="Delete Message?"
        message="Are you sure you want to permanently remove this message from the chat?"
        buttons={[
          {
            text: "No, Keep it",
            style: "cancel",
            onPress: () => setIsDeleteAlertVisible(false)
          },
          {
            text: "Yes, Delete",
            style: "destructive",
            onPress: handleDeleteMessage
          }
        ]}
        onClose={() => setIsDeleteAlertVisible(false)}
      />
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
  bubbleImage: { 
    width: 220, height: 165, marginBottom: 8, 
    borderWidth: 3, borderColor: colors.text,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', height: '80%', borderWidth: 4, borderColor: colors.text, backgroundColor: colors.background },
  fullImage: { width: '100%', height: '100%' },
  attachmentWrapper: { marginBottom: 8 },
  fileLink: { 
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, 
    borderWidth: 3, borderColor: colors.text,
    backgroundColor: colors.surface,
    shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
  },
  fileText: { fontFamily: DT.typography.bodySemiBold, fontSize: 13, color: colors.text },
  audioContainer: {
    flexDirection: 'row', alignItems: 'center', padding: 16, 
    minWidth: 240, maxWidth: '90%', marginBottom: 4,
    borderWidth: 3, borderColor: colors.text,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
  },
  myAudio: { backgroundColor: colors.primary },
  theirAudio: { backgroundColor: colors.surface },
  audioIconBox: {
    width: 44, height: 44, borderWidth: 3, borderColor: colors.text,
    backgroundColor: colors.background, marginRight: 12,
    alignItems: 'center', justifyContent: 'center'
  },
  audioWaveform: { 
    flex: 1, height: 8, backgroundColor: 'rgba(0,0,0,0.1)', 
    borderWidth: 2, borderColor: colors.text, overflow: 'hidden', position: 'relative' 
  },
  audioTrack: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 },
  audioProgress: { height: '100%' },
  audioTimeText: { fontFamily: DT.typography.bodySemiBold, fontSize: 10, color: colors.muted, marginTop: 4 },
  waveformRow: { 
    flexDirection: 'row', alignItems: 'center', gap: 2, 
    height: 48, justifyContent: 'flex-start', overflow: 'hidden' 
  },
  waveformBar: { width: 3, minHeight: 4, borderRadius: 1.5 },
});
