import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { Input } from '../../components/ui/Input';
import { DesignTokens as theme } from '../../constants/design';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Find a Runner</Text>
        <Input 
          placeholder="Market, area, or task..." 
          containerStyle={styles.inputContainer}
        />
        
        <Text style={styles.sectionTitle}>Popular in Lagos</Text>
        <View style={styles.tagsContainer}>
          {['Balogun', 'Yaba', 'Island', 'Ikeja'].map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.heading,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.typography.heading,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tagText: {
    fontFamily: theme.typography.bodyMedium,
    color: theme.colors.text,
    fontSize: 13,
  },
});

