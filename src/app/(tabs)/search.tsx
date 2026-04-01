import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { DesignTokens as DT } from '../../constants/design';

const markets = ['Mile 12', 'Balogun', 'Yaba', 'Ikeja', 'Oshodi', 'Tejuosho'];
const categories = [
  { emoji: '🌶️', label: 'Produce' },
  { emoji: '👗', label: 'Fashion' },
  { emoji: '📱', label: 'Electronics' },
  { emoji: '💊', label: 'Pharmacy' },
  { emoji: '🍖', label: 'Meat' },
  { emoji: '🏠', label: 'Home' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Find Runners</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <View style={styles.searchIcon}>
            <Search size={20} color={DT.colors.surface} strokeWidth={2.5} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Market, area, or item..."
            placeholderTextColor={DT.colors.muted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Markets */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>POPULAR MARKETS</Text>
          <View style={styles.tagsWrap}>
            {markets.map((m) => (
              <TouchableOpacity key={m} style={styles.marketTag}>
                <Text style={styles.marketTagText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BROWSE BY CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {categories.map((c) => (
              <TouchableOpacity key={c.label} style={styles.categoryCard}>
                <Text style={styles.categoryEmoji}>{c.emoji}</Text>
                <Text style={styles.categoryLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DT.colors.background,
  },
  header: {
    paddingHorizontal: DT.spacing.lg,
    paddingVertical: DT.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: DT.colors.text,
  },
  title: {
    fontFamily: DT.typography.heading,
    fontSize: 24,
    color: DT.colors.text,
  },
  searchBox: {
    flexDirection: 'row',
    margin: DT.spacing.lg,
    borderWidth: 2,
    borderColor: DT.colors.text,
    backgroundColor: DT.colors.surface,
    shadowColor: DT.colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  searchIcon: {
    width: 48,
    backgroundColor: DT.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: DT.spacing.md,
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: DT.colors.text,
  },
  section: {
    paddingHorizontal: DT.spacing.lg,
    marginBottom: DT.spacing.lg,
  },
  sectionLabel: {
    fontFamily: DT.typography.heading,
    fontSize: 12,
    color: DT.colors.muted,
    letterSpacing: 1.5,
    marginBottom: DT.spacing.md,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DT.spacing.sm,
  },
  marketTag: {
    paddingHorizontal: DT.spacing.md,
    paddingVertical: DT.spacing.sm,
    backgroundColor: DT.colors.surface,
    borderWidth: 2,
    borderColor: DT.colors.text,
    shadowColor: DT.colors.text,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  marketTagText: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 14,
    color: DT.colors.text,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DT.spacing.md,
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: DT.colors.surface,
    borderWidth: 2,
    borderColor: DT.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DT.colors.text,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  categoryLabel: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: DT.colors.text,
  },
});
