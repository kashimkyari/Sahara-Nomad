import * as Location from 'expo-location';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MapPin, Package, ShoppingCart, Utensils, Zap, Clock, User as UserIcon, Users, Calendar, Repeat } from 'lucide-react-native';
import React, { useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignTokens as DT } from '../constants/design';
import { useTheme } from '../hooks/use-theme';
import { useAuth } from '../context/AuthContext';
import API from '../constants/api';
import { BrutalistAlert } from '../components/ui/BrutalistAlert';
import AddressSelector from '../components/ui/AddressSelector';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - DT.spacing.lg * 2 - 4; // subtract padding
const MIN_PRICE = 3000;
const MAX_PRICE = 30000;
const SLIDER_TICKS = [5000, 10000, 15000, 20000, 25000];

const CATEGORIES = [
  { id: 'package', label: 'Package', icon: Package },
  { id: 'market', label: 'Market', icon: ShoppingCart },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'custom', label: 'Custom', icon: Zap },
];

export default function NewErrandScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const { runnerId, runnerName } = useLocalSearchParams<{ runnerId?: string; runnerName?: string }>();
  
  const [category, setCategory] = useState('package');
  const [urgency, setUrgency] = useState('standard'); // 'standard' | 'flash'
  const [items, setItems] = useState<string[]>(['']); // Array of bullet points
  const [location, setLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [dropType, setDropType] = useState('doorstep'); // 'doorstep' | 'locker'

  // GPS coordinates stored alongside the address strings
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const [isFetchingPickup, setIsFetchingPickup] = useState(false);
  const [isFetchingDelivery, setIsFetchingDelivery] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  const [price, setPrice] = useState(5000);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'cash'>('wallet');
  
  // V3 Logistics State
  const [frequency, setFrequency] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once');
  const [isShared, setIsShared] = useState(false);
  const [maxSpots, setMaxSpots] = useState(3);
  const [isInsuranceOptedIn, setIsInsuranceOptedIn] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [selectedPickupId, setSelectedPickupId] = useState<string>();
  const [selectedDropoffId, setSelectedDropoffId] = useState<string>();

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

  // Re-calculate X based on price changes (e.g., Flash mode adds 1000)
  const getXForPrice = (p: number) => ((p - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * SLIDER_WIDTH;

  const sliderX = useRef(new Animated.Value(getXForPrice(price))).current;
  const currentX = useRef(getXForPrice(price));
  const isDragging = useRef(false);

  const [incentive, setIncentive] = useState(1000); // Default user-controlled flash incentive
  const [isCustomIncentive, setIsCustomIncentive] = useState(false);

  // Sync slider animation if price changes externally
  useEffect(() => {
    if (isDragging.current) return; // Prevent spring animation fighting the pan drag
    
    const newX = getXForPrice(price);
    currentX.current = newX;
    Animated.spring(sliderX, {
      toValue: newX,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [price]);

  const handleUrgencyToggle = (mode: string) => {
    setUrgency(mode);
  };

  const panResponder = useRef(
    PanResponder.create({
// ... (rest remains unchanged)
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setScrollEnabled(false);
        isDragging.current = true;
        sliderX.setOffset(currentX.current);
        sliderX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        let newX = currentX.current + gestureState.dx;
        newX = Math.max(0, Math.min(SLIDER_WIDTH, newX));
        
        // Visually slide with finger directly
        sliderX.setValue(newX - currentX.current);
        
        // Update price state in background
        const rawPrice = MIN_PRICE + (newX / SLIDER_WIDTH) * (MAX_PRICE - MIN_PRICE);
        const snappedPrice = Math.round(rawPrice / 500) * 500;
        const boundedPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, snappedPrice));
        setPrice(boundedPrice);
      },
      onPanResponderRelease: (_, gestureState) => {
        setScrollEnabled(true);
        isDragging.current = false;
        sliderX.flattenOffset();
        
        let newX = currentX.current + gestureState.dx;
        newX = Math.max(0, Math.min(SLIDER_WIDTH, newX));
        
        const rawPrice = MIN_PRICE + (newX / SLIDER_WIDTH) * (MAX_PRICE - MIN_PRICE);
        const snappedPrice = Math.round(rawPrice / 500) * 500;
        const boundedPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, snappedPrice));
        
        // Snap visually to the exact interval
        const snappedX = getXForPrice(boundedPrice);
        currentX.current = snappedX;
        
        Animated.spring(sliderX, {
          toValue: snappedX,
          useNativeDriver: false,
          friction: 8
        }).start();
      },
    })
  ).current;

  const isFormValid = items.some(i => i.trim().length > 0) && location.length > 0 && deliveryLocation.length > 0;
  const totalPrice = price + (urgency === 'flash' ? incentive : 0);

  const handleBroadcast = async () => {
    if (!isFormValid || isBroadcasting) return;

    setIsBroadcasting(true);
    try {
      const payload = {
        category,
        items: items.filter(i => i.trim().length > 0),
        item_description: items.filter(i => i.trim().length > 0).join(', '),
        pickup: {
          address: location,
          lat: pickupCoords?.lat ?? 0,
          lng: pickupCoords?.lng ?? 0,
        },
        dropoff: {
          address: deliveryLocation,
          lat: dropoffCoords?.lat ?? 0,
          lng: dropoffCoords?.lng ?? 0,
        },
        urgency,
        base_fee: price,
        flash_incentive: urgency === 'flash' ? incentive : 0,
        total_price: totalPrice,
        target_runner_id: runnerId,
        budget_min: budgetMin ? parseFloat(budgetMin) : null,
        budget_max: budgetMax ? parseFloat(budgetMax) : null,
        payment_method: paymentMethod,
        is_shared: isShared,
        max_spots: isShared ? maxSpots : 1,
        drop_type: dropType,
      };

      const endpoint = frequency === 'once' ? API.WAKA.CREATE : `${API.API_URL}/scheduling/`;
      const finalPayload = frequency === 'once' ? payload : {
        title: `Recurring ${category} errand`,
        frequency,
        waka_template: payload,
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        is_active: true
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(finalPayload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const waka = await res.json();
      if (frequency === 'once') {
        showAlert(isShared ? 'Group Started! 🤝' : 'Waka Sent! 🎉', 
          isShared ? 'Your shared errand is now discoverable by others.' : 'Runners nearby are being pinged right now.', [
          { text: 'AWESOME', onPress: () => router.replace(`/waka/${waka.id}` as any) }
        ]);
      } else {
        showAlert('Schedule Set! 🗓️', `Your ${frequency} errand has been scheduled.`, [
          { text: 'AWESOME', onPress: () => router.replace('/(tabs)/profile' as any) }
        ]);
      }
    } catch (e: any) {
      showAlert('Broadcast Failed', e.message || 'Something went wrong. Please try again.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleLocateMe = async (type: 'pickup' | 'delivery') => {
    const isPickup = type === 'pickup';
    const setLoading = isPickup ? setIsFetchingPickup : setIsFetchingDelivery;
    const setValue = isPickup ? setLocation : setDeliveryLocation;
    const setCoords = isPickup ? setPickupCoords : setDropoffCoords;

    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Please enable location permissions in your settings.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const { latitude, longitude } = loc.coords;
      setCoords({ lat: latitude, lng: longitude });

      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const streetInfo = [place.streetNumber, place.street].filter(Boolean).join(' ');
        const parts = [
          streetInfo || place.name,
          place.district,
          place.city,
          place.region
        ].filter(Boolean);

        const uniqueParts = parts.filter((item, index) => parts.indexOf(item) === index);
        setValue(uniqueParts.join(', ') || 'Unknown Location');
      }
    } catch (error) {
      showAlert('Error', 'Could not determine your location.');
    } finally {
      setLoading(false);
    }
  };

  const fillWidth = sliderX.interpolate({
    inputRange: [0, SLIDER_WIDTH],
    outputRange: [0, SLIDER_WIDTH],
    extrapolate: 'clamp',
  });

  const thumbLeft = sliderX.interpolate({
    inputRange: [0, SLIDER_WIDTH],
    outputRange: [0, SLIDER_WIDTH],
    extrapolate: 'clamp',
  });

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.text} strokeWidth={3} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Errand</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={scrollEnabled}
      >
        {/* Hiring Context Banner */}
        {runnerName && (
          <View style={styles.hiringBanner}>
            <View style={styles.hiringAvatar}>
              <UserIcon size={18} color={colors.surface} />
            </View>
            <View style={styles.hiringTextWrap}>
              <Text style={styles.hiringLabel}>HIRING SPECIFIC RUNNER</Text>
              <Text style={styles.hiringName}>{runnerName}</Text>
            </View>
          </View>
        )}

        {/* Recurring / Scheduling Section */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Frequency</Text>
          <View style={styles.frequencyRow}>
            {[
              { id: 'once', label: 'Once', icon: Calendar },
              { id: 'daily', label: 'Daily', icon: Repeat },
              { id: 'weekly', label: 'Weekly', icon: Repeat },
              { id: 'monthly', label: 'Monthly', icon: Repeat },
            ].map((freq) => {
              const active = frequency === freq.id;
              const Icon = freq.icon;
              return (
                <TouchableOpacity
                  key={freq.id}
                  style={[styles.freqChip, active && styles.freqChipActive]}
                  onPress={() => setFrequency(freq.id as any)}
                >
                  <Icon size={14} color={active ? colors.surface : colors.text} />
                  <Text style={[styles.freqText, active && styles.freqTextActive]}>{freq.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {frequency !== 'once' && (
            <Text style={styles.fieldHint}>This errand will be automatically re-created {frequency}.</Text>
          )}
        </View>

        {/* Waka-Share Toggle */}
        <View style={styles.field}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Initiate Waka-Share?</Text>
              <Text style={styles.fieldHint}>Allow others in your area to join and split the ₦{price.toLocaleString()} fee.</Text>
            </View>
            <TouchableOpacity 
              style={[styles.brutalToggle, isShared && styles.brutalToggleActive]}
              onPress={() => setIsShared(!isShared)}
            >
              <View style={[styles.toggleThumb, isShared && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
          
          {isShared && (
            <View style={styles.spotsContainer}>
              <Text style={styles.fieldLabel}>Max Participants</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => setMaxSpots(Math.max(2, maxSpots - 1))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepVal}>{maxSpots}</Text>
                <TouchableOpacity onPress={() => setMaxSpots(Math.min(5, maxSpots + 1))} style={styles.stepBtn}>
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Errand Type</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              const Icon = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Icon size={16} color={active ? colors.surface : colors.text} strokeWidth={2.5} />
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Item Box & Bullet Points */}
        <View style={styles.field}>
          <View style={styles.itemBoxHeader}>
            <Text style={styles.fieldLabel}>What should they carry?</Text>
            <TouchableOpacity 
              style={styles.addBtn}
              onPress={() => setItems([...items, ''])}
            >
              <Text style={styles.addBtnText}>+ ADD ITEM</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.itemBox}>
            {items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.bulletDot} />
                <TextInput
                  style={styles.itemInput}
                  placeholder="e.g. 5kg Basmati Rice"
                  placeholderTextColor={colors.muted}
                  value={item}
                  onChangeText={(text) => {
                    const newItems = [...items];
                    newItems[idx] = text;
                    setItems(newItems);
                  }}
                />
                {items.length > 1 && (
                  <TouchableOpacity 
                    style={styles.removeBtn}
                    onPress={() => {
                      const newItems = items.filter((_, i) => i !== idx);
                      setItems(newItems);
                    }}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          <Text style={styles.fieldHint}>List specific items for the runner to procure.</Text>
        </View>

        {/* Location Boxes */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Pickup Location</Text>
          <AddressSelector 
            type="pickup"
            selectedId={selectedPickupId}
            onSelect={(addr) => {
              setLocation(addr.address);
              setPickupCoords({ lat: addr.lat, lng: addr.lng });
              setSelectedPickupId(addr.id);
            }}
          />
          <View style={styles.locationInput}>
            <TextInput
              style={styles.locationTextInput}
              placeholder="e.g. Mile 12 Market, Lagos"
              placeholderTextColor={colors.muted}
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity
              style={styles.locationIcon}
              onPress={() => handleLocateMe('pickup')}
              disabled={isFetchingPickup}
              activeOpacity={0.8}
            >
              {isFetchingPickup ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <MapPin size={20} color={colors.surface} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Dropoff Address</Text>
          <AddressSelector 
            type="dropoff"
            selectedId={selectedDropoffId}
            onSelect={(addr) => {
              setDeliveryLocation(addr.address);
              setDropoffCoords({ lat: addr.lat, lng: addr.lng });
              setSelectedDropoffId(addr.id);
            }}
          />
          <View style={styles.locationInput}>
            <TextInput
              style={styles.locationTextInput}
              placeholder="e.g. 15 Ajose Adeogun St, VI"
              placeholderTextColor={colors.muted}
              value={deliveryLocation}
              onChangeText={setDeliveryLocation}
            />
            <TouchableOpacity
              style={[styles.locationIcon, { backgroundColor: colors.secondary }]}
              onPress={() => handleLocateMe('delivery')}
              disabled={isFetchingDelivery}
              activeOpacity={0.8}
            >
              {isFetchingDelivery ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <MapPin size={20} color={colors.surface} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.freqChip, dropType === 'doorstep' && styles.freqChipActive]}
              onPress={() => setDropType('doorstep')}
            >
              <Text style={[styles.freqText, dropType === 'doorstep' && styles.freqTextActive]}>Hand to Me</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.freqChip, dropType === 'locker' && styles.freqChipActive]}
              onPress={() => setDropType('locker')}
            >
              <Text style={[styles.freqText, dropType === 'locker' && styles.freqTextActive]}>Safe Drop (Locker/PIN)</Text>
            </TouchableOpacity>
          </View>
          {dropType === 'locker' && (
            <Text style={[styles.fieldHint, { marginTop: 4, color: colors.secondary }]}>
              A 6-digit PIN will be generated for the runner to deposit or deliver contactlessly.
            </Text>
          )}
        </View>

        {/* Budget Range for Errands */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Shopping Budget Range (Optional)</Text>
          <View style={styles.budgetRangeRow}>
            <View style={styles.budgetInputWrap}>
              <Text style={styles.budgetPre}>₦</Text>
              <TextInput
                style={styles.budgetTextInput}
                placeholder="Min"
                keyboardType="numeric"
                value={budgetMin}
                onChangeText={setBudgetMin}
              />
            </View>
            <View style={styles.budgetGap} />
            <View style={styles.budgetInputWrap}>
              <Text style={styles.budgetPre}>₦</Text>
              <TextInput
                style={styles.budgetTextInput}
                placeholder="Max"
                keyboardType="numeric"
                value={budgetMax}
                onChangeText={setBudgetMax}
              />
            </View>
          </View>
          <Text style={styles.fieldHint}>Estimated cost for the items only.</Text>
        </View>

        {/* Urgency Toggles */}
        <View style={[styles.field, urgency === 'flash' && { marginBottom: 12 }]}>
          <Text style={styles.fieldLabel}>Delivery Speed</Text>
          <View style={styles.urgencyRow}>
            <TouchableOpacity 
              style={[styles.urgencyBox, urgency === 'standard' && styles.urgencyBoxActive]}
              onPress={() => handleUrgencyToggle('standard')}
            >
              <Clock size={20} color={urgency === 'standard' ? colors.surface : colors.text} strokeWidth={2} />
              <View style={styles.urgencyTextWrap}>
                <Text style={[styles.urgencyTitle, urgency === 'standard' && { color: colors.surface }]}>Standard</Text>
                <Text style={[styles.urgencySub, urgency === 'standard' && { color: 'rgba(255,255,255,0.7)' }]}>Whenever</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.urgencyBox, urgency === 'flash' && styles.urgencyBoxFlashActive]}
              onPress={() => handleUrgencyToggle('flash')}
            >
              <Zap size={20} color={colors.text} fill={colors.text} strokeWidth={2} />
              <View style={styles.urgencyTextWrap}>
                <Text style={[styles.urgencyTitle, { color: colors.text }]}>Flash Mode</Text>
                <Text style={[styles.urgencySub, { color: 'rgba(0,0,0,0.6)' }]}>Right now!</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Payment Method Toggle */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Payment Method</Text>
          <View style={styles.urgencyRow}>
            <TouchableOpacity 
              style={[styles.urgencyBox, paymentMethod === 'wallet' && styles.urgencyBoxActive]}
              onPress={() => setPaymentMethod('wallet')}
            >
              <Package size={20} color={paymentMethod === 'wallet' ? colors.surface : colors.text} strokeWidth={2} />
              <View style={styles.urgencyTextWrap}>
                <Text style={[styles.urgencyTitle, paymentMethod === 'wallet' && { color: colors.surface }]}>Secure Wallet</Text>
                <Text style={[styles.urgencySub, paymentMethod === 'wallet' && { color: 'rgba(255,255,255,0.7)' }]}>Automated & Safe</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.urgencyBox, paymentMethod === 'cash' && { backgroundColor: '#F0F0F0', borderColor: colors.text }]}
              onPress={() => setPaymentMethod('cash')}
            >
              <UserIcon size={20} color={colors.text} strokeWidth={2} />
              <View style={styles.urgencyTextWrap}>
                <Text style={[styles.urgencyTitle, { color: colors.text }]}>Cash / POD</Text>
                <Text style={[styles.urgencySub, { color: 'rgba(0,0,0,0.6)' }]}>Pay on Delivery</Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.fieldHint}>
            {paymentMethod === 'wallet' 
              ? "Funds are automatically transferred upon your approval." 
              : "You'll pay the runner directly via cash or bank transfer."}
          </Text>
        </View>

        {urgency === 'flash' && (
          <View style={styles.incentiveWrapper}>
            <Text style={styles.incentiveTextLabel}>Extra Flash Incentive</Text>
            <View style={styles.incentiveOptions}>
              {[1000, 2000, 'custom'].map((val) => {
                const isCustomOption = val === 'custom';
                const isActive = isCustomOption ? isCustomIncentive : (!isCustomIncentive && incentive === val);

                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.incentiveChip, isActive && styles.incentiveChipActive]}
                    onPress={() => {
                      if (isCustomOption) {
                        setIsCustomIncentive(true);
                        setIncentive(0);
                      } else {
                        setIsCustomIncentive(false);
                        setIncentive(val as number);
                      }
                    }}
                  >
                    <Text style={[styles.incentiveText, isActive && styles.incentiveTextActive]}>
                      {isCustomOption ? 'Custom' : `+₦${val}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {isCustomIncentive && (
              <TextInput
                style={styles.customIncentiveInput}
                keyboardType="numeric"
                placeholder="Enter custom tip amount (e.g. 1500)"
                placeholderTextColor={colors.muted}
                value={incentive > 0 ? incentive.toString() : ''}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, '');
                  const parsed = parseInt(numericText, 10);
                  setIncentive(isNaN(parsed) ? 0 : parsed);
                }}
              />
            )}
          </View>
        )}

        {/* Tactile Price Slider */}
        <View style={styles.field}>
          <View style={styles.sliderHeader}>
            <Text style={styles.fieldLabel}>Runner's Fee</Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>
                ₦{price.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              {/* Tick Marks */}
              {SLIDER_TICKS.map((tick) => {
                const tickX = getXForPrice(tick);
                const isActive = price >= tick;
                return (
                  <View 
                    key={tick} 
                    style={[
                      styles.sliderTick, 
                      { left: tickX, backgroundColor: isActive ? colors.primary : colors.text, opacity: isActive ? 1 : 0.3 }
                    ]} 
                  />
                );
              })}
              
              {/* Fill */}
              <Animated.View style={[styles.sliderFill, { width: fillWidth }]} />
            </View>
            
            {/* Thumb */}
            <Animated.View
              style={[
                styles.thumbWrapper, 
                { left: thumbLeft },
                urgency === 'flash' && { transform: [{ scale: 1.1 }] }
              ]}
              {...panResponder.panHandlers}
            >
              <View style={styles.thumb}>
                <View style={[styles.thumbInner, urgency === 'flash' && { backgroundColor: colors.accent }]} />
              </View>
            </Animated.View>
          </View>

          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>₦3,000</Text>
            <Text style={styles.sliderLabelText}>₦30,000</Text>
          </View>
        </View>

      </ScrollView>

      {/* Sticky Brutalist Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.broadcastBtn, (!isFormValid || isBroadcasting) && styles.broadcastDashed]}
          onPress={handleBroadcast}
          disabled={!isFormValid || isBroadcasting}
        >
          {isBroadcasting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={[styles.broadcastText, !isFormValid && styles.broadcastTextDisabled]}>
              {isFormValid 
                ? (runnerName ? `HIRE ${runnerName.toUpperCase()} — ₦${totalPrice.toLocaleString()}` : `BROADCAST — ₦${totalPrice.toLocaleString()}`)
                : 'FILL DETAILS TO BROADCAST'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <BrutalistAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 3,
    borderBottomColor: colors.text,
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
  headerTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 22,
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: DT.spacing.lg,
    paddingTop: DT.spacing.lg,
    paddingBottom: 140, // Space for massive footer
  },
  field: {
    marginBottom: DT.spacing.xl,
  },
  fieldLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  fieldHint: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  budgetRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    height: 52,
  },
  budgetPre: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.muted,
    marginRight: 4,
  },
  budgetTextInput: {
    flex: 1,
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.text,
  },
  budgetGap: {
    width: 12,
    height: 2,
    backgroundColor: colors.text,
    marginHorizontal: 12,
  },
  
  // Categories
  hiringBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text,
    padding: 12,
    borderWidth: 3,
    borderColor: colors.text,
    marginBottom: DT.spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  hiringAvatar: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hiringTextWrap: {
    flex: 1,
  },
  hiringLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  hiringName: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.surface,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  freqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
  },
  freqChipActive: {
    backgroundColor: colors.text,
  },
  freqText: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: colors.text,
  },
  freqTextActive: {
    color: colors.surface,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brutalToggle: {
    width: 60,
    height: 32,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    padding: 3,
  },
  brutalToggleActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: colors.text,
  },
  toggleThumbActive: {
    backgroundColor: colors.surface,
    transform: [{ translateX: 28 }],
  },
  spotsContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 2,
    borderColor: colors.text,
    borderStyle: 'dashed',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
  },
  stepVal: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  categoryText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 13,
    color: colors.text,
  },
  categoryTextActive: {
    color: colors.surface,
  },

  // Urgency Boxes
  urgencyRow: {
    flexDirection: 'row',
    gap: DT.spacing.sm,
  },
  urgencyBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
  },
  urgencyBoxActive: {
    backgroundColor: colors.text,
  },
  urgencyBoxFlashActive: {
    backgroundColor: colors.accent,
    borderWidth: 3,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  urgencyTextWrap: {
    flex: 1,
  },
  urgencyTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.text,
  },
  urgencySub: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 11,
    color: colors.muted,
  },

  incentiveWrapper: {
    marginBottom: DT.spacing.xl,
    padding: DT.spacing.md,
    backgroundColor: '#FFF8EF',
    borderWidth: 2,
    borderColor: colors.text,
    borderStyle: 'dashed',
  },
  incentiveTextLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  incentiveOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  incentiveChip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incentiveChipActive: {
    backgroundColor: colors.accent,
  },
  incentiveText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.text,
  },
  incentiveTextActive: {
    color: colors.text,
  },
  customIncentiveInput: {
    height: 48,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: DT.spacing.md,
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.text,
    marginTop: DT.spacing.md,
  },

  itemBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: colors.text,
  },
  addBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 10,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  itemBox: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.text,
    padding: DT.spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.text,
    borderRadius: 0,
  },
  itemInput: {
    flex: 1,
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 4,
  },
  removeBtn: {
    padding: 6,
  },
  removeBtnText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.muted,
  },

  textArea: {
    height: 100,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    padding: DT.spacing.md,
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
    borderRadius: 0,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  locationInput: {
    height: 52,
    flexDirection: 'row',
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  locationTextInput: {
    flex: 1,
    paddingHorizontal: DT.spacing.md,
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 15,
    color: colors.text,
  },
  locationIcon: {
    width: 52,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 3,
    borderLeftColor: colors.text,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceTag: {
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  priceTagText: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.text,
  },
  sliderContainer: {
    height: 44,
    marginTop: DT.spacing.sm,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 12,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.text,
    overflow: 'visible',
    position: 'relative',
  },
  sliderTick: {
    position: 'absolute',
    top: -3, // overlaps borders
    width: 4,
    height: 18,
    zIndex: 2,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
    zIndex: 1,
  },
  thumbWrapper: {
    position: 'absolute',
    top: -10,
    marginLeft: -16,
    zIndex: 10,
  },
  thumb: {
    width: 32,
    height: 32,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  thumbInner: {
    width: 14,
    height: 14,
    backgroundColor: colors.text, // changes to accent on flash mode
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DT.spacing.sm,
  },
  sliderLabelText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 12,
    color: colors.muted,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: DT.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : DT.spacing.lg,
    paddingTop: DT.spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 3,
    borderTopColor: colors.text,
  },
  broadcastBtn: {
    height: 64,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  broadcastDashed: {
    backgroundColor: colors.background,
    borderStyle: 'dashed',
    borderWidth: 3,
    borderColor: colors.muted,
    shadowOpacity: 0,
    elevation: 0,
  },
  broadcastText: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  broadcastTextDisabled: {
    color: colors.muted,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,15,15,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: {
    width: width - 64,
    backgroundColor: colors.background,
    borderWidth: 3,
    borderColor: colors.text,
    padding: DT.spacing.xl,
    alignItems: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: DT.spacing.md,
  },
  successTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 28,
    color: colors.text,
    marginBottom: DT.spacing.sm,
  },
  successBody: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: DT.spacing.lg,
  },
  successProgress: {
    width: '100%',
    height: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
  },
});
