import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Image, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';

export default function EditProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('Chidi Amaechi');
  const [email, setEmail] = useState('chidi@example.com');
  const [bio, setBio] = useState('Busy professional in Lagos. Need things done fast!');
  const [location, setLocation] = useState('Ikoyi, Lagos');

  const handleSave = () => {
    Alert.alert('Saved', 'Profile updated successfully!');
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={DT.colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
          <Text style={styles.saveHeaderText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?u=chidi' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraBtn}>
              <Camera size={16} color={DT.colors.surface} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <Text style={styles.sectionLabel}>PERSONAL INFO</Text>
        <View style={styles.group}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={DT.colors.muted}
            />
          </View>
          <View style={styles.fieldDivider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.fieldInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="your@email.com"
              placeholderTextColor={DT.colors.muted}
            />
          </View>
          <View style={styles.fieldDivider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput
              style={styles.fieldInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Area, City"
              placeholderTextColor={DT.colors.muted}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: DT.spacing.lg }]}>BIO</Text>
        <View style={styles.group}>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell runners a bit about yourself..."
            placeholderTextColor={DT.colors.muted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        <Text style={styles.charCount}>{bio.length}/160</Text>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create;
const styles = S({
  safeArea: { flex: 1, backgroundColor: DT.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: DT.spacing.lg, paddingVertical: DT.spacing.md,
    borderBottomWidth: 2, borderBottomColor: DT.colors.text,
  },
  backBtn: {
    width: 40, height: 40, borderWidth: 2, borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: DT.typography.heading, fontSize: 20, color: DT.colors.text },
  saveHeaderBtn: {
    backgroundColor: DT.colors.primary, borderWidth: 2, borderColor: DT.colors.text,
    paddingHorizontal: DT.spacing.md, paddingVertical: 6,
    shadowColor: DT.colors.text, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  saveHeaderText: { fontFamily: DT.typography.heading, fontSize: 13, color: DT.colors.surface },
  scroll: { paddingHorizontal: DT.spacing.lg, paddingTop: DT.spacing.lg, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: DT.spacing.xl },
  avatarWrapper: { position: 'relative', marginBottom: 8 },
  avatar: {
    width: 88, height: 88, borderWidth: 3, borderColor: DT.colors.text,
    shadowColor: DT.colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  cameraBtn: {
    position: 'absolute', bottom: -4, right: -4, width: 28, height: 28,
    backgroundColor: DT.colors.primary, borderWidth: 2, borderColor: DT.colors.text,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { fontFamily: DT.typography.body, fontSize: 12, color: DT.colors.muted },
  sectionLabel: {
    fontFamily: DT.typography.heading, fontSize: 11, color: DT.colors.muted,
    letterSpacing: 1.5, marginBottom: DT.spacing.md,
  },
  group: {
    borderWidth: 2, borderColor: DT.colors.text, backgroundColor: DT.colors.surface,
    shadowColor: DT.colors.text, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: DT.spacing.md, paddingVertical: 4,
    minHeight: 52,
  },
  fieldLabel: {
    fontFamily: DT.typography.bodySemiBold, fontSize: 13, color: DT.colors.muted,
    width: 80, flexShrink: 0,
  },
  fieldInput: {
    flex: 1, fontFamily: DT.typography.body, fontSize: 15, color: DT.colors.text,
    paddingVertical: DT.spacing.sm,
  },
  fieldDivider: { height: 2, backgroundColor: DT.colors.text, marginHorizontal: 0 },
  bioInput: {
    padding: DT.spacing.md, fontFamily: DT.typography.body, fontSize: 15,
    color: DT.colors.text, minHeight: 100,
  },
  charCount: {
    fontFamily: DT.typography.body, fontSize: 11, color: DT.colors.muted,
    alignSelf: 'flex-end', marginTop: 4, marginBottom: DT.spacing.lg,
  },
  saveBtn: {
    height: 56, backgroundColor: DT.colors.primary, borderWidth: 2, borderColor: DT.colors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: DT.colors.text, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  saveBtnText: { fontFamily: DT.typography.heading, fontSize: 17, color: DT.colors.surface },
});
