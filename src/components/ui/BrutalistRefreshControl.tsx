/**
 * BrutalistRefreshControl
 *
 * A drop-in replacement for React Native's RefreshControl.
 * Hides the native OS spinner and renders a custom Neo-Brutalist
 * pull-to-refresh indicator matching the app's design language
 * (hard shadows, sharp borders, uppercase heading font — see CustomTabBar.tsx).
 *
 * How it works:
 *   This component renders two things:
 *   1. A transparent native <RefreshControl> that handles the pull gesture & triggers onRefresh.
 *   2. An <Animated.View> banner that you position absolutely above the ScrollView using the
 *      exported `useBrutalistRefresh` hook, which drives the animation from the scroll offset.
 *
 * Simplest usage (pass to any ScrollView's refreshControl prop):
 *
 *   const { refreshControl, refreshBanner } = useBrutalistRefresh({ onRefresh });
 *
 *   return (
 *     <View style={{ flex: 1 }}>
 *       {refreshBanner}
 *       <ScrollView refreshControl={refreshControl}>
 *         ...
 *       </ScrollView>
 *     </View>
 *   );
 */
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  RefreshControlProps,
  Animated,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { DesignTokens as DT } from '../../constants/design';

interface UseBrutalistRefreshOptions {
  /** Async function that performs the refresh. The hook handles the loading state. */
  onRefresh: () => Promise<void>;
  /** Label shown while actively refreshing. Defaults to 'REFRESHING...' */
  refreshingLabel?: string;
  /** Label shown when being pulled. Defaults to 'PULL TO REFRESH'. */
  pullLabel?: string;
}

interface BrutalistRefreshReturn {
  /** Pass this as `refreshControl` on any ScrollView / FlatList / SectionList */
  refreshControl: React.ReactElement<RefreshControlProps>;
  /** Render this as a sibling above your ScrollView (position: absolute overlay) */
  refreshBanner: React.ReactElement;
  /** Animated.Value tracking scroll offset — pass to your ScrollView's onScroll if needed */
  scrollY: Animated.Value;
  /** Whether a refresh is currently in progress */
  refreshing: boolean;
}

export function useBrutalistRefresh({
  onRefresh,
  refreshingLabel = 'REFRESHING...',
  pullLabel = 'PULL TO REFRESH',
}: UseBrutalistRefreshOptions): BrutalistRefreshReturn {
  const { colors } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const delay = new Promise(res => setTimeout(res, 2000));
      await Promise.all([onRefresh(), delay]);
    } catch (e) {
      console.warn('[BrutalistRefreshControl] onRefresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  // Hidden above viewport at rest; slides down as the user pulls (scrollY goes negative)
  const translateY = scrollY.interpolate({
    inputRange: [-80, 0],
    outputRange: [0, -80],
    extrapolate: 'clamp',
  });

  // Grows from small to full size as pull deepens
  const scale = scrollY.interpolate({
    inputRange: [-80, -10, 0],
    outputRange: [1, 0.4, 0.4],
    extrapolate: 'clamp',
  });

  const bgColor = refreshing ? colors.primary : colors.accent;
  const textColor = refreshing ? colors.surface : colors.text;

  const refreshBanner = (
    <View style={styles.bannerSlot} pointerEvents="none">
      <Animated.View
        style={[
          styles.banner,
          {
            backgroundColor: bgColor,
            borderColor: colors.text,
            shadowColor: colors.text,
            transform: [
              { translateY: refreshing ? 0 : translateY },
              { scale: refreshing ? 1 : scale },
            ],
          },
        ]}
      >
        <Text style={[styles.bannerText, { color: textColor }]}>
          {refreshing ? refreshingLabel : pullLabel}
        </Text>
      </Animated.View>
    </View>
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      // Hide the native OS indicator — our banner replaces it
      tintColor="transparent"
      colors={['transparent']}
      progressBackgroundColor="transparent"
    />
  );

  return { refreshControl, refreshBanner, scrollY, refreshing };
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
    // Brutalist hard shadow — identical to CustomTabBar
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
