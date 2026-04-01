import { Ionicons } from '@expo/vector-icons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useTheme } from '../../constants/theme';

export default function TabLayout() {
  const { colors } = useTheme();

  // `colors.primary` is already theme-resolved:
  //   light → #0A2540 (deep navy, visible on white bar)
  //   dark  → #4E8CE4 (bright blue, visible on dark bar)
  const activeColor = colors.primary;
  const inactiveColor = colors.muted;

  return (
    <NativeTabs
      tintColor={activeColor}
      labelStyle={{
        default: {
          fontFamily: 'WorkSans_500Medium',
          fontSize: 12,
          color: inactiveColor,
        },
        selected: {
          fontFamily: 'WorkSans_500Medium',
          fontSize: 12,
          color: activeColor,
        },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="home" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role='search'>
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="search" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="chatbubble" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="person" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

