import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  PanResponder,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, CheckCircle } from 'lucide-react-native';
import { DesignTokens as DT } from '../constants/design';
import { useTheme } from '../hooks/use-theme';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - DT.spacing.lg * 2 - 4; // subtract padding
const MIN_PRICE = 1000;
const MAX_PRICE = 10000;

export default function NewErrandScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState(2500);
  const [showSuccess, setShowSuccess] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const sliderX = useRef(
    new Animated.Value(((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * SLIDER_WIDTH)
  ).current;
  const currentX = useRef(((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * SLIDER_WIDTH);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setScrollEnabled(false);
        sliderX.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        let newX = currentX.current + gestureState.dx;
        newX = Math.max(0, Math.min(SLIDER_WIDTH, newX));
        sliderX.setValue(newX - currentX.current);
        const newPrice = Math.round(
          MIN_PRICE + ((newX) / SLIDER_WIDTH) * (MAX_PRICE - MIN_PRICE)
        );
        setPrice(Math.max(MIN_PRICE, Math.min(MAX_PRICE, newPrice)));
      },
      onPanResponderRelease: (_, gestureState) => {
        setScrollEnabled(true);
        sliderX.flattenOffset();
        let newX = currentX.current + gestureState.dx;
        newX = Math.max(0, Math.min(SLIDER_WIDTH, newX));
        currentX.current = newX;
        sliderX.setValue(newX);
      },
    })
  ).current;

  const handleBroadcast = () => {
    if (!items || !location) return;
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      router.replace('/(tabs)');
    }, 2000);
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
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Someone</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={scrollEnabled}
      >
        {/* Item Description */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>What should they get?</Text>
          <Text style={styles.fieldHint}>
            Be specific — mention market stall, colour, size, price limit.
          </Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={5}
            placeholder="E.g. 2 baskets of fresh pepper from Mama Ngozi's stall, Middle row at Mile 12..."
            placeholderTextColor={colors.muted}
            value={items}
            onChangeText={setItems}
            textAlignVertical="top"
          />
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Market / Pickup Location</Text>
          <View style={styles.locationInput}>
            <TextInput
              style={styles.locationTextInput}
              placeholder="e.g. Mile 12 Market, Lagos"
              placeholderTextColor={colors.muted}
              value={location}
              onChangeText={setLocation}
            />
            <View style={styles.locationIcon}>
              <MapPin size={20} color={colors.surface} strokeWidth={2.5} />
            </View>
          </View>
        </View>

        {/* Delivery Location */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Your Delivery Address</Text>
          <View style={styles.locationInput}>
            <TextInput
              style={styles.locationTextInput}
              placeholder="e.g. 15 Ajose Adeogun St, VI"
              placeholderTextColor={colors.muted}
            />
            <View style={[styles.locationIcon, { backgroundColor: colors.secondary }]}>
              <MapPin size={20} color={colors.surface} strokeWidth={2.5} />
            </View>
          </View>
        </View>

        {/* Price Slider */}
        <View style={styles.field}>
          <View style={styles.sliderHeader}>
            <Text style={styles.fieldLabel}>Runner's Fee</Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>
                ₦{price.toLocaleString()}
              </Text>
            </View>
          </View>
          <Text style={styles.fieldHint}>Drag to set how much you'll pay the runner.</Text>

          {/* Custom Slider */}
          <View style={styles.sliderContainer}>
            {/* Track */}
            <View style={styles.sliderTrack}>
              {/* Fill */}
              <Animated.View style={[styles.sliderFill, { width: fillWidth }]} />
            </View>
            {/* Thumb */}
            <Animated.View
              style={[styles.thumbWrapper, { left: thumbLeft }]}
              {...panResponder.panHandlers}
            >
              <View style={styles.thumb} />
            </Animated.View>
          </View>

          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>₦1,000</Text>
            <Text style={styles.sliderLabelText}>₦10,000</Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>⚡ How it works</Text>
          <Text style={styles.infoText}>
            1. Your waka is broadcast to nearby runners.{'\n'}
            2. A runner accepts and heads to the market.{'\n'}
            3. You confirm delivery to release payment.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.broadcastBtn,
            (!items || !location) && styles.broadcastDisabled,
          ]}
          onPress={handleBroadcast}
          disabled={!items || !location}
        >
          <Text style={styles.broadcastText}>
            Broadcast Waka — ₦{price.toLocaleString()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Waka Broadcast!</Text>
            <Text style={styles.successBody}>
              Runners nearby are being notified. Sit tight!
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
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
    backgroundColor: colors.background,
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
  },
  scrollContent: {
    paddingHorizontal: DT.spacing.lg,
    paddingTop: DT.spacing.lg,
    paddingBottom: 120,
  },
  field: {
    marginBottom: DT.spacing.lg,
  },
  fieldLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  fieldHint: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.muted,
    marginBottom: 8,
    lineHeight: 18,
  },
  textArea: {
    height: 120,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    padding: DT.spacing.md,
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
    borderRadius: 0,
  },
  locationInput: {
    height: 48,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  locationTextInput: {
    flex: 1,
    paddingHorizontal: DT.spacing.md,
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.text,
  },
  locationIcon: {
    width: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 2,
    borderLeftColor: colors.text,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceTag: {
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
    paddingHorizontal: 10,
    paddingVertical: 2,
    shadowColor: colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  priceTagText: {
    fontFamily: DT.typography.heading,
    fontSize: 16,
    color: colors.text,
  },
  sliderContainer: {
    height: 40,
    marginTop: DT.spacing.md,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 8,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    overflow: 'visible',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  thumbWrapper: {
    position: 'absolute',
    top: -8,
    marginLeft: -14,
  },
  thumb: {
    width: 28,
    height: 28,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DT.spacing.sm,
  },
  sliderLabelText: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.muted,
  },
  infoBox: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.text,
    padding: DT.spacing.md,
    marginBottom: DT.spacing.lg,
  },
  infoTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 15,
    color: colors.text,
    marginBottom: 6,
  },
  infoText: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: DT.spacing.lg,
    paddingBottom: DT.spacing.lg,
    paddingTop: DT.spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.text,
    backgroundColor: colors.background,
  },
  broadcastBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  broadcastDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  broadcastText: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.surface,
    letterSpacing: 0.3,
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
    fontSize: 60,
    marginBottom: DT.spacing.md,
  },
  successTitle: {
    fontFamily: DT.typography.heading,
    fontSize: 28,
    color: colors.text,
    marginBottom: DT.spacing.sm,
  },
  successBody: {
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: DT.spacing.lg,
  },
  successProgress: {
    width: '100%',
    height: 6,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.text,
  },
});
