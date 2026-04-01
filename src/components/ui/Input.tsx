import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TextInputProps, 
  StyleSheet,
  ViewStyle,
  Platform
} from 'react-native';
import { useTheme } from '../../constants/theme';

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
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: spacing.md }, containerStyle]}>
      {label && (
        <Text style={[
          styles.label, 
          { fontFamily: typography.bodyMedium, color: colors.text }
        ]}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.sm,
            fontFamily: typography.body,
            color: colors.text,
            paddingHorizontal: spacing.md,
          },
          error ? styles.inputError : null,
          Platform.OS === 'web' ? { outlineStyle: 'none' } as any : null,
          style
        ]}
        {...props}
      />
      {error && (
        <Text style={[
          styles.errorText, 
          { fontFamily: typography.body }
        ]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    height: 56,
    borderWidth: 1,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#D92D20',
  },
  errorText: {
    color: '#D92D20',
    fontSize: 12,
    marginTop: 4,
  },
});


