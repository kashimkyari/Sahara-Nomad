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

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
  containerStyle?: object;
  style?: object;
}

export function Input({
  label,
  error,
  rightElement,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const hasError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, hasError && styles.inputError]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={DT.colors.muted}
          {...props}
        />
        {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
      </View>
      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DT.spacing.md,
  },
  label: {
    fontFamily: DT.typography.body,
    fontSize: 13,
    color: DT.colors.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  inputWrapper: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DT.colors.text,
    borderRadius: 0,
    backgroundColor: DT.colors.surface,
  },
  inputError: {
    borderColor: DT.colors.error,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: DT.spacing.md,
    fontFamily: DT.typography.body,
    fontSize: 16,
    color: DT.colors.text,
  },
  right: {
    paddingRight: DT.spacing.md,
  },
  errorText: {
    fontFamily: DT.typography.body,
    fontSize: 12,
    color: DT.colors.error,
    marginTop: 4,
  },
});
