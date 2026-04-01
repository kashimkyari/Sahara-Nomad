import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Home, MessageSquare, Search, User } from 'lucide-react-native';
import React from 'react';
import { DesignTokens as theme } from '../../constants/design';

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor={theme.colors.primary}
      labelStyle={{
        default: {
          fontFamily: 'WorkSans_500Medium',
          fontSize: 12,
          color: '#8792A2',
        },
        selected: {
          fontFamily: 'WorkSans_500Medium',
          fontSize: 12,
          color: theme.colors.primary,
        },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<Home size={24} color={theme.colors.primary} />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role='search'>
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<Search size={24} color={theme.colors.primary} />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<MessageSquare size={24} color={theme.colors.primary} />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={<User size={24} color={theme.colors.primary} />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

