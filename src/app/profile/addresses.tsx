import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Trash2, Plus, Home, Briefcase, Map as MapIcon } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { BrutalistAlert } from '../../components/ui/BrutalistAlert';

interface Address {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  is_default: boolean;
}

const AddressesScreen = () => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Address Form
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCoords, setNewCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string, message: string, buttons: any[] }>({
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title: string, message: string, buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch(`${API.API_URL}/auth/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setAddresses(data);
      }
    } catch (error) {
      console.error("Fetch Addresses Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [token]);

  const handleLocateMe = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Please enable location permissions.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setNewCoords({ lat: latitude, lng: longitude });

      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode && geocode.length > 0) {
        const p = geocode[0];
        const addr = [p.name, p.street, p.district, p.city].filter(Boolean).join(', ');
        setNewAddress(addr);
      }
    } catch (e) {
        showAlert('Error', 'Could not determine location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSave = async () => {
    if (!newLabel || !newAddress) {
      showAlert('Required', 'Please provide a label and address.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API.API_URL}/auth/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          label: newLabel,
          address: newAddress,
          lat: newCoords?.lat ?? 0,
          lng: newCoords?.lng ?? 0,
          is_default: false
        })
      });

      if (response.ok) {
        await fetchAddresses();
        setIsAdding(false);
        setNewLabel('');
        setNewAddress('');
        setNewCoords(null);
      } else {
        const err = await response.json();
        showAlert('Error', err.detail || 'Failed to save address.');
      }
    } catch (e) {
      showAlert('Error', 'Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showAlert('Delete Address?', 'Are you sure you want to remove this saved location?', [
        { text: 'CANCEL', style: 'cancel' },
        { 
            text: 'DELETE', 
            style: 'destructive',
            onPress: async () => {
                try {
                    const response = await fetch(`${API.API_URL}/auth/addresses/${id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.ok) {
                        setAddresses(addresses.filter(a => a.id !== id));
                    }
                } catch (e) {
                    showAlert('Error', 'Failed to delete address.');
                }
            }
        }
    ]);
  };

  const styles = getStyles(colors);

  const getIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l === 'home') return <Home size={20} color={colors.text} strokeWidth={2} />;
    if (l === 'office' || l === 'work') return <Briefcase size={20} color={colors.text} strokeWidth={2} />;
    return <MapIcon size={20} color={colors.text} strokeWidth={2} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Saved Addresses</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <AnimatePresence>
                {isAdding && (
                    <MotiView 
                        from={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={styles.addForm}
                    >
                        <Text style={styles.sectionLabel}>NEW ADDRESS DETAILS</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.fieldLabel}>Label (e.g. Home, Office)</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Home"
                                placeholderTextColor={colors.muted}
                                value={newLabel}
                                onChangeText={setNewLabel}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.fieldLabel}>Full Address</Text>
                            <View style={styles.addressInputRow}>
                                <TextInput 
                                    style={[styles.input, { flex: 1, borderRightWidth: 0 }]}
                                    placeholder="Enter street, city, state"
                                    placeholderTextColor={colors.muted}
                                    value={newAddress}
                                    onChangeText={setNewAddress}
                                    multiline
                                />
                                <TouchableOpacity 
                                    style={styles.locateBtn} 
                                    onPress={handleLocateMe}
                                    disabled={isLocating}
                                >
                                    {isLocating ? <ActivityIndicator size="small" color={colors.surface} /> : <MapPin size={20} color={colors.surface} strokeWidth={2} />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.saveBtn} 
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveBtnText}>Save Address</Text>}
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.cancelAddBtn} onPress={() => setIsAdding(false)}>
                            <Text style={styles.cancelAddBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </MotiView>
                )}
            </AnimatePresence>

            <Text style={styles.sectionLabel}>YOUR SAVED LOCATIONS</Text>

            {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : addresses.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No saved addresses yet.</Text>
                </View>
            ) : (
                addresses.map((addr) => (
                    <View key={addr.id} style={styles.addressCard}>
                        <View style={styles.cardIcon}>
                          {getIcon(addr.label)}
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardLabel}>{addr.label.toUpperCase()}</Text>
                            <Text style={styles.cardAddress}>{addr.address}</Text>
                        </View>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(addr.id)}>
                            <Trash2 size={16} color={colors.error} strokeWidth={2} />
                        </TouchableOpacity>
                    </View>
                ))
            )}

            {!isAdding && (
                <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
                    <Plus size={20} color={colors.text} strokeWidth={2.5} />
                    <Text style={styles.addBtnText}>Add New Address</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
      </KeyboardAvoidingView>

      <BrutalistAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: DT.spacing.lg, 
    paddingVertical: DT.spacing.md, 
    borderBottomWidth: 2, 
    borderBottomColor: colors.text 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderWidth: 2, 
    borderColor: colors.text, 
    backgroundColor: colors.surface, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 20, color: colors.text },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 60 },
  
  sectionLabel: { 
    fontFamily: DT.typography.heading, 
    fontSize: 11, 
    color: colors.muted, 
    letterSpacing: 1.5, 
    marginBottom: DT.spacing.md, 
    marginTop: DT.spacing.sm 
  },

  // Add Form
  addForm: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.md,
    marginBottom: DT.spacing.xl,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  inputGroup: { marginBottom: DT.spacing.md },
  fieldLabel: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.background,
    padding: 12,
    fontFamily: DT.typography.body,
    fontSize: 14,
    color: colors.text,
    minHeight: 48,
  },
  addressInputRow: { flexDirection: 'row' },
  locateBtn: {
    width: 52,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text,
    marginTop: DT.spacing.sm,
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  saveBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.surface,
  },
  cancelAddBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelAddBtnText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 13,
    color: colors.muted,
  },

  // Address Cards
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DT.spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.md,
    marginBottom: DT.spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardIcon: { 
    width: 44, 
    height: 44, 
    borderWidth: 2, 
    borderColor: colors.text, 
    backgroundColor: colors.background, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  cardInfo: { flex: 1 },
  cardLabel: { fontFamily: DT.typography.heading, fontSize: 14, color: colors.text },
  cardAddress: { 
    fontFamily: DT.typography.body, 
    fontSize: 12, 
    color: colors.muted, 
    marginTop: 2,
    lineHeight: 16 
  },
  deleteBtn: { padding: 6 },

  addBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: DT.spacing.sm, 
    height: 48, 
    borderWidth: 2, 
    borderColor: colors.text, 
    borderStyle: 'dashed', 
    backgroundColor: colors.surface, 
    justifyContent: 'center', 
    marginTop: DT.spacing.sm 
  },
  addBtnText: { fontFamily: DT.typography.bodySemiBold, fontSize: 14, color: colors.text },

  emptyBox: { 
    padding: DT.spacing.xl, 
    borderWidth: 2, 
    borderColor: colors.text, 
    borderStyle: 'dashed', 
    alignItems: 'center', 
    marginBottom: DT.spacing.lg 
  },
  emptyText: { fontFamily: DT.typography.body, color: colors.muted },
});

export default AddressesScreen;
