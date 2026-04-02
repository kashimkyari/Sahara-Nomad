import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Package, ShoppingCart, Utensils, Zap, Clock } from 'lucide-react-native';
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
  
  const [category, setCategory] = useState('package');
  const [urgency, setUrgency] = useState('standard'); // 'standard' | 'flash'
  const [items, setItems] = useState('');
  const [location, setLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');

  // GPS coordinates stored alongside the address strings
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const [isFetchingPickup, setIsFetchingPickup] = useState(false);
  const [isFetchingDelivery, setIsFetchingDelivery] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  const [price, setPrice] = useState(5000);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

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

  const isFormValid = items.length > 0 && location.length > 0 && deliveryLocation.length > 0;
  const totalPrice = price + (urgency === 'flash' ? incentive : 0);

  const handleBroadcast = async () => {
    if (!isFormValid || isBroadcasting) return;

    setIsBroadcasting(true);
    try {
      const payload = {
        category,
        item_description: items,
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
      };

      const res = await fetch(API.WAKA.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const waka = await res.json();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.replace(`/waka/${waka.id}` as any);
      }, 2000);
    } catch (e: any) {
      Alert.alert('Broadcast Failed', e.message || 'Something went wrong. Please try again.');
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
        Alert.alert('Permission Denied', 'Please enable location permissions in your settings.');
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
      Alert.alert('Error', 'Could not determine your location.');
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
        {/* Category Pills */}
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

        {/* Item Description */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>What should they carry?</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Describe the item, reference sizes, constraints, etc."
            placeholderTextColor={colors.muted}
            value={items}
            onChangeText={setItems}
            textAlignVertical="top"
          />
        </View>

        {/* Location Boxes */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Pickup Location</Text>
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
              {isFormValid ? `BROADCAST — ₦${totalPrice.toLocaleString()}` : 'FILL DETAILS TO BROADCAST'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Waka Sent!</Text>
            <Text style={styles.successBody}>
              Runners nearby are being pinged right now. Get ready!
            </Text>
            <View style={styles.successProgress} />
          </View>
        </View>
      </Modal>
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
  
  // Categories
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
