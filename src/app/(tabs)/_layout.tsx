import { Ionicons } from '@expo/vector-icons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useTheme } from '../../constants/theme';

export default function TabLayout() {
  const { colors } = useTheme();

  // Shared per-tab options to kill the bottom inset that creates a solid footer bg
  const triggerOptions = {
    disableAutomaticContentInsets: true,
    contentStyle: { paddingBottom: 0 },
  };

  return (
    <NativeTabs
      backgroundColor="transparent"
      blurEffect="systemMaterial"
      iconColor={{
        default: colors.muted,
        selected: colors.primary,
      }}
      labelStyle={{
        default: {
          fontFamily: 'WorkSans_500Medium',
          fontSize: 10,
          color: colors.muted,
        },
        selected: {
          fontFamily: 'WorkSans_500Medium',
          fontSize: 12,
          color: colors.primary,
        },
      }}
    >
      <NativeTabs.Trigger name="index" {...triggerOptions}>
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="home" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role="search" {...triggerOptions}>
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="search" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="messages" {...triggerOptions}>
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="chatbubble" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile" {...triggerOptions}>
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="person" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

