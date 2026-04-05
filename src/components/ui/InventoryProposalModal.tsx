import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Camera, X } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Image } from 'expo-image';
import API from '../../constants/api';
import { DesignTokens as DT } from '../../constants/design';
import { BrutalistAlert } from './BrutalistAlert';

const SLAM = { type: 'spring', stiffness: 480, damping: 20, mass: 0.7 } as const;
const RELEASE = { type: 'spring', stiffness: 380, damping: 22 } as const;
const FAST = { type: 'timing', duration: 80 } as const;
const COLOR = { type: 'timing', duration: 120 } as const;

interface InventoryProposalModalProps {
  visible: boolean;
  onClose: () => void;
  onProposed: () => void;
  wakaId: string;
  token: string;
  colors: any;
  openCamera: () => void;
  externalPhoto?: string | null;
  name: string;
  setName: (val: string) => void;
  price: string;
  setPrice: (val: string) => void;
}

export default function InventoryProposalModal({
  visible,
  onClose,
  onProposed,
  wakaId,
  token,
  colors,
  openCamera,
  externalPhoto,
  name,
  setName,
  price,
  setPrice
}: InventoryProposalModalProps) {
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string; buttons: any[] }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (title: string, message: string, buttons: any[] = [{ text: 'OK' }]) => {
    setAlert({ visible: true, title, message, buttons });
  };

  const handleSend = async () => {
    if (!name || !price) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }
    if (!externalPhoto) {
      showAlert('Error', 'Please include a photo showing the price tag');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload Photo first
      let photoUrl = '';
      const formData = new FormData();
      formData.append('file', {
        uri: externalPhoto,
        name: 'inventory_item.jpg',
        type: 'image/jpeg'
      } as any);

      const uploadRes = await fetch(`${API.API_URL}/inventory/upload_image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        photoUrl = uploadData.url;
      } else {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to upload item photo');
      }

      // 2. Propose
      const res = await fetch(`${API.API_URL}/inventory/propose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          waka_id: wakaId,
          name: name,
          price: parseFloat(price),
          photo_url: photoUrl
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to propose item');
      }

      showAlert('Proposed', 'The nomad has been notified of your proposal.', [
        { 
          text: 'OK', 
          onPress: () => {
            onProposed();
            onClose();
          } 
        }
      ]);
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const DIALOG_SHADOW = 8;
  const BTN_SHADOW = 5;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <AnimatePresence>
        {visible && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 160 }}
            style={styles.modalOverlay}
          >
            <BlurView intensity={25} style={StyleSheet.absoluteFill} tint="dark" />

            <View style={styles.dialogWrapper}>
              <View
                style={[
                  styles.dialogShadow,
                  { backgroundColor: colors.text, top: DIALOG_SHADOW, left: DIALOG_SHADOW }
                ]}
              />

              <MotiView
                from={{ translateY: -20, scale: 0.92, opacity: 0, rotateZ: '-1.5deg' }}
                animate={{ translateY: 0, scale: 1, opacity: 1, rotateZ: '0deg' }}
                exit={{ translateY: -20, scale: 0.92, opacity: 0, rotateZ: '-1.5deg' }}
                transition={{
                  translateY: SLAM,
                  scale: SLAM,
                  opacity: { type: 'timing', duration: 120 },
                  rotateZ: SLAM,
                }}
                style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.text }]}
              >
                <MotiView
                  from={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ scaleY: { ...SLAM, delay: 100 }, opacity: { type: 'timing', duration: 100, delay: 100 } }}
                  style={[styles.modalHeader, { backgroundColor: colors.primary, borderBottomColor: colors.text }]}
                >
                  <Text style={[styles.modalTitle, { color: colors.surface }]}>PROPOSE ITEM</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={24} color={colors.surface} strokeWidth={3} />
                  </TouchableOpacity>
                </MotiView>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>ITEM NAME</Text>
                  <TextInput
                    style={[styles.brutalInput, { color: colors.text, borderColor: colors.text }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. 1kg Tomatoes"
                    placeholderTextColor={colors.muted}
                  />

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 }}>
                    {['Water', 'Bread', 'Cooking Oil', 'Rice', 'Milk'].map(tag => (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: name === tag ? colors.text : colors.surface,
                            borderColor: colors.text
                          }
                        ]}
                        onPress={() => setName(tag)}
                      >
                        <Text style={[styles.categoryText, { color: name === tag ? colors.surface : colors.text }]}>{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.inputLabel, { color: colors.muted }]}>PRICE (₦)</Text>
                  <TextInput
                    style={[styles.brutalInput, { color: colors.text, borderColor: colors.text, marginBottom: 16 }]}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                  />

                  <Text style={[styles.inputLabel, { color: colors.muted }]}>PHOTO (MUST SHOW PRICE TAG)</Text>
                  <TouchableOpacity
                    style={[styles.photoPicker, { borderColor: colors.text }]}
                    onPress={openCamera}
                  >
                    {externalPhoto ? (
                      <Image 
                        source={{ uri: externalPhoto }} 
                        style={styles.pickedImage} 
                        contentFit="cover" 
                        transition={200}
                      />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Camera size={32} color={colors.text} />
                        <Text style={[styles.photoPickerText, { color: colors.text }]}>OPEN CAMERA</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Brutal Button for Send */}
                  <View style={{ marginTop: 24 }}>
                    <View style={{ position: 'relative' }}>
                      <View style={[styles.btnShadow, { backgroundColor: colors.text, top: BTN_SHADOW, left: BTN_SHADOW }]} />
                      <Pressable
                        onPressIn={() => {
                          setPressed(true);
                          if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }}
                        onPressOut={() => setPressed(false)}
                        onPress={handleSend}
                        disabled={loading}
                      >
                        <MotiView
                          animate={{
                            translateX: pressed ? BTN_SHADOW : 0,
                            translateY: pressed ? BTN_SHADOW : 0,
                            backgroundColor: loading ? colors.muted : colors.text,
                          }}
                          transition={{
                            translateX: pressed ? FAST : RELEASE,
                            translateY: pressed ? FAST : RELEASE,
                            backgroundColor: COLOR,
                          }}
                          style={[styles.primaryAction, { borderColor: colors.text }]}
                        >
                          {loading ? (
                            <ActivityIndicator color={colors.surface} />
                          ) : (
                            <Text style={[styles.primaryActionText, { color: colors.surface }]}>SEND PROPOSAL</Text>
                          )}
                        </MotiView>
                      </Pressable>
                    </View>
                  </View>
                </ScrollView>
              </MotiView>
            </View>
          </MotiView>
        )}
      </AnimatePresence>

      <BrutalistAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogWrapper: {
    width: '100%',
    position: 'relative',
  },
  dialogShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: -8,
    bottom: -8,
  },
  modalContent: {
    width: '100%',
    borderWidth: 4,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 4,
  },
  modalTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  inputLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    marginBottom: 4,
  },
  brutalInput: {
    borderWidth: 2,
    padding: 12,
    fontFamily: DT.typography.heading,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
  },
  categoryText: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
  },
  photoPicker: {
    height: 180,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    backgroundColor: '#F8F8F8',
  },
  photoPickerText: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    marginTop: 8,
  },
  pickedImage: {
    width: '100%',
    height: '100%',
  },
  btnShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: -5,
    bottom: -5,
  },
  primaryAction: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
  },
  primaryActionText: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    letterSpacing: 1,
  },
});
