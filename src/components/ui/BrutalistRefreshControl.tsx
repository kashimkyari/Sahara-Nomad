import * as Haptics from 'expo-haptics';
import { MotiText, MotiView } from 'moti';
import React, { useCallback, useRef, useState } from 'react';
import {
  Platform,
  RefreshControl,
  RefreshControlProps,
  StyleSheet,
  View,
} from 'react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

const PULL_THRESHOLD = 80;
const HAPTIC_THRESHOLD = 55;

interface UseBrutalistRefreshOptions {
  onRefresh: () => Promise<void>;
  refreshingLabel?: string;
  pullLabel?: string;
}

interface BrutalistRefreshReturn {
  refreshControl: React.ReactElement<RefreshControlProps>;
  refreshBanner: React.ReactElement;
  refreshing: boolean;
  onScroll: (e: any) => void;
}

export function useBrutalistRefresh({
  onRefresh,
  refreshingLabel = 'REFRESHING...',
  pullLabel = 'PULL TO REFRESH',
}: UseBrutalistRefreshOptions): BrutalistRefreshReturn {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [pullDepth, setPullDepth] = useState(0); // 0–1 normalised pull progress
  const [pastThreshold, setPastThreshold] = useState(false);
  const hapticFired = useRef(false);

  const onScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      if (refreshing) return;
      const y = e.nativeEvent.contentOffset.y;
      const pull = Math.max(0, -y);
      const depth = Math.min(pull / PULL_THRESHOLD, 1);
      setPullDepth(depth);

      const crossed = pull >= HAPTIC_THRESHOLD;
      if (crossed && !hapticFired.current) {
        hapticFired.current = true;
        setPastThreshold(true);
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (!crossed) {
        hapticFired.current = false;
        setPastThreshold(false);
      }
    },
    [refreshing]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPullDepth(1);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await Promise.all([onRefresh(), new Promise(r => setTimeout(r, 2000))]);
    } catch (e) {
      console.warn('[BrutalistRefreshControl] onRefresh error:', e);
    } finally {
      setRefreshing(false);
      setPullDepth(0);
      setPastThreshold(false);
    }
  }, [onRefresh]);

  const translateY = refreshing ? 0 : -(80 * (1 - pullDepth));
  const scale = refreshing ? 1 : 0.4 + 0.65 * pullDepth + (pastThreshold ? 0.05 : 0);
  const rotateDeg = refreshing ? '0deg' : `${-3 + 3 * pullDepth}deg`;
  const bgColor = refreshing ? colors.primary : colors.accent;
  const textColor = refreshing ? colors.surface : colors.text;

  const spring = { type: 'spring', stiffness: 280, damping: 22 } as const;

  const refreshBanner = (
    <View style={styles.bannerSlot} pointerEvents="none">
      <MotiView
        animate={{
          translateY,
          scale,
          rotateZ: rotateDeg,
          backgroundColor: bgColor,
          borderColor: colors.text,
        }}
        transition={{
          translateY: refreshing ? spring : { type: 'timing', duration: 0 },
          scale: refreshing ? spring : { type: 'timing', duration: 0 },
          rotateZ: refreshing ? spring : { type: 'timing', duration: 0 },
          backgroundColor: { type: 'timing', duration: 200 },
        }}
        style={[styles.banner, { shadowColor: colors.text }]}
      >
        <MotiView
          animate={{ opacity: refreshing ? 0.55 : 1 }}
          transition={
            refreshing
              ? { type: 'timing', duration: 600, loop: true, repeatReverse: true }
              : { type: 'timing', duration: 150 }
          }
        >
          <MotiText
            style={[styles.bannerText, { color: textColor }]}
          >
            {refreshing ? refreshingLabel : pullLabel}
          </MotiText>
        </MotiView>
      </MotiView>
    </View>
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor="transparent"
      colors={['transparent']}
    />
  );

  return { refreshControl, refreshBanner, refreshing, onScroll };
}

const styles = StyleSheet.create({
  bannerSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  banner: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 3,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  bannerText: {
    fontFamily: DT.typography.heading,
    fontSize: 13,
    letterSpacing: 2,
  },
});