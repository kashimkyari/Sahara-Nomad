import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TextInputProps,
  Platform,
  StyleSheet,
  ViewStyle
} from 'react-native';
import { DesignTokens as theme } from '../../constants/design';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input = ({ 
  label, 
  error, 
  containerStyle, 
  style,
  ...props 
}: InputProps) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={theme.colors.muted}
        style={[
          styles.input,
          error ? styles.inputError : null,
          Platform.OS === 'web' ? { outlineStyle: 'none' } as any : null,
          style
        ]}
        {...props}
      />
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontFamily: theme.typography.bodyMedium,
    color: theme.colors.text,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    height: 56,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    fontFamily: theme.typography.body,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputError: {
    borderColor: '#D92D20',
  },
  errorText: {
    color: '#D92D20',
    fontSize: 12,
    marginTop: 4,
    fontFamily: theme.typography.body,
  },
});

