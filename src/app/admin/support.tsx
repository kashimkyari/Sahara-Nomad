import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, LifeBuoy } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';

export default function AdminSupportScreen() {
  const router = useRouter();
  const colors = DT.admin;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 16,
        paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.lg,
        borderBottomWidth: 4, borderBottomColor: colors.text,
        backgroundColor: colors.surface,
      }}>
        <TouchableOpacity 
          style={{
            width: 44, height: 44, borderWidth: 3, borderColor: colors.text,
            backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
            shadowColor: colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
          }} 
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ fontFamily: DT.typography.heading, fontSize: 24, color: colors.text }}>LIVE SUPPORT</Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <LifeBuoy size={64} color={colors.muted} strokeWidth={1} />
        <Text style={{ fontFamily: DT.typography.heading, fontSize: 18, color: colors.text, marginTop: 16 }}>Live Support Tickets</Text>
        <Text style={{ fontFamily: DT.typography.body, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 8 }}>
          This feature is coming soon. You'll be able to reply to user support tickets in real-time.
        </Text>
      </View>
    </SafeAreaView>
  );
}
