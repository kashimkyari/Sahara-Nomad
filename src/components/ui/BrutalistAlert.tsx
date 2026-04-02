import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DesignTokens as DT } from '../../constants/design';
import { useTheme } from '../../hooks/use-theme';

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

const SLAM = { type: 'spring', stiffness: 480, damping: 20, mass: 0.7 } as const;
const RELEASE = { type: 'spring', stiffness: 380, damping: 22 } as const;
const FAST = { type: 'timing', duration: 80 } as const;
const COLOR = { type: 'timing', duration: 120 } as const;

// ─── Brutalist button: face shifts INTO the shadow on press ──────────────────
function BrutalButton({
  btn,
  index,
  colors,
  onClose,
}: {
  btn: AlertButton;
  index: number;
  colors: any;
  onClose: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  const isDestructive = btn.style === 'destructive';
  const isCancel = btn.style === 'cancel';

  const faceBg = isDestructive ? colors.error : isCancel ? colors.background : colors.text;
  const textColor = isCancel ? colors.text : colors.surface;

  const SHADOW_SIZE = 5;

  return (
    <View style={{ marginTop: index > 0 ? DT.spacing.sm : 0 }}>
      {/*
        Stack: shadow block sits BEHIND, face sits IN FRONT.
        On press, face translates +SHADOW_SIZE in both axes
        to sit flush with the shadow — looks physically depressed.
        On release, springs back.
      */}
      <View style={{ position: 'relative' }}>
        {/* Black shadow block — always static */}
        <View
          style={[
            styles.btnShadow,
            {
              backgroundColor: colors.text,
              top: SHADOW_SIZE,
              left: SHADOW_SIZE,
            },
          ]}
        />

        {/* Face */}
        <Pressable
          onPressIn={() => {
            setPressed(true);
            if (Platform.OS === 'ios')
              Haptics.impactAsync(
                isDestructive
                  ? Haptics.ImpactFeedbackStyle.Heavy
                  : Haptics.ImpactFeedbackStyle.Rigid
              );
          }}
          onPressOut={() => setPressed(false)}
          onPress={() => {
            if (btn.loading) return;
            btn.onPress?.();
            onClose();
          }}
          disabled={btn.loading}
        >
          <MotiView
            animate={{
              translateX: pressed ? SHADOW_SIZE : 0,
              translateY: pressed ? SHADOW_SIZE : 0,
              backgroundColor: faceBg,
            }}
            transition={{
              translateX: pressed ? FAST : RELEASE,
              translateY: pressed ? FAST : RELEASE,
              backgroundColor: COLOR,
            }}
            style={[styles.btnFace, { borderColor: colors.text }]}
          >
            {btn.loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={textColor} />
                {btn.loadingText && (
                  <Text style={[styles.btnText, { color: textColor }]}>
                    {btn.loadingText.toUpperCase()}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={[styles.btnText, { color: textColor }]}>
                {btn.text.toUpperCase()}
              </Text>
            )}
          </MotiView>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Alert ───────────────────────────────────────────────────────────────────
export const BrutalistAlert: React.FC<BrutalistAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onClose,
}) => {
  const { colors } = useTheme();

  const DIALOG_SHADOW = 8;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Dim overlay */}
      <MotiView
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ type: 'timing', duration: visible ? 160 : 100 }}
        style={styles.overlay}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        {/* Dialog wrapper — shadow + face stacked */}
        <View style={styles.dialogWrapper}>
          {/* Black shadow — static, always offset */}
          <View
            style={[
              styles.dialogShadow,
              {
                backgroundColor: colors.text,
                top: DIALOG_SHADOW,
                left: DIALOG_SHADOW,
              },
            ]}
          />

          {/* Dialog face — slams in on mount */}
          <MotiView
            animate={{
              translateY: visible ? 0 : -20,
              scale: visible ? 1 : 0.92,
              opacity: visible ? 1 : 0,
              rotateZ: visible ? '0deg' : '-1.5deg',
            }}
            transition={{
              translateY: visible ? SLAM : FAST,
              scale: visible ? SLAM : FAST,
              opacity: { type: 'timing', duration: visible ? 120 : 80 },
              rotateZ: visible ? SLAM : FAST,
            }}
            style={[
              styles.dialog,
              { backgroundColor: colors.surface, borderColor: colors.text },
            ]}
          >
            {/* Header — stamps down after dialog */}
            <MotiView
              animate={{
                scaleY: visible ? 1 : 0,
                opacity: visible ? 1 : 0,
              }}
              transition={{
                scaleY: visible ? { ...SLAM, delay: 100 } : FAST,
                opacity: { type: 'timing', duration: 100, delay: visible ? 100 : 0 },
              }}
              style={[
                styles.header,
                { backgroundColor: colors.primary, borderBottomColor: colors.text },
              ]}
            >
              <Text style={[styles.title, { color: colors.surface }]}>
                {title.toUpperCase()}
              </Text>
            </MotiView>

            {/* Body */}
            <MotiView
              animate={{ translateY: visible ? 0 : 10, opacity: visible ? 1 : 0 }}
              transition={{
                translateY: visible ? { ...RELEASE, delay: 140 } : FAST,
                opacity: { type: 'timing', duration: 140, delay: visible ? 140 : 0 },
              }}
              style={styles.body}
            >
              <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
            </MotiView>

            {/* Buttons — stagger in */}
            <View style={styles.footer}>
              {buttons.map((btn, i) => (
                <MotiView
                  key={i}
                  animate={{ translateY: visible ? 0 : 14, opacity: visible ? 1 : 0 }}
                  transition={{
                    translateY: visible ? { ...RELEASE, delay: 180 + i * 55 } : FAST,
                    opacity: {
                      type: 'timing',
                      duration: 140,
                      delay: visible ? 180 + i * 55 : 0,
                    },
                  }}
                >
                  <BrutalButton
                    btn={btn}
                    index={i}
                    colors={colors}
                    onClose={onClose}
                  />
                </MotiView>
              ))}
            </View>
          </MotiView>
        </View>
      </MotiView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: DT.spacing.lg,
  },
  // Wrapper gives room for the shadow to render without clipping
  dialogWrapper: {
    width: '100%',
    position: 'relative',
  },
  // Dialog shadow — absolutely fills same area as face, offset by DIALOG_SHADOW
  dialogShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: -8,   // mirror of left offset
    bottom: -8,  // mirror of top offset
  },
  dialog: {
    width: '100%',
    borderWidth: 4,
  },
  header: {
    padding: DT.spacing.md,
    borderBottomWidth: 4,
  },
  title: {
    fontFamily: DT.typography.heading,
    fontSize: 20,
  },
  body: {
    padding: DT.spacing.lg,
  },
  message: {
    fontFamily: DT.typography.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    padding: DT.spacing.md,
    paddingTop: 0,
  },
  // Button shadow — same trick, shadow is a sibling behind the face
  btnShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: -5,
    bottom: -5,
  },
  btnFace: {
    paddingVertical: DT.spacing.md,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: DT.typography.heading,
    fontSize: 14,
    letterSpacing: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DT.spacing.sm,
  },
});
