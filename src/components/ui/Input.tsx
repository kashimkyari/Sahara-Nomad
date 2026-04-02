import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
  containerStyle?: object;
  style?: object;
}

export const Input = React.forwardRef<TextInput, InputProps>(({
  label,
  error,
  rightElement,
  containerStyle,
  style,
  ...props
}, ref) => {
  const { colors } = useTheme();
  const hasError = !!error;
  const styles = getStyles(colors);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, hasError && styles.inputError]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.muted}
          {...props}
        />
        {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
      </View>
      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
});

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: DT.spacing.md,
  },
  label: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: colors.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  inputWrapper: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.text,
    borderRadius: 0,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: DT.spacing.md,
    fontFamily: DT.typography.body,
    fontSize: 16,
    color: colors.text,
  },
  right: {
    paddingRight: DT.spacing.md,
  },
  errorText: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
});
