import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import React, { useCallback, useState, useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';

const BRUTAL_SPRING = { type: 'spring', stiffness: 600, damping: 18, mass: 0.6 } as const;
const SETTLE_SPRING = { type: 'spring', stiffness: 280, damping: 26 } as const;
const COLOR_TIMING = { type: 'timing', duration: 120 } as const;

// Per-tab press state for press-down squish
function useTabPressState() {
  const [pressed, setPressed] = useState(false);
  const onPressIn = useCallback(() => setPressed(true), []);
  const onPressOut = useCallback(() => setPressed(false), []);
  return { pressed, onPressIn, onPressOut };
}

interface TabItemProps {
  route: any;
  index: number;
  isFocused: boolean;
  isLast: boolean;
  options: any;
  colors: any;
  onPress: () => void;
  onLongPress: () => void;
}

function TabItem({ route, index, isFocused, isLast, options, colors, onPress, onLongPress }: TabItemProps) {
  const { pressed, onPressIn, onPressOut } = useTabPressState();
  const label =
    options.tabBarLabel !== undefined ? options.tabBarLabel
      : options.title !== undefined ? options.title
        : route.name;

  let iconName: any = 'home-outline';
  if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
  else if (route.name === 'search') iconName = isFocused ? 'search' : 'search-outline';
  else if (route.name === 'messages') iconName = isFocused ? 'chatbubble' : 'chatbubble-outline';
  else if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';

  const activeBg = isFocused ? colors.primary : colors.surface;
  const contentColor = isFocused ? colors.surface : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.tabItem,
        {
          borderRightWidth: isLast ? 0 : 2,
          borderRightColor: colors.border,
          paddingVertical: 10,
          overflow: 'hidden',
        },
      ]}
    >
      {/* ① Animated fill background */}
      <MotiView
        animate={{ backgroundColor: activeBg }}
        transition={COLOR_TIMING}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ② Press-down overlay flash — brutalist "stamp" effect */}
      <MotiView
        animate={{ opacity: pressed ? 0.18 : 0 }}
        transition={{ type: 'timing', duration: pressed ? 0 : 300 }}
        style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.text }]}
      />

      {/* ③ Whole-item squish on press */}
      <MotiView
        animate={{
          scaleX: pressed ? 0.92 : 1,
          scaleY: pressed ? 0.88 : 1,
        }}
        transition={pressed ? { type: 'timing', duration: 80 } : BRUTAL_SPRING}
        style={styles.innerContent}
      >
        {/* ④ Icon: jumps up sharply on focus, wobbles on press */}
        <MotiView
          animate={{
            translateY: isFocused ? -3 : 0,
            scale: isFocused ? 1.15 : pressed ? 0.82 : 0.9,
            rotate: pressed ? '-8deg' : '0deg',
          }}
          transition={{
            translateY: BRUTAL_SPRING,
            scale: pressed ? { type: 'timing', duration: 80 } : BRUTAL_SPRING,
            rotate: pressed ? { type: 'timing', duration: 60 } : SETTLE_SPRING,
          }}
        >
          <Ionicons name={iconName} size={22} color={contentColor} />
          
          {/* Unread Badge */}
          {options.badge > 0 && (
            <MotiView 
              from={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={[
                styles.badge,
                { 
                  backgroundColor: isFocused ? colors.surface : colors.primary,
                  borderColor: isFocused ? colors.primary : colors.text
                }
              ]}
            >
              <Text style={[
                styles.badgeText,
                { color: isFocused ? colors.primary : colors.surface }
              ]}>
                {options.badge > 9 ? '9+' : options.badge}
              </Text>
            </MotiView>
          )}
        </MotiView>

        {/* ⑤ Label: slides + fades, collapses when not focused */}
        <MotiView
          animate={{
            opacity: isFocused ? 1 : 0,
            translateY: isFocused ? 0 : 8,
            scaleX: isFocused ? 1 : 0.7,
            scaleY: isFocused ? 1 : 0.5,
            marginTop: isFocused ? 3 : 0,
            // Collapse vertical space when hidden so icon stays centred
            maxHeight: isFocused ? 20 : 0,
          }}
          transition={{
            opacity: isFocused ? { ...BRUTAL_SPRING, delay: 60 } : COLOR_TIMING,
            translateY: BRUTAL_SPRING,
            scaleX: BRUTAL_SPRING,
            scaleY: BRUTAL_SPRING,
            marginTop: SETTLE_SPRING,
            maxHeight: SETTLE_SPRING,
          }}
        >
          <Text
            style={[
              styles.label,
              { color: contentColor, fontFamily: DT.typography.heading },
            ]}
          >
            {label as string}
          </Text>
        </MotiView>
      </MotiView>
    </Pressable>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { token } = useAuth();
  
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchUnreadCounts = async () => {
    if (!token) return;
    try {
      // Parallel fetch
      const [msgRes, notifRes] = await Promise.all([
        fetch(API.MESSAGES.UNREAD_COUNT, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(API.NOTIFICATIONS.UNREAD_COUNT, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setUnreadMessages(msgData.unread_count);
      }
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setUnreadNotifications(notifData.unread_count);
      }
    } catch (e) {
      console.error('Failed to fetch unread counts in TabBar:', e);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
    // Poll every 30s or use a trigger
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handlePress = useCallback(
    (route: any, isFocused: boolean) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        navigation.navigate(route.name, route.params);
      }
    },
    [navigation]
  );

  const handleLongPress = useCallback(
    (route: any) => {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      navigation.emit({ type: 'tabLongPress', target: route.key });
    },
    [navigation]
  );

  return (
    <View
      style={[
        styles.outerContainer,
        {
          shadowColor: colors.text,
          bottom: insets.bottom > 0 ? insets.bottom - 4 : 12,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          return (
            <TabItem
              key={route.key}
              route={route}
              index={index}
              isFocused={isFocused}
              isLast={index === state.routes.length - 1}
              options={{
                ...options,
                badge: route.name === 'messages' ? unreadMessages : (route.name === 'index' ? unreadNotifications : 0)
              }}
              colors={colors}
              onPress={() => handlePress(route, isFocused)}
              onLongPress={() => handleLongPress(route)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 4, height: 4 },
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    borderWidth: 2,
    borderRadius: 32,
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    paddingHorizontal: 2,
  },
  badgeText: {
    fontFamily: DT.typography.heading,
    fontSize: 9,
    fontWeight: '900',
  },
});