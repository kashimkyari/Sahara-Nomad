import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[
      styles.outerContainer,
      {
        shadowColor: colors.text,
        bottom: insets.bottom > 0 ? insets.bottom - 4 : 12,
      }
    ]}>
      <View style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }
      ]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Map route names to icons
          let iconName: any = 'home';
          if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
          else if (route.name === 'search') iconName = isFocused ? 'search' : 'search-outline';
          else if (route.name === 'messages') iconName = isFocused ? 'chatbubble' : 'chatbubble-outline';
          else if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';

          // Brutalist high-contrast logic
          const isActiveBg = isFocused ? colors.primary : colors.surface;
          const contentColor = isFocused ? colors.surface : colors.text;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as any).tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabItem,
                {
                  backgroundColor: isActiveBg,
                  borderRightWidth: index === state.routes.length - 1 ? 0 : 2,
                  borderRightColor: colors.border,
                  paddingVertical: 10,
                }
              ]}
              activeOpacity={1} // Brutalist interaction removes soft fades
            >
              <Ionicons
                name={iconName}
                size={22}
                color={contentColor}
              />
              <Text style={[
                styles.label,
                {
                  color: contentColor,
                  fontFamily: DT.typography.heading, // Always bold for maximum impact
                }
              ]}>
                {label as string}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 4, height: 4 },
    elevation: 8, // Try to retain some shadow on Android
  },
  container: {
    flexDirection: 'row',
    borderWidth: 2,
    borderRadius: 32, // Pill shape
    overflow: 'hidden', // Keep active bg inside the rounded corners
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase', // Neo-brutalist feel
    letterSpacing: 0.5,
  },
});
