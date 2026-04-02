import React, { useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { DesignTokens as DT } from '../../constants/design';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
  loading?: boolean;
  loadingText?: string;
}

interface BrutalistAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  onClose: () => void;
}

export const BrutalistAlert: React.FC<BrutalistAlertProps> = ({ 
  visible, 
  title, 
  message, 
  buttons,
  onClose 
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const styles = getStyles(colors);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.container, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title.toUpperCase()}</Text>
          </View>
          
          <View style={styles.body}>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.footer}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isDestructive && { backgroundColor: colors.error },
                    isCancel && { backgroundColor: colors.background },
                    index > 0 && { marginTop: DT.spacing.sm }
                  ]}
                  onPress={() => {
                    if (btn.loading) return;
                    if (btn.onPress) btn.onPress();
                    if (!btn.loading) onClose();
                  }}
                  disabled={btn.loading}
                >
                  {btn.loading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: DT.spacing.sm }}>
                      <ActivityIndicator color={isDestructive ? colors.surface : colors.text} />
                      {btn.loadingText && (
                        <Text style={[
                          styles.buttonText,
                          isDestructive && { color: colors.surface },
                          isCancel && { color: colors.text }
                        ]}>
                          {btn.loadingText.toUpperCase()}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={[
                      styles.buttonText,
                      isDestructive && { color: colors.surface },
                      isCancel && { color: colors.text }
                    ]}>
                      {btn.text.toUpperCase()}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: DT.spacing.lg,
  },
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: colors.text,
    shadowColor: colors.text,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  header: {
    padding: DT.spacing.md,
    borderBottomWidth: 4,
    borderBottomColor: colors.text,
    backgroundColor: colors.primary,
  },
  title: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
    color: colors.surface,
  },
  body: {
    padding: DT.spacing.lg,
  },
  message: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  footer: {
    padding: DT.spacing.md,
    paddingTop: 0,
  },
  button: {
    width: '100%',
    paddingVertical: DT.spacing.md,
    borderWidth: 3,
    borderColor: colors.text,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  buttonText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    color: colors.surface,
    letterSpacing: 1,
  },
});
