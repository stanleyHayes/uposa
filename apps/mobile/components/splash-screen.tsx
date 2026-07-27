import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Brand, Fonts, Radii, type Palette } from '@/constants/theme';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function SplashScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette: Palette = Colors[scheme];

  const [logoScale] = useState(() => new Animated.Value(0));
  const [logoRotate] = useState(() => new Animated.Value(0));
  const [contentOpacity] = useState(() => new Animated.Value(0));
  const [barTranslate] = useState(() => new Animated.Value(-1));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, stiffness: 200, damping: 18, useNativeDriver: true }),
      Animated.timing(logoRotate, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 450, delay: 280, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(barTranslate, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, [logoScale, logoRotate, contentOpacity, barTranslate]);

  const rotate = logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] });
  const translateX = barTranslate.interpolate({ inputRange: [-1, 1], outputRange: [-192, 192] });

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Animated.View
        style={[
          styles.logoTile,
          {
            backgroundColor: Brand.navy,
            borderColor: palette.border,
            transform: [{ scale: logoScale }, { rotate }],
          },
        ]}
      >
        <Text style={styles.logoLetter}>U</Text>
      </Animated.View>

      <Animated.View style={{ opacity: contentOpacity, alignItems: 'center' }}>
        <Text style={[styles.brand, { color: palette.text }]}>UPOSA Alumni</Text>
        <Text style={[styles.tagline, { color: palette.textMuted }]}>Loading your portal...</Text>

        <View style={[styles.barTrack, { backgroundColor: palette.surfaceMuted }]}>
          <Animated.View style={[styles.barFill, { transform: [{ translateX }] }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const BAR_WIDTH = 192;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoTile: {
    width: 80,
    height: 80,
    borderWidth: 1,
    ...Radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  logoLetter: { color: Brand.cream, fontSize: 30, fontFamily: Fonts.displayHeavy },
  brand: { fontSize: 24, fontFamily: Fonts.display, marginBottom: 6 },
  tagline: { fontSize: 13, fontFamily: Fonts.body, marginBottom: 24 },
  barTrack: { width: BAR_WIDTH, height: 4, borderRadius: 0, overflow: 'hidden' },
  barFill: { width: BAR_WIDTH / 2, height: 4, backgroundColor: Brand.gold },
});
