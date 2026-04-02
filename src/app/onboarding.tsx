import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { DesignTokens as DT } from '../constants/design';
import { useTheme } from '../hooks/use-theme';

const { width } = Dimensions.get('window');

const slides = [
  {
    emoji: '🛵',
    headline: 'Skip the traffic.\nLet locals run\nthe street.',
    body: 'Trusted neighbours source and deliver anything from any market across your city.',
  },
  {
    emoji: '🛒',
    headline: 'Name it.\nWe find it.\nFront door.',
    body: 'From Mile 12 tomatoes to Alaba electronics—if it exists, a Sendam runner can get it.',
  },
  {
    emoji: '💸',
    headline: 'Earn while\nyou know\nyour city.',
    body: 'Turn your market knowledge into cash. Pick errands near you and set your own schedule.',
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const styles = getStyles(colors);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveSlide(idx);
  };

  const goNext = () => {
    if (activeSlide < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeSlide + 1) * width, animated: true });
    } else {
      router.push('/auth');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.slider}
      >
        {slides.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            {/* Hero graphic area */}
            <View style={styles.heroBox}>
              <Text style={styles.heroEmoji}>{slide.emoji}</Text>
              {/* Decorative grid pattern */}
              <View style={styles.heroDecor1} />
              <View style={styles.heroDecor2} />
              <View style={styles.heroDecor3} />
            </View>

            {/* Copy */}
            <View style={styles.copy}>
              <Text style={styles.headline}>{slide.headline}</Text>
              <Text style={styles.body}>{slide.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeSlide && styles.dotActive]}
          />
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={activeSlide === slides.length - 1 ? "Oya, let's go" : 'Next'}
          onPress={goNext}
        />
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.loginText}>Log in instead</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slider: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  heroBox: {
    height: '62%',
    backgroundColor: colors.accent,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroEmoji: {
    fontSize: 120,
    zIndex: 1,
  },
  heroDecor1: {
    position: 'absolute',
    width: 140,
    height: 140,
    backgroundColor: colors.primary,
    top: -30,
    right: -30,
    borderWidth: 2,
    borderColor: colors.text,
    transform: [{ rotate: '15deg' }],
  },
  heroDecor2: {
    position: 'absolute',
    width: 80,
    height: 80,
    backgroundColor: colors.secondary,
    bottom: -20,
    left: 30,
    borderWidth: 2,
    borderColor: colors.text,
    transform: [{ rotate: '-10deg' }],
  },
  heroDecor3: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: colors.surface,
    top: 60,
    left: -15,
    borderWidth: 2,
    borderColor: colors.text,
    transform: [{ rotate: '25deg' }],
  },
  copy: {
    paddingHorizontal: DT.spacing.lg,
    paddingTop: DT.spacing.lg,
    flex: 1,
  },
  headline: {
    fontFamily: DT.typography.heading,
    fontSize: 32,
    color: colors.text,
    lineHeight: 36,
    marginBottom: DT.spacing.sm,
  },
  body: {
    fontFamily: DT.typography.body,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: DT.spacing.sm,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: colors.muted,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.text,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  actions: {
    paddingHorizontal: DT.spacing.lg,
    paddingBottom: DT.spacing.lg,
    gap: 12,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: DT.spacing.sm,
  },
  loginText: {
    fontFamily: DT.typography.body,
    fontSize: 16,
    color: colors.text,
    textDecorationLine: 'underline',
  },
});
