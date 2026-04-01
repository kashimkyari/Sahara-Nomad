import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { Input } from '../../components/ui/Input';
import { useTheme } from '../../constants/theme';

export default function SearchScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const styles = getStyles(colors, typography, spacing, radius);

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

const getStyles = (colors: any, typography: any, spacing: any, radius: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: typography.heading,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.heading,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagText: {
    fontFamily: typography.bodyMedium,
    color: colors.text,
    fontSize: 13,
  },
});


