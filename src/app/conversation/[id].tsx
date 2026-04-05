import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, CheckCheck, ChevronLeft, Package, Paperclip, Send, FileText, ExternalLink } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { MotiView, AnimatePresence } from 'moti';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import AudioModule from 'expo-audio/build/AudioModule';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Play, Pause, Music, Trash2 } from 'lucide-react-native';
import { BrutalistAlert } from '../../components/ui/BrutalistAlert';
import { getCachedAudioUri } from '../../utils/audio-cache';

// --- Small Audio Player Component ---
const AudioPlayer = (props: any) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);

  useEffect(() => {
    if (hasStarted && !resolvedUri) {
      getCachedAudioUri(props.uri).then(setResolvedUri);
    }
  }, [hasStarted, props.uri, resolvedUri]);

  const player = useMemo(() => {
    if (!resolvedUri) return null;
    return new (AudioModule as any).AudioPlayer({ uri: resolvedUri }, 100, true);
  }, [resolvedUri]);

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
const SourcingActionCard = ({ metadata, onApprove, onDecline, isMe, colors, styles, loading, wakaStatus, onViewDetails }: any) => {
  const currentStatus = wakaStatus || metadata.waka_status;
  const isPending = currentStatus === 'sourcing_submitted';
  
  return (
    <View style={[styles.actionCard, isMe ? styles.myActionCard : styles.theirActionCard]}>
      <TouchableOpacity onPress={onViewDetails} activeOpacity={0.8}>
        <View style={styles.actionHeader}>
          <Package size={18} color={colors.text} />
          <Text style={styles.actionTitle}>SOURCING BILL</Text>
          {metadata.payment_method === 'cash' && (
            <View style={{ backgroundColor: '#F0F0F0', paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.text, marginLeft: 8 }}>
              <Text style={{ fontSize: 8, fontFamily: DT.typography.heading }}>CASH / POD</Text>
            </View>
          )}
          <ExternalLink size={14} color={colors.muted} style={{ marginLeft: 'auto' }} />
        </View>
        
        <View style={styles.actionBody}>
          <Text style={styles.actionAmount}>₦{metadata.amount?.toLocaleString()}</Text>
          <Text style={styles.actionSub}>Requested for groceries & items</Text>
          
          {metadata.items && metadata.items.length > 0 && (
            <View style={styles.miniItemList}>
              {metadata.items.slice(0, 3).map((item: string, i: number) => (
                <Text key={i} style={styles.miniItem}>• {item}</Text>
              ))}
              {metadata.items.length > 3 && <Text style={styles.miniItem}>+ {metadata.items.length - 3} more</Text>}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {isPending && !isMe ? (
        <View style={styles.actionFooter}>
          <TouchableOpacity 
            style={[styles.smallActionBtn, styles.declineBtnSmall]} 
            onPress={onDecline}
            disabled={loading}
          >
            <Text style={styles.declineBtnTextSmall}>DECLINE</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.smallActionBtn, styles.approveBtnSmall]} 
            onPress={onApprove}
            disabled={loading}
          >
            <Text style={styles.approveBtnTextSmall}>
              {metadata.payment_method === 'cash' ? 'CONFIRM CASH' : 'APPROVE'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resolvedBadge}>
          <Text style={styles.resolvedText}>
            {isMe ? (isPending ? 'WAITING FOR APPROVAL' : 'RESOLVED') : (currentStatus === 'funded' ? 'PAID & FUNDED' : 'RESOLVED')}
          </Text>
        </View>
      )}
    </View>
  );
};

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
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Soft-delete states
  const [isDeleteAlertVisible, setIsDeleteAlertVisible] = useState(false);
  const [selectedMessageForDelete, setSelectedMessageForDelete] = useState<any>(null);
  
  const [alertConfig, setAlertConfig] = useState<any>({ title: '', message: '', buttons: [] });
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  
  const showAlert = (title: string, message: string, buttons: any[] = [{ text: 'OK', onPress: () => setIsAlertVisible(false) }]) => {
    setAlertConfig({ title, message, buttons });
    setIsAlertVisible(true);
  };

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

  const fetchConversation = async () => {
    try {
      const convRes = await fetch(API.MESSAGES.CONVERSATION_DETAIL(convoId!), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (convRes.ok) {
        const conv = await convRes.json();
        setConversation(conv);
      }
    } catch (e) {
      console.error('Error fetching conversation:', e);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      await fetchConversation();

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
      const data = JSON.parse(e.data);
      
      if (data.type === 'NEW_MESSAGE') {
        const newMsg = data.message;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        
        // Refresh conversation to get latest waka_status if it's an action message
        if (newMsg.attachment_metadata?.type?.startsWith('sourcing')) {
          fetchConversation();
        }
        
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      } else if (data.type === 'DELETE_MESSAGE') {
        setMessages(prev => prev.map(m => 
          m.id === data.message_id ? { ...m, is_deleted: true } : m
        ));
      }
    };

    ws.current.onerror = (e) => {
      console.error('WS Error:', e);
    };
  };

  const sendMessage = async (content_text?: string, attachment_url?: string, attachment_metadata?: any) => {
    const content = content_text || message.trim();
    if (!content && !attachment_url) return;
    
    if (!content_text) setMessage('');

    try {
      const res = await fetch(API.MESSAGES.SEND, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation_id: convoId,
          content_text: content || null,
          attachment_url: attachment_url || null,
          attachment_metadata: attachment_metadata || null
        }),
      });
      
      if (!res.ok) throw new Error('Failed to send message');
      
      const sentMsg = await res.json();
      setMessages(prev => {
        if (prev.find(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error('Send error:', e);
    }
  };

  const uploadMedia = async (uri: string, type: string, metadata: any = {}) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Create a temporary pending message
    const tempId = `pending-${Date.now()}`;
    const pendingMsg = {
      id: tempId,
      sender_id: user?.id,
      content_text: null,
      attachment_url: uri, // Use local URI for preview
      is_pending: true,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, pendingMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const ext = match ? match[1].toLowerCase() : '';
      
      let typeStr = 'application/octet-stream';
      if (ext.match(/(jpg|jpeg|png|gif|webp)/)) typeStr = `image/${ext}`;
      if (ext.match(/(mp3|wav|m4a|aac|ogg|opus)/)) typeStr = `audio/${ext}`;

      formData.append('file', { uri, name: filename, type: typeStr } as any);

      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error('Upload failed'));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        
        xhr.open('POST', API.MEDIA.UPLOAD);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      const data: any = await uploadPromise;
      
      // Remove pending message before sending the real one
      setMessages(prev => prev.filter(m => m.id !== tempId));
      
      await sendMessage(undefined, data.url, metadata);
    } catch (e) {
      console.error('Upload Error:', e);
      // Remove pending message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      await uploadMedia(result.assets[0].uri, 'image');
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.uri;
      let metadata: any = {};
      
      if (uri.match(/\.(mp3|wav|m4a|aac|ogg|opus)(\?.*)?$/i)) {
        try {
          const tempPlayer = new (AudioModule as any).AudioPlayer({ uri }, 500, false);
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (tempPlayer.duration > 0) metadata.duration = tempPlayer.duration;
          if (typeof tempPlayer.release === 'function') tempPlayer.release();
        } catch (e) {
          console.warn('Could not extract duration metadata', e);
        }
      }
      
      await uploadMedia(asset.uri, asset.mimeType?.includes('image') ? 'image' : 'file', metadata);
    }
  };

  const onLongPressMessage = (msg: any) => {
    if (msg.sender_id === user?.id && !msg.is_deleted) {
      setSelectedMessageForDelete(msg);
      setIsDeleteAlertVisible(true);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessageForDelete) return;
    
    const msgId = selectedMessageForDelete.id;
    setIsDeleteAlertVisible(false);
    
    try {
      const res = await fetch(API.MESSAGES.DELETE_MESSAGE(msgId), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMessages(prev => prev.map(m => 
          m.id === msgId ? { ...m, is_deleted: true } : m
        ));
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  };  const handleApproveSourcing = async (wakaId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API.WAKA.GET(wakaId)}/fund_sourcing`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.detail?.includes('Insufficient wallet balance')) {
          showAlert('Low Balance 💸', data.detail, [
            { text: 'NOT NOW', style: 'cancel', onPress: () => setIsAlertVisible(false) },
            { text: 'TOP UP WALLET', onPress: () => {
              setIsAlertVisible(false);
              router.push('/profile/wallet' as any);
            }}
          ]);
          return;
        }
        throw new Error(data.detail || 'Failed to approve');
      }
      
      showAlert('Success', 'Bill approved and funded!');
      fetchHistory();
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineSourcing = async (wakaId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API.WAKA.GET(wakaId)}/reject_sourcing`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ item_list: null }) // Decline full amount
      });
      if (!res.ok) throw new Error('Failed to decline');
      showAlert('Declined', 'Bill declined. Runner notified.');
      fetchHistory();
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setLoading(false);
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
            source={conversation?.other_user?.avatar_url 
              ? { uri: `${API.API_URL}${conversation?.other_user?.avatar_url}`, headers: { Authorization: `Bearer ${token}` } }
              : { uri: `https://i.pravatar.cc/150?u=${conversation?.other_user?.id}` }
            } 
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
            <AnimatePresence>
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <View
                    key={msg.id}
                    style={[styles.bubbleWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}
                  >
                    {!isMe && !msg.is_deleted && (
                      <View style={styles.theirAvatarBox}>
                        <Image 
                          source={conversation?.other_user?.avatar_url 
                            ? { uri: `${API.API_URL}${conversation?.other_user?.avatar_url}`, headers: { Authorization: `Bearer ${token}` } }
                            : { uri: `https://i.pravatar.cc/150?u=${msg.sender_id}` }
                          } 
                          style={styles.theirAvatar} 
                        />
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
                              {msg.is_pending ? (
                                <View style={[styles.audioContainer, styles.myAudio, { opacity: 0.8, minWidth: 200, padding: 12 }]}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={[styles.audioTimeText, styles.myBubbleText, { marginBottom: 8 }]}>
                                      Uploading {uploadProgress}%...
                                    </Text>
                                    <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                                      <MotiView 
                                        animate={{ width: `${uploadProgress}%` }}
                                        style={{ height: '100%', backgroundColor: colors.surface }}
                                      />
                                    </View>
                                  </View>
                                </View>
                              ) : msg.attachment_url.toLowerCase().includes('image') || msg.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) ? (
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
                              ) : msg.attachment_metadata?.type === 'sourcing_request' ? (
                                <SourcingActionCard 
                                  metadata={msg.attachment_metadata}
                                  wakaStatus={conversation?.waka_status}
                                  isMe={isMe}
                                  colors={colors}
                                  styles={styles}
                                  loading={loading}
                                  onApprove={() => handleApproveSourcing(msg.attachment_metadata.waka_id)}
                                  onDecline={() => handleDeclineSourcing(msg.attachment_metadata.waka_id)}
                                  onViewDetails={() => router.push(`/waka/${msg.attachment_metadata.waka_id}` as any)}
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
          <TouchableOpacity style={styles.attachmentBtn} onPress={pickDocument} disabled={isUploading}>
            <Paperclip size={22} color={isUploading ? colors.muted : colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachmentBtn} onPress={pickImage} disabled={isUploading}>
            <Camera size={22} color={isUploading ? colors.muted : colors.text} strokeWidth={2.5} />
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
            onPress={() => sendMessage()}
            disabled={!message.trim()}
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

      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
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
        visible={isAlertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setIsAlertVisible(false)}
      />
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
  bubbleImage: { 
    width: 220, height: 165, marginBottom: 8, 
    borderWidth: 3, borderColor: colors.text,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', height: '80%', borderWidth: 4, borderColor: colors.text, backgroundColor: colors.background },
  fullImage: { width: '100%', height: '100%' },
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
  audioTimeText: { fontFamily: DT.typography.bodySemiBold, fontSize: 10, color: colors.muted, marginTop: 4 },
  waveformRow: { 
    flexDirection: 'row', alignItems: 'center', gap: 2, 
    height: 48, justifyContent: 'flex-start', overflow: 'hidden' 
  },
  waveformBar: { width: 3, minHeight: 4, borderRadius: 1.5 },

  // --- Action Card Styles ---
  actionCard: {
    width: 260,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
    padding: 12,
    marginVertical: 4,
  },
  myActionCard: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  theirActionCard: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
    paddingBottom: 8,
    marginBottom: 8,
  },
  actionTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.text,
    letterSpacing: 1,
  },
  actionBody: {
    marginBottom: 12,
  },
  actionAmount: {
    fontFamily: DT.typography.heading,
    fontSize: 24,
    color: colors.text,
  },
  actionSub: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  miniItemList: {
    marginTop: 8,
    gap: 4,
  },
  miniItem: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.text,
  },
  actionFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  smallActionBtn: {
    flex: 1,
    height: 36,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnSmall: {
    backgroundColor: '#FFE5E5',
  },
  approveBtnSmall: {
    backgroundColor: colors.primary,
  },
  declineBtnTextSmall: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.error,
  },
  approveBtnTextSmall: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.surface,
  },
  resolvedBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.text,
    borderStyle: 'dashed',
  },
  resolvedText: {
    fontFamily: DT.typography.heading,
    fontSize: 9,
    color: colors.muted,
  },
});
