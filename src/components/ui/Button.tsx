import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';
import { DesignTokens as DT } from '../../constants/design';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  style?: object;
}

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: ButtonProps) {
  const shadowAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(shadowAnim, {
      toValue: 0,
      useNativeDriver: false,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(shadowAnim, {
      toValue: 1,
      useNativeDriver: false,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const shadowOffset = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  const isPrimary = variant === 'primary';

  return (
    <Animated.View
      style={[
        styles.shadow,
        {
          shadowOffset: { width: shadowOffset as any, height: shadowOffset as any },
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          styles.button,
          isPrimary ? styles.primary : styles.outline,
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <View style={styles.loadingSquare} />
        ) : (
          <Text style={[styles.label, !isPrimary && styles.outlineLabel]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: DT.colors.text,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  button: {
    height: 56,
    borderWidth: 2,
    borderColor: DT.colors.text,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DT.spacing.lg,
  },
  primary: {
    backgroundColor: DT.colors.primary,
  },
  outline: {
    backgroundColor: DT.colors.surface,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: DT.colors.surface,
    letterSpacing: 0.3,
  },
  outlineLabel: {
    color: DT.colors.text,
  },
  loadingSquare: {
    width: 18,
    height: 18,
    backgroundColor: DT.colors.surface,
    borderWidth: 2,
    borderColor: DT.colors.surface,
    borderRadius: 0,
  },
});
