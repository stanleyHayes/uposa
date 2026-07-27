import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { Brand, Fonts, Radii, type Palette } from '@/constants/theme';

export function AuthBrandPanel({
  palette,
  eyebrow,
  title,
  body,
}: {
  palette: Palette;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <View style={[styles.brandPanel, { borderColor: palette.border }]}>
      <Text style={styles.brandWatermark}>UPOSA</Text>
      <View style={[styles.crestRing, { borderColor: Brand.gold }]}>
        <Image source={require('../assets/images/logo.png')} style={styles.crest} contentFit="contain" transition={120} />
      </View>
      <Text style={styles.brandEyebrow}>{eyebrow}</Text>
      <Text style={styles.brandTitle}>{title}</Text>
      <Text style={styles.brandBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandPanel: {
    backgroundColor: Brand.navy,
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    ...Radii.hero,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  brandWatermark: {
    position: 'absolute',
    top: 18,
    right: 20,
    color: 'rgba(255,248,220,0.08)',
    fontSize: 64,
    fontFamily: Fonts.displayHeavy,
    letterSpacing: -2,
  },
  crestRing: {
    width: 108,
    height: 108,
    borderRadius: 0,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,248,220,0.06)',
    marginBottom: 18,
  },
  crest: { width: 84, height: 84 },
  brandEyebrow: {
    color: Brand.gold,
    fontSize: 11,
    fontFamily: Fonts.statusBold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  brandTitle: {
    color: Brand.cream,
    fontSize: 28,
    fontFamily: Fonts.display,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 8,
  },
  brandBody: {
    color: 'rgba(255,248,220,0.72)',
    fontSize: 14,
    fontFamily: Fonts.body,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
});
