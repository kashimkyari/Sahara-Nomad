import { Ionicons } from '@expo/vector-icons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { DesignTokens as DT } from '../../constants/design';

export default function TabLayout() {
  const triggerOptions = {
    disableAutomaticContentInsets: true,
    contentStyle: { paddingBottom: 0 },
  };

  return (
    <NativeTabs
      backgroundColor={DT.colors.surface}
      blurEffect="systemMaterial"
      iconColor={{
        default: DT.colors.muted,
        selected: DT.colors.primary,
      }}
      labelStyle={{
        default: {
          fontFamily: 'PlusJakartaSans_500Medium',
          fontSize: 10,
          color: DT.colors.muted,
        },
        selected: {
          fontFamily: 'PlusJakartaSans_600SemiBold',
          fontSize: 10,
          color: DT.colors.primary,
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
        <NativeTabs.Trigger.Label>Runners</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="search-sharp" />}
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
