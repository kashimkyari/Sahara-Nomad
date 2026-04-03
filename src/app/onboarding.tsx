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
    id: '01',
    headline: 'SKIP THE TRAFFIC.\nWE RUN THE\nSTREETS.',
    body: 'Trusted neighbours source and deliver anything from any market across your city.',
  },
  {
    id: '02',
    headline: 'NAME IT.\nWE FIND IT.\nFRONT DOOR.',
    body: 'From Mile 12 tomatoes to Alaba electronics—if it exists, a Sendam runner can get it.',
  },
  {
    id: '03',
    headline: 'EARN WHILE\nYOU KNOW\nYOUR CITY.',
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
      router.replace('/auth');
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
            <View style={[styles.heroBox, { backgroundColor: i === 0 ? colors.accent : i === 1 ? colors.primary : colors.secondary }]}>
              <View style={styles.gridVertical} />
              <View style={styles.gridHorizontal} />
              
              <View style={styles.numberBadge}>
                <Text style={styles.numberBadgeText}>{slide.id}</Text>
              </View>
            </View>

            {/* Copy */}
            <View style={styles.copy}>
              <Text style={styles.headline}>{slide.headline}</Text>
              <Text style={styles.body}>{slide.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Fractional Pill Indicator */}
      <View style={styles.indicatorContainer}>
        <View style={styles.fractionPill}>
          <Text style={styles.fractionText}>{activeSlide + 1} / {slides.length}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={activeSlide === slides.length - 1 ? "Oya, let's go" : 'Next'}
          onPress={goNext}
        />
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.replace('/auth')}
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
    height: '60%',
    borderBottomWidth: 3,
    borderBottomColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  gridVertical: {
    position: 'absolute', width: 3, height: '100%', backgroundColor: colors.text, left: '50%',
  },
  gridHorizontal: {
    position: 'absolute', height: 3, width: '100%', backgroundColor: colors.text, top: '50%',
  },
  numberBadge: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.text,
    width: 120, height: 120,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.text, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6,
  },
  numberBadgeText: {
    fontFamily: DT.typography.heading, fontSize: 64, color: colors.text, letterSpacing: -2,
  },
  copy: {
    paddingHorizontal: DT.spacing.lg,
    paddingTop: DT.spacing.lg,
    flex: 1,
  },
  headline: {
    fontFamily: DT.typography.heading,
    fontSize: 40,
    color: colors.text,
    lineHeight: 44,
    marginBottom: DT.spacing.sm,
  },
  body: {
    fontFamily: DT.typography.body,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: DT.spacing.md,
  },
  fractionPill: {
    backgroundColor: colors.text,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: colors.text,
  },
  fractionText: {
    fontFamily: DT.typography.heading,
    fontSize: 18,
    color: colors.surface,
    letterSpacing: 4,
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
