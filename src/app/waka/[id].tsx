import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  Truck, 
  Clock, 
  Zap,
  ShoppingBag,
  Utensils,
  Navigation,
  Package,
  Camera,
  Eye,
  X,
  Plus,
  AlertTriangle,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';
import { ActivityIndicator } from 'react-native';
import { BrutalistAlert } from '../../components/ui/BrutalistAlert';
import { ReviewForm } from '../../components/ui/ReviewForm';

// Mock data removed in favor of real API calls

const STEPS = [
  { icon: CheckCircle2, label: 'Broadcast' },
  { icon: Truck, label: 'En-Route' },
  { icon: MapPin, label: 'Sourcing' },
  { icon: CheckCircle2, label: 'Delivered' },
];

export default function WakaStatusScreen() {
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const router = useRouter();
  const { id, initialStatus } = useLocalSearchParams<{ id: string, initialStatus: string }>();
  
  const [waka, setWaka] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isDeclining, setIsDeclining] = React.useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string, message: string, buttons: any[] }>({
    title: '',
    message: '',
    buttons: []
  });

  // Sourcing form state
  const [sourcingBudget, setSourcingBudget] = useState('');
  const [bankName, setBankName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [accName, setAccName] = useState('');
  const [isSubmittingSourcing, setIsSubmittingSourcing] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [removedItems, setRemovedItems] = useState<Set<number>>(new Set());
  const [isRejecting, setIsRejecting] = useState(false);
  const [isUpdatingPaymentMethod, setIsUpdatingPaymentMethod] = useState(false);
  const [disputeVisible, setDisputeVisible] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [podImage, setPodImage] = useState<string | null>(null);
  const [isUploadingPOD, setIsUploadingPOD] = useState(false);
  
  // Inventory Proposal State
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemPhoto, setNewItemPhoto] = useState<string | null>(null);
  const [isProposingItem, setIsProposingItem] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Invite Friend State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [isSearchingFriend, setIsSearchingFriend] = useState(false);
  const [invitedFriend, setInvitedFriend] = useState<any>(null);
  const [isInviting, setIsInviting] = useState(false);

  const showAlert = (title: string, message: string, buttons: any[] = [{ text: 'OK' }]) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const styles = getStyles(colors);

  const getArea = (address: string) => {
    if (!address) return 'Nearby';
    const parts = address.split(',');
    if (parts.length > 2) return parts[parts.length - 2].trim();
    return parts[parts.length - 1].trim();
  };

  const getStatusText = (step: number, status: string) => {
    if (status === 'cancelled') return 'CANCELLED';
    if (status === 'completed') return 'COMPLETED';
    if (status === 'finding_runner') return 'Finding Runner...';
    switch (step) {
      case 1: return 'Finding Runner';
      case 2: return 'Runner en-route';
      case 3: return 'Sourcing Items';
      case 4: return 'Delivering';
      default: return status;
    }
  };

  const fetchWakaDetails = async () => {
    if (!id || !token) return;
    try {
      setLoading(true);
      const res = await fetch(API.WAKA.GET(id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Waka not found');
      const data = await res.json();
      setWaka(data);
    } catch (e: any) {
      showAlert('Error', e.message, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isNomad = user?.id === waka?.employer_id;

  const handleUpdatePaymentMethod = async (method: 'wallet' | 'cash') => {
    if (!waka || isUpdatingPaymentMethod) return;
    
    setIsUpdatingPaymentMethod(true);
    try {
      const res = await fetch(`${API.WAKA.GET(waka.id)}/payment_method?payment_method=${method}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to update payment method');
      }
      
      const updatedWaka = await res.json();
      setWaka(updatedWaka);
    } catch (e: any) {
      showAlert('Update Failed', e.message);
    } finally {
      setIsUpdatingPaymentMethod(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !token) return;

    showAlert(
      'Cancel Waka?',
      'Are you sure you want to cancel this errand?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              const res = await fetch(API.WAKA.CANCEL(id), {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Failed to cancel');
              }

              const updatedWaka = await res.json();
              setWaka(updatedWaka);
              showAlert('Cancelled', 'Errand has been cancelled.');
            } catch (e: any) {
              showAlert('Error', e.message);
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleAccept = async () => {
    if (!id || !token) return;
    try {
      setIsAccepting(true);
      const res = await fetch(API.WAKA.ACCEPT(id), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to accept waka');
      }
      const updated = await res.json();
      setWaka(updated);
      showAlert('Waka Accepted', 'You have successfully joined this errand.');
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!id || !token) return;
    try {
      setIsDeclining(true);
      const res = await fetch(API.WAKA.DECLINE(id), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to decline waka');
      }
      showAlert('Success', 'Errand removed from your view.');
      router.replace('/(tabs)');
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setIsDeclining(false);
    }
  };

  const handleUpdateStep = async (newStep: number) => {
    if (!token || !id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API.WAKA.GET(id)}/step?step=${newStep}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to update progress');
      fetchWakaDetails();
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSourcing = async () => {
    if (!token || !id || !waka) return;
    try {
      setIsRejecting(true);
      // Filter out removed items
      const finalItems = waka.items?.filter((val: string, index: number) => !removedItems.has(index)) || [];
      
      const res = await fetch(`${API.WAKA.GET(id)}/reject_sourcing`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ item_list: finalItems })
      });
      if (!res.ok) throw new Error('Failed to reject sourcing');
      fetchWakaDetails();
      setRemovedItems(new Set()); // Reset
      showAlert('Declined', 'Bill declined. The runner has been notified and items have been updated.');
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setIsRejecting(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setPodImage(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    if (!token || !id) return;
    
    let uploadedUrl = null;
    if (actingAsRunner && podImage) {
      setIsUploadingPOD(true);
      try {
        const formData = new FormData();
        const uriParts = podImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append('file', {
          uri: podImage,
          name: `pod_${id}.${fileType}`,
          type: `image/${fileType}`,
        } as any);

        const uploadRes = await fetch(`${API.API_URL}/waka/${id}/pod`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!uploadRes.ok) throw new Error('Photo upload failed');
        const uploadData = await uploadRes.json();
        uploadedUrl = uploadData.pod_url;
      } catch (e: any) {
        showAlert('Upload Error', e.message);
        setIsUploadingPOD(false);
        return;
      } finally {
        setIsUploadingPOD(false);
      }
    }

    try {
      setIsAccepting(true); // Re-use indicator
      const res = await fetch(`${API.WAKA.GET(id)}/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ pod_url: uploadedUrl })
      });
      const data = await res.json();

      if (!res.ok) {
        if (waka.payment_method === 'wallet' && data.detail?.includes('Insufficient wallet balance')) {
          setAlertConfig({
            title: 'Low Balance 💸',
            message: data.detail,
            buttons: [
              { text: 'NOT NOW', style: 'cancel' },
              { text: 'TOP UP WALLET', onPress: () => {
                setAlertVisible(false);
                router.push('/profile/wallet' as any);
              }}
            ]
          });
          setAlertVisible(true);
          return;
        }
        throw new Error(data.detail || 'Failed to mark as complete');
      }

      if (data.is_completed) {
        showAlert('Success', 'Errand fully finalized! Thank you.');
      } else {
        showAlert('Updated', 'Confirmation recorded. Awaiting other party.');
      }
      fetchWakaDetails();
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleLeaveReview = async (rating: number, comment: string) => {
    if (!token || !id) return;
    try {
      const res = await fetch(`${API.WAKA.GET(id)}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to submit review');
      }
      
      showAlert('Review Sent', 'Your feedback helps the Sendam community grow!');
      fetchWakaDetails();
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };

  const handleSubmitSourcing = async () => {
    if (!token || !id || !sourcingBudget || !bankName || !accNumber || !accName) {
      showAlert('Missing Info', 'Please fill all fields to submit the bill.');
      return;
    }
    try {
      setIsSubmittingSourcing(true);
      const res = await fetch(`${API.WAKA.GET(id)}/sourcing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourcing_budget: parseFloat(sourcingBudget),
          bank_name: bankName,
          account_number: accNumber,
          account_name: accName
        })
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to submit bill');
      }
      
      showAlert('Bill Submitted', 'The nomad has been notified to fund the groceries.');
      fetchWakaDetails();
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setIsSubmittingSourcing(false);
    }
  };

  const handleFundSourcing = async () => {
    if (!token || !id) return;
    try {
      setIsFunding(true);
      const res = await fetch(`${API.WAKA.GET(id)}/fund_sourcing`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (waka.payment_method === 'wallet' && data.detail?.includes('Insufficient wallet balance')) {
          setAlertConfig({
            title: 'Low Balance 💸',
            message: data.detail,
            buttons: [
              { text: 'NOT NOW', style: 'cancel' },
              { text: 'TOP UP WALLET', onPress: () => {
                setAlertVisible(false);
                router.push('/profile/wallet' as any);
              }}
            ]
          });
          setAlertVisible(true);
          return;
        }
        throw new Error(data.detail || 'Failed to confirm funding');
      }
      
      showAlert('Funding Confirmed', 'The runner has been notified to proceed with purchases.');
      fetchWakaDetails();
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setIsFunding(false);
    }
  };

  const handleChat = async () => {
    if (!waka || !token || !user) return;
    try {
      const otherUser = user.id === waka.runner_id ? waka.employer : waka.runner;
      if (!otherUser) return;

      const res = await fetch(API.MESSAGES.CONVERSATIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employer_id: waka.employer_id,
          runner_id: waka.runner_id,
          waka_id: waka.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to start conversation');
      const conv = await res.json();
      router.push(`/conversation/${conv.id}`);
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };

  const handleRaiseDispute = () => {
    router.push(`/dispute/${id}` as any);
  };

  const handleTip = async () => {
    if (!token || !id || !tipAmount) return;
    try {
      setIsTipping(true);
      const res = await fetch(`${API.API_URL}/waka/${id}/tip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(tipAmount) })
      });
      if (!res.ok) throw new Error('Failed to send tip');
      showAlert('Tip Sent', `₦${tipAmount} tip successfully sent to the runner!`);
      setTipAmount("");
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setIsTipping(false);
    }
  };

  const handleRespondToBid = async (itemId: string, approved: boolean) => {
    if (!token || !id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API.API_URL}/inventory/${itemId}/respond?approved=${approved}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to respond to bid');
      }
      
      fetchWakaDetails();
      showAlert(approved ? 'Item Approved' : 'Item Declined', approved ? 'Your budget has been updated.' : 'Runner has been notified.');
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProposeItem = async () => {
    if (!token || !id || !newItemName || !newItemPrice) {
      showAlert('Missing Info', 'Please provide a name and price for the item.');
      return;
    }
    
    setIsProposingItem(true);
    try {
      let photoUrl = null;
      if (newItemPhoto) {
        // Upload photo first
        const formData = new FormData();
        const uriParts = newItemPhoto.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('file', {
          uri: newItemPhoto,
          name: `inventory_${id}_${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        } as any);

        const uploadRes = await fetch(`${API.API_URL}/media/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          photoUrl = uploadData.url;
        }
      }

      if (!photoUrl && !newItemPhoto) {
        throw new Error('You must include a photo of the item showing its price tag.');
      }

      const res = await fetch(`${API.API_URL}/inventory/propose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          waka_id: id,
          name: newItemName,
          price: parseFloat(newItemPrice),
          photo_url: photoUrl
        })
      });
      
      if (!res.ok) throw new Error('Failed to propose item');
      
      showAlert('Proposed', 'The nomad has been notified of your proposal.');
      fetchWakaDetails();
      setShowInventoryForm(false);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemPhoto(null);
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setIsProposingItem(false);
    }
  };

  const pickInventoryPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setNewItemPhoto(result.assets[0].uri);
    }
  };



  useEffect(() => {
    fetchWakaDetails();
  }, [id, token]);
  const handleSearchFriend = async () => {
    if (!invitePhone || !token) return;
    setIsSearchingFriend(true);
    setInvitedFriend(null);
    try {
      const res = await fetch(`${API.API_URL}/auth/lookup/${invitePhone}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const friend = await res.json();
        setInvitedFriend(friend);
      } else {
        showAlert('Not Found', 'We could not find a user with this phone number. Make sure they have a SendAm account.');
      }
    } catch (e: any) {
      showAlert('Error', 'Failed to lookup user.');
    } finally {
      setIsSearchingFriend(false);
    }
  };

  const handleInviteFriend = async () => {
    if (!invitedFriend || !token || !id) return;
    setIsInviting(true);
    try {
      const res = await fetch(`${API.WAKA.GET(id)}/invite?user_id=${invitedFriend.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showAlert('Invite Sent! 📩', `Your friend ${invitedFriend.full_name} has been notified to join this errand.`);
        setShowInviteModal(false);
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to send invitation');
      }
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setIsInviting(false);
    }
  };

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  if (loading || !waka) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{initialStatus || 'Loading Status...'}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Determine if the user should view this as a Runner or Nomad
  const actingAsRunner = user?.is_runner && user?.id !== waka.employer_id;
  const displayUser = actingAsRunner ? waka.employer : waka.runner;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Waka Status</Text>
        {waka.status === 'completed' ? (
          <View style={[styles.livePill, { backgroundColor: colors.secondary }]}>
            <Text style={styles.liveText}>COMPLETED</Text>
          </View>
        ) : waka.status === 'cancelled' ? (
          <View style={[styles.livePill, { backgroundColor: colors.error || '#FF4B4B' }]}>
            <Text style={styles.liveText}>CANCELLED</Text>
          </View>
        ) : (
          <Animated.View style={[styles.livePill, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.liveText}>{waka.status === 'finding_runner' ? 'BROADCAST' : 'LIVE'}</Text>
          </Animated.View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Waka Info Card */}
        <View style={styles.card}>
          {/* Top Row: Category & Price */}
          <View style={styles.cardTopRow}>
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                {waka.category === 'market' ? <ShoppingBag size={12} color={colors.text} /> : 
                 waka.category === 'food' ? <Utensils size={12} color={colors.text} /> : 
                 <Package size={12} color={colors.text} />}
                <Text style={styles.categoryLabel}>{waka.category.toUpperCase()}</Text>
              </View>
              <View style={styles.areaBadge}>
                <MapPin size={10} color={colors.surface} fill={colors.surface} />
                <Text style={styles.areaLabel}>{getArea(waka.pickup_address).toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.priceValue}>₦{waka.total_price.toLocaleString()}</Text>
          </View>
          
          {waka.payment_method === 'cash' && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderWidth: 2, borderColor: colors.text, marginBottom: 8 }}>
              <Text style={{ fontFamily: DT.typography.heading, fontSize: 10, color: colors.text }}>PAY ON DELIVERY (CASH)</Text>
            </View>
          )}

          {/* Body: Description & Items */}
          <Text style={styles.cardTitle}>{waka.item_description}</Text>
          
          {waka.items && waka.items.length > 0 && (
            <View style={styles.itemListContainer}>
              <Text style={styles.listHeader}>ITEM LIST</Text>
              {waka.items.map((itemValue: string, itemIdx: number) => {
                const isRemoved = removedItems.has(itemIdx);
                const isNomadVerifying = waka.status === 'sourcing_submitted' && user?.id === waka.employer_id;
                
                return (
                  <TouchableOpacity 
                    key={itemIdx} 
                    style={styles.itemBulletRow}
                    disabled={!isNomadVerifying}
                    onPress={() => {
                      const newSet = new Set(removedItems);
                      if (isRemoved) newSet.delete(itemIdx);
                      else newSet.add(itemIdx);
                      setRemovedItems(newSet);
                    }}
                  >
                    <View style={[styles.bulletDotSmall, isRemoved && { backgroundColor: colors.muted }]} />
                    <Text style={[
                      styles.itemBulletText, 
                      isRemoved && { textDecorationLine: 'line-through', color: colors.muted }
                    ]}>
                      {itemValue}
                    </Text>
                    {isNomadVerifying && (
                      <Text style={{ fontSize: 10, color: isRemoved ? colors.error : colors.muted }}>
                        {isRemoved ? 'UNDO' : 'REMOVE'}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              {removedItems.size > 0 && (
                <Text style={styles.removalHint}>* Items crossed out will be removed upon decline.</Text>
              )}
            </View>
          )}

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <MapPin size={12} color={colors.accent} strokeWidth={2.5} />
              <Text style={styles.detailLabel} numberOfLines={1}>PICKUP: {waka.pickup_address}</Text>
            </View>
            <View style={styles.detailItem}>
              <Navigation size={12} color={colors.secondary} strokeWidth={2.5} />
              <Text style={styles.detailLabel} numberOfLines={1}>DROPOFF: {waka.dropoff_address}</Text>
            </View>
          </View>

          {/* Action Row Hint */}
          <View style={styles.feeHintRow}>
            <Text style={styles.feeHintLabel}>TOTAL REWARD</Text>
            <View style={styles.flashStatus}>
              {waka.urgency === 'flash' ? (
                <View style={styles.flashInnerBadge}>
                  <Zap size={10} color={colors.surface} fill={colors.surface} />
                  <Text style={styles.flashInnerText}>FLASH</Text>
                </View>
              ) : (
                <Text style={styles.standardHintText}>STANDARD DELIVERY</Text>
              )}
            </View>
          </View>

          {/* Shopping Budget Range Display */}
          {(waka.budget_min || waka.budget_max) && (
            <View style={[styles.budgetRangeBanner, { marginTop: 12, backgroundColor: colors.background }]}>
              <ShoppingBag size={14} color={colors.secondary} />
              <Text style={styles.budgetRangeText}>
                SHOPPING BUDGET: ₦{waka.budget_min?.toLocaleString() || '0'} — ₦{waka.budget_max?.toLocaleString() || '∞'}
              </Text>
            </View>
          )}
        </View>

        {/* Status Banner */}
        <View style={[styles.statusBanner, waka.status === 'cancelled' && { backgroundColor: '#FFDEDE' }]}>
          <Clock size={18} color={waka.status === 'cancelled' ? colors.error : colors.text} strokeWidth={2.5} />
          <Text style={[styles.statusText, waka.status === 'cancelled' && { color: colors.error }]}>
            {getStatusText(waka.step, waka.status)}
          </Text>
        </View>

        {/* Progress Stepper - Hide if cancelled */}
        {waka.status !== 'cancelled' && (
          <View style={styles.stepperRow}>
            {STEPS.map((s, i) => {
              const active = i < waka.step;
              const current = i === waka.step - 1;
              return (
                <View key={s.label} style={styles.stepItem}>
                  <View style={[styles.stepCircle, active && styles.stepCircleActive, current && styles.stepCircleCurrent]}>
                    <s.icon size={16} color={active ? colors.surface : colors.muted} strokeWidth={3} />
                  </View>
                  <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{s.label}</Text>
                  {i < STEPS.length - 1 && (
                    <View style={[styles.stepLine, active && styles.stepLineActive]} />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Participant (Runner/Nomad) Card */}
        {displayUser ? (
          <View style={styles.runnerCard}>
            <TouchableOpacity 
              style={styles.runnerHeaderRow}
              onPress={() => router.push(`/runner/${displayUser.id}`)}
              activeOpacity={0.7}
            >
              <Image 
                source={displayUser.avatar_url 
                  ? { 
                      uri: `${API.API_URL}${displayUser.avatar_url}`,
                      headers: { Authorization: `Bearer ${token}` }
                    } 
                  : { uri: `https://i.pravatar.cc/150?u=${displayUser.id}` }
                }
                style={styles.runnerAvatar} 
                contentFit="cover"
                transition={200}
              />
              <View style={styles.runnerInfo}>
                <Text style={styles.runnerName}>{displayUser.full_name}</Text>
                <Text style={styles.runnerRating}>
                  ★ {displayUser.stats_rating?.toFixed(1) || '5.0'} · {displayUser.is_runner ? 'Runner' : 'Nomad'}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.runnerActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleChat}>
                <MessageCircle size={20} color={colors.text} strokeWidth={2.5} />
                <Text style={styles.actionBtnText}>MESSAGE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.secondary }]}>
                <Phone size={20} color={colors.surface} strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: colors.surface }]}>CALL</Text>
              </TouchableOpacity>
            </View>
            
            {actingAsRunner && waka.status === 'sourcing' && (
              <TouchableOpacity 
                style={[styles.actionBtn, { marginTop: 12, backgroundColor: colors.primary, width: '100%' }]}
                onPress={() => setShowInventoryForm(true)}
              >
                <ShoppingBag size={20} color={colors.surface} strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: colors.surface }]}>PROPOSE ITEM BID</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (waka.status !== 'cancelled' && (
          <View style={styles.runnerCard}>
            <View style={styles.runnerHeaderRow}>
              <View style={styles.noRunnerBox}>
                <Text style={styles.noRunnerEmoji}>⏳</Text>
              </View>
              <View style={styles.runnerInfo}>
                <Text style={styles.runnerName}>Finding runner…</Text>
                <Text style={styles.runnerRating}>Broadcast active nearby</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Dispute Button */}
        {waka.status !== 'cancelled' && waka.status !== 'finding_runner' && (
          <TouchableOpacity 
            style={[styles.cancelBtn, { marginTop: 20, borderStyle: 'dashed' }]}
            onPress={() => setDisputeVisible(true)}
          >
            <Text style={styles.cancelText}>RAISE DISPUTE / REPORT ISSUE</Text>
          </TouchableOpacity>
        )}

        {/* Live Inventory Bidding Section */}
        {waka.inventory_items && waka.inventory_items.length > 0 && (
          <View style={[styles.card, { marginTop: 20, borderColor: colors.secondary }]}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTitle}>LIVE INVENTORY BIDS</Text>
              <View style={[styles.livePill, { backgroundColor: colors.secondary }]}>
                <Text style={styles.liveText}>ACTION REQUIRED</Text>
              </View>
            </View>
            <Text style={styles.listHeader}>Tap to add/remove from your errand budget</Text>
            
            {waka.inventory_items.map((item: any) => (
              <View key={item.id} style={[styles.itemBulletRow, { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#EEE' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.runnerName}>{item.name}</Text>
                  <Text style={[styles.priceValue, { fontSize: 16 }]}>₦{item.price.toLocaleString()}</Text>
                </View>
                
                {item.status === 'proposed' ? (
                  isNomad ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity 
                        style={[styles.areaBadge, { backgroundColor: colors.error }]}
                        onPress={() => handleRespondToBid(item.id, false)}
                      >
                        <Text style={[styles.areaLabel, { color: colors.surface }]}>DECLINE</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.areaBadge, { backgroundColor: colors.secondary }]}
                        onPress={() => handleRespondToBid(item.id, true)}
                      >
                        <Text style={[styles.areaLabel, { color: colors.surface }]}>APPROVE</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.standardHintText}>AWAITING NOMAD</Text>
                  )
                ) : (
                  <View style={[styles.categoryBadge, { backgroundColor: item.status === 'approved' ? colors.secondary : colors.error }]}>
                    <Text style={[styles.categoryLabel, { color: colors.surface }]}>{item.status.toUpperCase()}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Tipping Section (Nomad only, if completed) */}
        {isNomad && waka.status === 'completed' && (
          <View style={[styles.card, { marginTop: 20, backgroundColor: '#FFFACD' }]}>
            <Text style={styles.cardTitle}>SEND A TIP? 🎁</Text>
            <Text style={styles.fieldHint}>Show some appreciation for the runner's hard work.</Text>
            <View style={[styles.brutalInput, { flexDirection: 'row', alignItems: 'center', marginTop: 10 }]}>
              <Text style={{ fontFamily: 'SpaceMono-Bold', marginRight: 5 }}>₦</Text>
              <TextInput 
                style={{ flex: 1, fontFamily: 'SpaceMono-Bold' }}
                placeholder="Amount (e.g. 500)"
                keyboardType="numeric"
                value={tipAmount}
                onChangeText={setTipAmount}
              />
              <TouchableOpacity 
                style={[styles.smallBtn, !tipAmount && { opacity: 0.5 }]} 
                onPress={handleTip}
                disabled={!tipAmount || isTipping}
              >
                {isTipping ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.smallBtnText}>TIP</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Payment Method Option */}
        <View style={styles.paymentOptionCard}>
          <View style={styles.paymentHeader}>
            <Text style={styles.paymentSectionTitle}>PAYMENT OPTION</Text>
            {isUpdatingPaymentMethod && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
          
          <View style={styles.paymentToggleRow}>
            <TouchableOpacity 
              style={[
                styles.paymentToggleBtn, 
                waka.payment_method === 'wallet' && styles.paymentToggleActive,
                (!isNomad || waka.is_sourcing_funded || waka.is_completed) && { opacity: waka.payment_method === 'wallet' ? 1 : 0.4 }
              ]}
              onPress={() => handleUpdatePaymentMethod('wallet')}
              disabled={!isNomad || waka.is_sourcing_funded || waka.is_completed || isUpdatingPaymentMethod}
            >
              <Package size={16} color={waka.payment_method === 'wallet' ? colors.surface : colors.text} />
              <Text style={[styles.paymentToggleText, waka.payment_method === 'wallet' && { color: colors.surface }]}>WALLET</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.paymentToggleBtn, 
                waka.payment_method === 'cash' && styles.paymentToggleActive,
                (!isNomad || waka.is_sourcing_funded || waka.is_completed) && { opacity: waka.payment_method === 'cash' ? 1 : 0.4 }
              ]}
              onPress={() => handleUpdatePaymentMethod('cash')}
              disabled={!isNomad || waka.is_sourcing_funded || waka.is_completed || isUpdatingPaymentMethod}
            >
              <Zap size={16} color={waka.payment_method === 'cash' ? colors.surface : colors.text} />
              <Text style={[styles.paymentToggleText, waka.payment_method === 'cash' && { color: colors.surface }]}>CASH / POD</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.paymentHint}>
            {waka.payment_method === 'wallet' 
              ? "Funds are secured and transferred automatically upon completion." 
              : "Pay the runner directly via cash or bank transfer."}
            {(!waka.is_sourcing_funded && !waka.is_completed && isNomad) && " Tap to switch."}
          </Text>
        </View>

        {/* Actions for Runner */}
        {user?.is_runner && waka.employer_id !== user.id && !waka.is_completed && (
          <View style={{ marginTop: DT.spacing.lg, gap: DT.spacing.md }}>
            {waka.status === 'finding_runner' && (
              <View style={{ gap: DT.spacing.md }}>
                <TouchableOpacity 
                  style={[styles.primaryAction, isAccepting && { opacity: 0.7 }]} 
                  onPress={handleAccept}
                  disabled={isAccepting}
                >
                  {isAccepting ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <>
                      <Zap size={20} color={colors.surface} strokeWidth={2.5} />
                      <Text style={styles.primaryActionText}>ACCEPT WAKA</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.cancelBtn, isDeclining && { opacity: 0.7 }]} 
                  onPress={handleDecline}
                  disabled={isDeclining}
                >
                  {isDeclining ? (
                    <ActivityIndicator color={colors.error} />
                  ) : (
                    <Text style={styles.cancelText}>Decline / Hide</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {waka.runner_id === user.id && waka.status !== 'finding_runner' && (
              <View style={{ gap: DT.spacing.md }}>
                {waka.step === 2 && (
                  <TouchableOpacity 
                    style={styles.primaryAction} 
                    onPress={() => handleUpdateStep(3)}
                  >
                    <Truck size={20} color={colors.surface} strokeWidth={2.5} />
                    <Text style={styles.primaryActionText}>START ERRAND / SOURCING</Text>
                  </TouchableOpacity>
                )}
                
                {waka.step === 3 && waka.status !== 'sourcing_submitted' && !waka.is_sourcing_funded && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Sourcing & Billing</Text>
                    {(waka.budget_min || waka.budget_max) && (
                      <View style={styles.budgetRangeBanner}>
                        <Clock size={14} color={colors.secondary} />
                        <Text style={styles.budgetRangeText}>
                          Budget Range: ₦{waka.budget_min?.toLocaleString() || '0'} — ₦{waka.budget_max?.toLocaleString() || '∞'}
                        </Text>
                      </View>
                    )}
                    
                    <View style={{ gap: 12, marginTop: 8 }}>
                      <View>
                        <Text style={styles.inputLabel}>Total Grocery Cost (₦)</Text>
                        <TextInput
                          style={styles.brutalInput}
                          placeholder="e.g. 5500"
                          keyboardType="numeric"
                          value={sourcingBudget}
                          onChangeText={setSourcingBudget}
                        />
                      </View>
                      
                      <View>
                        <Text style={styles.inputLabel}>Your Bank Details (for transfer)</Text>
                        <TextInput
                          style={[styles.brutalInput, { marginBottom: 8 }]}
                          placeholder="Bank Name"
                          value={bankName}
                          onChangeText={setBankName}
                        />
                        <TextInput
                          style={[styles.brutalInput, { marginBottom: 8 }]}
                          placeholder="Account Number"
                          keyboardType="numeric"
                          value={accNumber}
                          onChangeText={setAccNumber}
                        />
                        <TextInput
                          style={styles.brutalInput}
                          placeholder="Account Name"
                          value={accName}
                          onChangeText={setAccName}
                        />
                      </View>

                      <TouchableOpacity 
                        style={[styles.primaryAction, isSubmittingSourcing && { opacity: 0.7 }]} 
                        onPress={handleSubmitSourcing}
                        disabled={isSubmittingSourcing}
                      >
                        {isSubmittingSourcing ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryActionText}>SUBMIT BILL TO NOMAD</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {waka.status === 'sourcing_submitted' && (
                  <View style={[styles.infoBanner, { backgroundColor: colors.surface, borderColor: colors.secondary }]}>
                    <Clock size={16} color={colors.secondary} />
                    <Text style={[styles.infoText, { color: colors.secondary }]}>Bill Sent. Awaiting Funding...</Text>
                  </View>
                )}

                {waka.is_sourcing_funded && waka.step === 3 && (
                  <TouchableOpacity 
                    style={styles.primaryAction} 
                    onPress={() => handleUpdateStep(4)}
                  >
                    <MapPin size={20} color={colors.surface} strokeWidth={2.5} />
                    <Text style={styles.primaryActionText}>PROCEED TO DELIVERY</Text>
                  </TouchableOpacity>
                )}

                {waka.step === 4 && !waka.completed_by_runner && (
                  <TouchableOpacity 
                    style={[styles.primaryAction, { backgroundColor: colors.secondary }]} 
                    onPress={handleComplete}
                  >
                    <CheckCircle2 size={20} color={colors.surface} strokeWidth={2.5} />
                    <Text style={styles.primaryActionText}>MARK AS FINISHED</Text>
                  </TouchableOpacity>
                )}
                {waka.completed_by_runner && !waka.is_completed && (
                  <View style={[styles.infoBanner, { backgroundColor: colors.surface, borderColor: colors.secondary }]}>
                    <Clock size={16} color={colors.secondary} />
                    <Text style={[styles.infoText, { color: colors.secondary }]}>Awaiting Nomad Confirmation...</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Actions for Nomad (Employer) */}
        {user?.id === waka.employer_id && !waka.is_completed && waka.status !== 'cancelled' && (
          <View style={{ marginTop: DT.spacing.lg, gap: DT.spacing.md }}>
            {/* Sourcing State: Submitted (Waiting for Nomad) */}
            {waka.status === 'sourcing_submitted' && user?.id === waka.employer_id && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bill Verification</Text>
                
                <View style={styles.billDetailRow}>
                  <Text style={styles.billLabel}>Requested Amount</Text>
                  <Text style={styles.billValue}>₦{waka.sourcing_budget?.toLocaleString()}</Text>
                </View>
                
                <View style={styles.bankInfoBox}>
                  <Text style={styles.bankHeader}>TRANSFER TO SOURCING STORE / RUNNER</Text>
                  <Text style={styles.bankDetail}>{waka.sourcing_bank_name}</Text>
                  <Text style={styles.bankDetail}>{waka.sourcing_account_number}</Text>
                  <Text style={styles.bankDetail}>{waka.sourcing_account_name}</Text>
                </View>

                <View style={styles.negotiationActions}>
                  <TouchableOpacity 
                    style={[styles.negotiationBtn, styles.declineBtn]}
                    onPress={handleRejectSourcing}
                    disabled={loading}
                  >
                    <Text style={styles.declineBtnText}>DECLINE BILL</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.negotiationBtn, styles.approveBtn]}
                    onPress={handleFundSourcing}
                    disabled={loading}
                  >
                    <Text style={styles.approveBtnText}>
                      {waka.payment_method === 'cash' ? 'APPROVE & CONFIRM CASH' : 'APPROVE & FUND'}
                    </Text>
                  </TouchableOpacity>
                  {waka.payment_method === 'cash' && (
                    <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4, textAlign: 'center' }}>
                      Confirmation records this offline payment on our platform ledger.
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Sourcing State: Rejected (Runner View) */}
            {waka.status === 'sourcing_rejected' && user?.id === waka.runner_id && (
              <View style={[styles.card, { borderColor: colors.error }]}>
                <Text style={[styles.cardTitle, { color: colors.error }]}>BILL DECLINED</Text>
                <Text style={styles.infoText}>The nomad has declined your sourcing request. Please review the items and resubmit a new bill.</Text>
                <TouchableOpacity 
                  style={[styles.primaryAction, { marginTop: 16, backgroundColor: colors.secondary }]}
                  onPress={fetchWakaDetails}
                >
                  <Text style={styles.primaryActionText}>RESUBMIT BILL</Text>
                </TouchableOpacity>
              </View>
            )}

            {waka.step >= 4 && !waka.completed_by_employer && actingAsRunner && (
              <View style={[styles.card, { marginTop: 12, borderStyle: 'dashed' }]}>
                <Text style={styles.listHeader}>PROOF OF DELIVERY</Text>
                {podImage || waka.pod_url ? (
                  <View style={styles.podPreviewContainer}>
                    <Image 
                      source={{ uri: podImage || `${API.API_URL}${waka.pod_url}` }}
                      style={styles.podPreview}
                    />
                    {!waka.pod_url && (
                      <TouchableOpacity style={styles.changePodBtn} onPress={pickImage}>
                        <Camera size={16} color={colors.surface} />
                        <Text style={styles.changePodText}>RETREKE</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addPodBtn} onPress={pickImage}>
                    <Camera size={24} color={colors.text} />
                    <Text style={styles.addPodText}>TAKE DELIVERY PHOTO</Text>
                    <Text style={styles.addPodSub}>Highly recommended to prevent disputes</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {waka.step >= 4 && !waka.completed_by_employer && (
              <TouchableOpacity 
                style={[styles.primaryAction, { backgroundColor: colors.secondary, marginTop: 12 }]} 
                onPress={handleComplete}
                disabled={isUploadingPOD || isAccepting}
              >
                {isUploadingPOD || isAccepting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <>
                    <CheckCircle2 size={20} color={colors.surface} strokeWidth={2.5} />
                    <Text style={styles.primaryActionText}>CONFIRM COMPLETION</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {isNomad && waka.pod_url && (
               <View style={[styles.card, { marginTop: 12, backgroundColor: '#F0F9FF', borderColor: colors.secondary }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Eye size={16} color={colors.secondary} />
                  <Text style={[styles.listHeader, { marginBottom: 0, color: colors.secondary }]}>VIEW DELIVERY PHOTO</Text>
                </View>
                <Image 
                  source={{ 
                    uri: `${API.API_URL}${waka.pod_url}`,
                    headers: { Authorization: `Bearer ${token}` }
                  }}
                  style={styles.podPreview}
                  contentFit="cover"
                />
               </View>
            )}
            {waka.completed_by_employer && !waka.is_completed && (
              <View style={[styles.infoBanner, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                <Clock size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.primary }]}>Awaiting Runner Confirmation...</Text>
              </View>
            )}
            {isNomad && waka.is_shared && waka.status !== 'completed' && waka.status !== 'cancelled' && (
              <TouchableOpacity 
                style={[styles.primaryAction, { backgroundColor: colors.accent, marginTop: 12 }]} 
                onPress={() => setShowInviteModal(true)}
              >
                <Plus size={20} color={colors.surface} strokeWidth={2.5} />
                <Text style={styles.primaryActionText}>INVITE FRIEND</Text>
              </TouchableOpacity>
            )}

            {isNomad && waka.status !== 'completed' && waka.status !== 'cancelled' && (
              <TouchableOpacity 
                style={[styles.actionBtn, { marginTop: 12, borderColor: colors.error }]} 
                onPress={handleRaiseDispute}
              >
                <AlertTriangle size={20} color={colors.error} />
                <Text style={[styles.actionBtnText, { color: colors.error }]}>RAISE DISPUTE</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.cancelBtn, isCancelling && { opacity: 0.5 }, { marginTop: 12 }]} 
              onPress={handleCancel}
              disabled={isCancelling}
            >
              <Text style={styles.cancelText}>Cancel Waka</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Review Form - Show when completed and user hasn't reviewed */}
        {waka.is_completed && (
          (user?.id === waka.employer_id && !waka.has_employer_reviewed) ||
          (user?.id === waka.runner_id && !waka.has_runner_reviewed)
        ) && (
          <View style={{ marginTop: DT.spacing.md }}>
            <ReviewForm 
              targetName={user?.id === waka.employer_id ? (waka.runner?.full_name || 'Runner') : (waka.employer?.full_name || 'Nomad')}
              onSubmit={handleLeaveReview}
            />
          </View>
        )}
        
        {waka.status === 'cancelled' && (
          <View style={[styles.card, { borderColor: colors.error, borderStyle: 'dashed' }]}>
            <Text style={[styles.cardTitle, { color: colors.error }]}>This waka was cancelled</Text>
            <Text style={styles.infoText}>You can broadcast a new errand from the home screen.</Text>
            <TouchableOpacity 
              style={[styles.actionBtn, { marginTop: DT.spacing.md, backgroundColor: colors.text }]}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={{ color: colors.surface, fontFamily: DT.typography.heading }}>BACK HOME</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <BrutalistAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />

      {/* Inventory Proposal Modal Refined */}
      <Modal visible={showInventoryForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PROPOSE ITEM</Text>
              <TouchableOpacity onPress={() => setShowInventoryForm(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>ITEM NAME</Text>
              <TextInput
                style={[styles.brutalInput, { marginBottom: 16 }]}
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder="e.g. 1kg Tomatoes"
              />

              <Text style={styles.inputLabel}>PRICE (₦)</Text>
              <TextInput
                style={[styles.brutalInput, { marginBottom: 16 }]}
                value={newItemPrice}
                onChangeText={setNewItemPrice}
                placeholder="0.00"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>PHOTO (MUST SHOW PRICE TAG)</Text>
              <TouchableOpacity 
                style={styles.photoPicker} 
                onPress={() => {
                  if (permission?.granted) setShowCamera(true);
                  else requestPermission();
                }}
              >
                {newItemPhoto ? (
                  <Image source={{ uri: newItemPhoto }} style={styles.pickedImage} />
                ) : (
                  <>
                    <Camera size={32} color={colors.text} />
                    <Text style={styles.photoPickerText}>OPEN CAMERA</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.primaryAction, { marginTop: 24, width: '100%' }, isProposingItem && { opacity: 0.7 }]} 
                onPress={handleProposeItem}
                disabled={isProposingItem}
              >
                {isProposingItem ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryActionText}>SEND PROPOSAL</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Expo Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView 
            style={{ flex: 1 }} 
            facing="back"
            ref={cameraRef}
          >
            <View style={styles.cameraOverlay}>
              <TouchableOpacity style={styles.camClose} onPress={() => setShowCamera(false)}>
                <X size={32} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.camGuides}>
                <View style={styles.camTarget}>
                  <Text style={styles.camGuideText}>ALIGN ITEM & PRICE TAG</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.captureBtn} 
                onPress={async () => {
                  if (cameraRef.current) {
                    const photo = await cameraRef.current.takePictureAsync();
                    setNewItemPhoto(photo.uri);
                    setShowCamera(false);
                  }
                }}
              >
                <View style={styles.captureInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Invite Friend Modal */}
      <Modal visible={showInviteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>INVITE FRIEND</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>FRIEND'S PHONE NUMBER</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <TextInput
                style={[styles.brutalInput, { flex: 1 }]}
                value={invitePhone}
                onChangeText={setInvitePhone}
                placeholder="080..."
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.smallSearchBtn} onPress={handleSearchFriend}>
                {isSearchingFriend ? <ActivityIndicator color="#FFF" /> : <Eye size={20} color="#FFF" />}
              </TouchableOpacity>
            </View>

            {invitedFriend && (
              <View style={styles.friendConfirmBox}>
                <Image 
                  source={invitedFriend.avatar_url ? { uri: `${API.API_URL}${invitedFriend.avatar_url}` } : { uri: 'https://i.pravatar.cc/150?u=friend' }} 
                  style={styles.friendAvatar} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendName}>{invitedFriend.full_name}</Text>
                  <Text style={styles.friendSub}>Confirm person before inviting</Text>
                </View>
                <TouchableOpacity style={styles.inviteConfirmBtn} onPress={handleInviteFriend}>
                  {isInviting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.inviteConfirmText}>INVITE</Text>}
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.fieldHint}>Invited friends can join and split the delivery fee instantly.</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: DT.spacing.lg,
      paddingVertical: DT.spacing.md,
      borderBottomWidth: 2,
      borderBottomColor: colors.text,
      backgroundColor: colors.background,
      gap: DT.spacing.md,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderWidth: 2,
      borderColor: colors.text,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: DT.typography.heading,
      fontSize: 20,
      color: colors.text,
      flex: 1,
    },
    livePill: {
      backgroundColor: colors.secondary,
      borderWidth: 2,
      borderColor: colors.text,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    liveText: {
      fontFamily: DT.typography.heading,
      fontSize: 11,
      color: colors.surface,
      letterSpacing: 1,
    },
    scroll: {
      paddingHorizontal: DT.spacing.lg,
      paddingBottom: DT.spacing.xl,
      paddingTop: DT.spacing.md,
    },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DT.spacing.md,
      backgroundColor: colors.accent,
      borderWidth: 3,
      borderColor: colors.text,
      padding: DT.spacing.md,
      marginBottom: DT.spacing.xl,
      shadowColor: colors.text,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 4,
    },
    statusText: {
      fontFamily: DT.typography.heading,
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    budgetRangeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#F0F9FF',
      padding: 8,
      borderWidth: 2,
      borderColor: colors.text,
    },
    budgetRangeText: {
      fontFamily: DT.typography.bodySemiBold,
      fontSize: 12,
      color: colors.secondary,
    },
    itemListContainer: {
      backgroundColor: colors.background,
      padding: 12,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: colors.text,
      borderStyle: 'dashed',
    },
    itemBulletRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
    },
    bulletDotSmall: {
      width: 5,
      height: 5,
      backgroundColor: colors.text,
    },
    itemBulletText: {
      flex: 1,
      fontFamily: DT.typography.bodySemiBold,
      fontSize: 13,
      color: colors.text,
    },
    negotiationActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    negotiationBtn: {
      flex: 1,
      height: 48,
      borderWidth: 3,
      borderColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
    },
    declineBtn: {
      backgroundColor: '#FFE5E5',
    },
    approveBtn: {
      backgroundColor: colors.primary,
    },
    declineBtnText: {
      fontFamily: DT.typography.heading,
      fontSize: 12,
      color: colors.error,
    },
    approveBtnText: {
      fontFamily: DT.typography.heading,
      fontSize: 12,
      color: colors.surface,
    },
    listHeader: {
      fontFamily: DT.typography.heading,
      fontSize: 10,
      color: colors.muted,
      marginBottom: 8,
      letterSpacing: 1,
    },
    removalHint: {
      fontFamily: DT.typography.bodySemiBold,
      fontSize: 10,
      color: colors.error,
      marginTop: 8,
      fontStyle: 'italic',
    },
    inputLabel: {
      fontFamily: DT.typography.heading,
      fontSize: 12,
      color: colors.muted,
      marginBottom: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderWidth: 4,
      borderColor: colors.text,
      padding: 24,
      shadowColor: colors.text,
      shadowOffset: { width: 8, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 8,
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
      color: colors.text,
    },
    photoPicker: {
      height: 160,
      borderWidth: 2,
      borderColor: colors.text,
      borderStyle: 'dashed',
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    pickedImage: {
      width: '100%',
      height: '100%',
    },
    photoPickerText: {
      fontFamily: DT.typography.heading,
      fontSize: 12,
      color: colors.text,
      marginTop: 8,
    },
    brutalInput: {
      height: 48,
      borderWidth: 3,
      borderColor: colors.text,
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      fontFamily: DT.typography.heading,
      fontSize: 14,
      color: colors.text,
    },
    billDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    billLabel: {
      fontFamily: DT.typography.heading,
      fontSize: 16,
      color: colors.muted,
    },
    billValue: {
      fontFamily: DT.typography.heading,
      fontSize: 20,
      color: colors.text,
    },
    bankInfoBox: {
      backgroundColor: colors.background,
      padding: 12,
      borderWidth: 2,
      borderColor: colors.text,
      marginBottom: 16,
    },
    bankHeader: {
      fontFamily: DT.typography.heading,
      fontSize: 10,
      color: colors.muted,
      marginBottom: 4,
    },
    bankDetail: {
      fontFamily: DT.typography.heading,
      fontSize: 15,
      color: colors.text,
    },
    stepperRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 40,
      position: 'relative',
    },
    stepItem: {
      alignItems: 'center',
      flex: 1,
      gap: 8,
    },
    stepCircle: {
      width: 36,
      height: 36,
      borderWidth: 3,
      borderColor: colors.text,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepCircleActive: {
      backgroundColor: colors.muted,
    },
    stepCircleCurrent: {
      backgroundColor: colors.primary,
    },
    stepLabel: {
      fontFamily: DT.typography.heading,
      fontSize: 11,
      color: colors.muted,
      textAlign: 'center',
    },
    stepLabelActive: {
      color: colors.text,
    },
    stepLine: {
      position: 'absolute',
      top: 16,
      left: '55%',
      right: '-55%',
      height: 4,
      backgroundColor: colors.border,
      zIndex: -1,
    },
    stepLineActive: {
      backgroundColor: colors.text,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.text,
      padding: DT.spacing.md,
      marginBottom: DT.spacing.lg,
      shadowColor: colors.text, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    areaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.secondary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1.5,
      borderColor: colors.text,
      gap: 4,
    },
    areaLabel: {
      fontFamily: DT.typography.heading,
      fontSize: 9,
      color: colors.surface,
      letterSpacing: 0.5,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1.5,
      borderColor: colors.text,
      gap: 4,
    },
    categoryLabel: {
      fontFamily: DT.typography.heading,
      fontSize: 9,
      color: colors.text,
      letterSpacing: 0.5,
    },
    priceValue: {
      fontFamily: DT.typography.heading,
      fontSize: 22,
      color: colors.text,
    },
    cardTitle: {
      fontFamily: DT.typography.heading,
      fontSize: 18,
      color: colors.text,
      marginBottom: 10,
    },
    detailsGrid: {
      gap: 8,
      marginBottom: 12,
      backgroundColor: colors.background,
      padding: 10,
      borderWidth: 2,
      borderColor: colors.text,
      borderStyle: 'dashed',
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailLabel: {
      fontFamily: DT.typography.bodySemiBold,
      fontSize: 10,
      color: colors.muted,
      flex: 1,
    },
    feeHintRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 2,
      borderTopColor: colors.text,
      paddingTop: 10,
      marginTop: 4,
    },
    feeHintLabel: {
      fontFamily: DT.typography.heading,
      fontSize: 10,
      color: colors.muted,
      letterSpacing: 1,
    },
    flashStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    flashInnerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.text,
      paddingHorizontal: 6,
      paddingVertical: 2,
      gap: 4,
    },
    flashInnerText: {
      fontFamily: DT.typography.heading,
      fontSize: 9,
      color: colors.surface,
      letterSpacing: 1,
    },
    standardHintText: {
      fontFamily: DT.typography.heading,
      fontSize: 9,
      color: colors.muted,
      letterSpacing: 0.5,
    },
    runnerCard: {
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.text,
      padding: DT.spacing.md,
      marginBottom: DT.spacing.xl,
      shadowColor: colors.text, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
      gap: DT.spacing.md,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderWidth: 2,
      backgroundColor: colors.surface,
    },
    runnerHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DT.spacing.md,
    },
    runnerAvatar: {
      width: 64,
      height: 64,
      borderWidth: 3,
      borderColor: colors.text,
    },
    noRunnerBox: {
      width: 64,
      height: 64,
      borderWidth: 3,
      borderColor: colors.text,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noRunnerEmoji: { fontSize: 28 },
    runnerInfo: { flex: 1 },
    runnerName: {
      fontFamily: DT.typography.heading,
      fontSize: 18,
      color: colors.text,
    },
    runnerRating: {
      fontFamily: DT.typography.bodySemiBold,
      fontSize: 13,
      color: colors.muted,
      marginTop: 4,
    },
    runnerActions: {
      flexDirection: 'row',
      gap: DT.spacing.md,
      marginTop: 8,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      height: 48,
      borderWidth: 3,
      borderColor: colors.text,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
    },
    actionBtnText: {
      fontFamily: DT.typography.heading,
      fontSize: 14,
      color: colors.text,
    },
    cancelBtn: {
      height: 64,
      borderWidth: 3,
      borderColor: colors.error,
      borderStyle: 'dashed',
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontFamily: DT.typography.heading,
      fontSize: 18,
      letterSpacing: 1,
      color: colors.error,
    },
    primaryAction: {
      height: 64,
      backgroundColor: colors.primary,
      borderWidth: 3,
      borderColor: colors.text,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      shadowColor: colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
    },
    primaryActionText: {
      fontFamily: DT.typography.heading,
      fontSize: 18,
      color: colors.surface,
      letterSpacing: 1,
    },
    infoText: {
      fontFamily: DT.typography.bodySemiBold,
      fontSize: 13,
      color: colors.text,
      flex: 1,
    },
    // Payment Option Card
    paymentOptionCard: {
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.text,
      padding: 12,
      marginTop: 12,
      shadowColor: colors.text,
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 0,
    },
    paymentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    paymentSectionTitle: {
      fontFamily: DT.typography.heading,
      fontSize: 12,
      color: colors.muted,
    },
    paymentToggleRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    paymentToggleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderWidth: 2,
      borderColor: colors.text,
      gap: 6,
    },
    paymentToggleActive: {
      backgroundColor: colors.text,
    },
    paymentToggleText: {
      fontFamily: DT.typography.heading,
      fontSize: 12,
      color: colors.text,
    },
    paymentHint: {
      fontFamily: DT.typography.body,
      fontSize: 11,
      color: colors.muted,
      lineHeight: 16,
    },
    fieldHint: {
      fontFamily: DT.typography.body,
      fontSize: 11,
      color: colors.muted,
      marginTop: 4,
    },
    smallBtn: {
      backgroundColor: colors.text,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 2,
      borderColor: colors.text,
    },
    smallBtnText: {
      color: colors.surface,
      fontFamily: DT.typography.heading,
      fontSize: 11,
    },
    podPreviewContainer: {
      position: 'relative',
      height: 200,
      width: '100%',
      borderWidth: 2,
      borderColor: colors.text,
      overflow: 'hidden',
    },
    podPreview: {
      width: '100%',
      height: '100%',
    },
    addPodBtn: {
      height: 120,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.text,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    addPodText: {
      fontFamily: DT.typography.heading,
      fontSize: 14,
      color: colors.text,
    },
    addPodSub: {
      fontFamily: DT.typography.body,
      fontSize: 10,
      color: colors.muted,
    },
    changePodBtn: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      backgroundColor: colors.text,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 6,
    },
    changePodText: {
      fontFamily: DT.typography.heading,
      fontSize: 10,
      color: colors.surface,
    },
    // New Styles for Camera & Invitations
    cameraOverlay: {
      flex: 1,
      justifyContent: 'space-between',
      padding: 40,
    },
    camClose: {
      alignSelf: 'flex-end',
    },
    camGuides: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    camTarget: {
      width: 280,
      height: 200,
      borderWidth: 2,
      borderColor: '#FFF',
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
    camGuideText: {
      color: '#FFF',
      fontFamily: DT.typography.heading,
      fontSize: 12,
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 4,
    },
    captureBtn: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.3)',
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
    },
    captureInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#FFF',
    },
    smallSearchBtn: {
      backgroundColor: colors.text,
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.text,
    },
    friendConfirmBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 12,
      borderWidth: 2,
      borderColor: colors.text,
      gap: 12,
      marginBottom: 20,
    },
    friendAvatar: {
      width: 50,
      height: 50,
      borderWidth: 2,
      borderColor: colors.text,
    },
    friendName: {
      fontFamily: DT.typography.heading,
      fontSize: 14,
      color: colors.text,
    },
    friendSub: {
      fontFamily: DT.typography.body,
      fontSize: 10,
      color: colors.muted,
    },
    inviteConfirmBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 2,
      borderColor: colors.text,
    },
    inviteConfirmText: {
      fontFamily: DT.typography.heading,
      fontSize: 12,
      color: colors.surface,
    },
  });
}
