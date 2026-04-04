import React, { useEffect } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

interface NeobrutalistToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeColor: string;
  colors: any;
}

export const NeobrutalistToggle = ({ value, onValueChange, activeColor, colors }: NeobrutalistToggleProps) => {
  const thumbAnim = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(thumbAnim, {
      toValue: value ? 1 : 0,
      friction: 8,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        {
          backgroundColor: value ? activeColor : colors.background,
          borderColor: colors.text
        }
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: colors.surface,
            borderColor: colors.text,
            transform: [{ translateX }]
          }
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 28,
    borderWidth: 2,
    borderRadius: 0,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  thumb: {
    width: 22,
    height: 20,
    borderWidth: 2,
    borderRadius: 0,
  },
});
