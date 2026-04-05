import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  StyleSheet,
  Alert
} from 'react-native';
import { X, Camera } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';
import API from '../../constants/api';

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

  const handleSend = async () => {
    if (!name || !price) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!externalPhoto) {
      Alert.alert('Error', 'Please include a photo showing the price tag');
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
        throw new Error('Failed to upload item photo');
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

      if (!res.ok) throw new Error('Failed to propose item');

      Alert.alert('Proposed', 'The nomad has been notified of your proposal.');
      setName('');
      setPrice('');
      onProposed();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>PROPOSE ITEM</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>ITEM NAME</Text>
            <TextInput
              style={[styles.brutalInput, { color: colors.text, borderColor: colors.text, marginBottom: 16 }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. 1kg Tomatoes"
              placeholderTextColor={colors.muted}
            />
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
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
                <Image source={{ uri: externalPhoto }} style={styles.pickedImage} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Camera size={32} color={colors.text} />
                  <Text style={[styles.photoPickerText, { color: colors.text }]}>OPEN CAMERA</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.primaryAction, 
                { backgroundColor: colors.text, marginTop: 24, width: '100%' }, 
                loading && { opacity: 0.7 }
              ]} 
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={[styles.primaryActionText, { color: colors.surface }]}>SEND PROPOSAL</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 20,
    borderWidth: 3,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
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
  },
  photoPickerText: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    marginTop: 8,
  },
  pickedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  primaryAction: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  primaryActionText: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
  },
});
